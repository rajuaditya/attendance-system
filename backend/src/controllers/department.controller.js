const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { Department, Designation } = require('../models');
const { recordAudit } = require('../utils/audit.util');

/* ---------------------- Departments ---------------------- */

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.findAll({ order: [['name', 'ASC']] });
  return new ApiResponse(200, { departments }).send(res);
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw ApiError.badRequest('Department name is required');
  const department = await Department.create({ name, description });
  await recordAudit({ req, action: 'DEPARTMENT_CREATED', entityType: 'Department', entityId: department.id });
  return new ApiResponse(201, { department }, 'Department created').send(res);
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  await department.update(req.body);
  return new ApiResponse(200, { department }, 'Department updated').send(res);
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  await department.destroy();
  return new ApiResponse(200, null, 'Department deleted').send(res);
});

/* ---------------------- Designations ---------------------- */

const getDesignations = asyncHandler(async (req, res) => {
  const designations = await Designation.findAll({ order: [['title', 'ASC']] });
  return new ApiResponse(200, { designations }).send(res);
});

const createDesignation = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) throw ApiError.badRequest('Designation title is required');
  const designation = await Designation.create({ title });
  await recordAudit({ req, action: 'DESIGNATION_CREATED', entityType: 'Designation', entityId: designation.id });
  return new ApiResponse(201, { designation }, 'Designation created').send(res);
});

const updateDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findByPk(req.params.id);
  if (!designation) throw ApiError.notFound('Designation not found');
  await designation.update(req.body);
  return new ApiResponse(200, { designation }, 'Designation updated').send(res);
});

const deleteDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findByPk(req.params.id);
  if (!designation) throw ApiError.notFound('Designation not found');
  await designation.destroy();
  return new ApiResponse(200, null, 'Designation deleted').send(res);
});

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
};
