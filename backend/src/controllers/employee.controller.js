const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { User, Department, Designation, QrToken } = require('../models');
const { hashPassword } = require('../utils/password.util');
const { generateSecureToken, buildQrPayload, generateQrImage } = require('../utils/qr.util');
const env = require('../config/env');
const { recordAudit } = require('../utils/audit.util');

const includeMeta = [
  { model: Department, attributes: ['id', 'name'] },
  { model: Designation, attributes: ['id', 'title'] },
];

/**
 * Generates the next sequential employee code, e.g. EMP-0001.
 */
const generateEmployeeCode = async () => {
  const count = await User.count();
  return `EMP-${String(count + 1).padStart(4, '0')}`;
};

/**
 * Issues a brand-new active QR token for a user, deactivating any prior
 * active token so only one valid QR exists at a time.
 */
const issueQrTokenForUser = async (userId) => {
  await QrToken.update({ is_active: false }, { where: { user_id: userId, is_active: true } });

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + env.QR_TOKEN_ROTATE_MINUTES * 60 * 1000);

  const qrToken = await QrToken.create({
    user_id: userId,
    token,
    expires_at: expiresAt,
  });

  return qrToken;
};

/**
 * POST /api/employees
 * Super Admin / Admin: create a new employee or admin account.
 */
const createEmployee = asyncHandler(async (req, res) => {
  const { fullName, email, phone, role, departmentId, designationId, dateOfJoining, password } = req.body;

  // Only super_admin can create admin accounts
  if (role === 'admin' && req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Only Super Admin can create Admin accounts');
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const employee_code = await generateEmployeeCode();
  const password_hash = await hashPassword(password);

  const user = await User.create({
    employee_code,
    full_name: fullName,
    email,
    phone: phone || null,
    role,
    department_id: departmentId || null,
    designation_id: designationId || null,
    date_of_joining: dateOfJoining || null,
    password_hash,
  });

  await issueQrTokenForUser(user.id);
  await recordAudit({ req, action: 'EMPLOYEE_CREATED', entityType: 'User', entityId: user.id });

  const created = await User.findByPk(user.id, { include: includeMeta });
  return new ApiResponse(201, { user: created }, 'Employee created successfully').send(res);
});

/**
 * GET /api/employees
 * List employees with pagination, search, and filters.
 */
const getEmployees = asyncHandler(async (req, res) => {
  const { search, department, role, status, page = 1, limit = 20 } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { employee_code: { [Op.like]: `%${search}%` } },
    ];
  }
  if (department) where.department_id = department;
  if (role) where.role = role;
  if (status === 'active') where.is_active = true;
  if (status === 'inactive') where.is_active = false;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { rows, count } = await User.findAndCountAll({
    where,
    include: includeMeta,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset,
  });

  return new ApiResponse(200, {
    employees: rows,
    pagination: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10), pages: Math.ceil(count / limit) },
  }).send(res);
});

/**
 * GET /api/employees/:id
 */
const getEmployeeById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, { include: includeMeta });
  if (!user) throw ApiError.notFound('Employee not found');
  return new ApiResponse(200, { user }).send(res);
});

/**
 * PUT /api/employees/:id
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('Employee not found');

  if (user.role === 'admin' && req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Only Super Admin can modify Admin accounts');
  }

  const { fullName, email, phone, departmentId, designationId, dateOfJoining } = req.body;

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) throw ApiError.conflict('Email already in use');
  }

  await user.update({
    full_name: fullName ?? user.full_name,
    email: email ?? user.email,
    phone: phone ?? user.phone,
    department_id: departmentId ?? user.department_id,
    designation_id: designationId ?? user.designation_id,
    date_of_joining: dateOfJoining ?? user.date_of_joining,
  });

  await recordAudit({ req, action: 'EMPLOYEE_UPDATED', entityType: 'User', entityId: user.id });

  const updated = await User.findByPk(user.id, { include: includeMeta });
  return new ApiResponse(200, { user: updated }, 'Employee updated successfully').send(res);
});

/**
 * DELETE /api/employees/:id
 * Hard delete — only Super Admin. Prefer deactivation for normal offboarding.
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Only Super Admin can permanently delete employees');
  }
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('Employee not found');
  if (user.id === req.user.id) throw ApiError.badRequest('You cannot delete your own account');

  await user.destroy();
  await recordAudit({ req, action: 'EMPLOYEE_DELETED', entityType: 'User', entityId: req.params.id });

  return new ApiResponse(200, null, 'Employee deleted successfully').send(res);
});

/**
 * PATCH /api/employees/:id/status
 * Activate / deactivate an employee.
 */
const toggleEmployeeStatus = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('Employee not found');
  if (user.id === req.user.id) throw ApiError.badRequest('You cannot change your own status');
  if (user.role === 'admin' && req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Only Super Admin can modify Admin accounts');
  }

  await user.update({ is_active: !user.is_active });

  // Deactivated users lose all active sessions immediately
  if (!user.is_active) {
    const { RefreshToken } = require('../models');
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { user_id: user.id, revoked_at: null } }
    );
  }

  await recordAudit({
    req,
    action: user.is_active ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
    entityType: 'User',
    entityId: user.id,
  });

  return new ApiResponse(200, { user }, `Employee ${user.is_active ? 'activated' : 'deactivated'} successfully`).send(res);
});

/**
 * GET /api/employees/:id/qrcode
 * Returns the current QR code image (data URL) for an employee. Admins
 * can view any employee's QR; employees can only view their own.
 */
const getEmployeeQrCode = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  if (req.user.role === 'employee' && req.user.id !== targetId) {
    throw ApiError.forbidden('You can only access your own QR code');
  }

  let qrToken = await QrToken.findOne({
    where: { user_id: targetId, is_active: true, expires_at: { [Op.gt]: new Date() } },
    order: [['created_at', 'DESC']],
  });

  // Auto-rotate if expired or missing
  if (!qrToken) {
    const user = await User.findByPk(targetId);
    if (!user) throw ApiError.notFound('Employee not found');
    qrToken = await issueQrTokenForUser(targetId);
  }

  const payload = buildQrPayload(qrToken.token);
  const qrImageDataUrl = await generateQrImage(payload);

  return new ApiResponse(200, {
    qrImageDataUrl,
    expiresAt: qrToken.expires_at,
  }).send(res);
});

/**
 * POST /api/employees/:id/qrcode/rotate
 * Manually force-rotate an employee's QR token (e.g. if compromised).
 */
const rotateEmployeeQrCode = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const user = await User.findByPk(targetId);
  if (!user) throw ApiError.notFound('Employee not found');

  const qrToken = await issueQrTokenForUser(targetId);
  const payload = buildQrPayload(qrToken.token);
  const qrImageDataUrl = await generateQrImage(payload);

  await recordAudit({ req, action: 'QR_TOKEN_ROTATED', entityType: 'User', entityId: targetId });

  return new ApiResponse(200, { qrImageDataUrl, expiresAt: qrToken.expires_at }, 'QR code rotated').send(res);
});

/**
 * POST /api/employees/:id/photo
 * Upload/replace profile photo.
 */
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  if (req.user.role === 'employee' && req.user.id !== targetId) {
    throw ApiError.forbidden('You can only update your own profile photo');
  }
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const user = await User.findByPk(targetId);
  if (!user) throw ApiError.notFound('Employee not found');

  const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
  await user.update({ profile_photo_url: photoUrl });

  await recordAudit({ req, action: 'PROFILE_PHOTO_UPDATED', entityType: 'User', entityId: targetId });

  return new ApiResponse(200, { profilePhotoUrl: photoUrl }, 'Profile photo updated').send(res);
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  getEmployeeQrCode,
  rotateEmployeeQrCode,
  uploadProfilePhoto,
  issueQrTokenForUser,
};
