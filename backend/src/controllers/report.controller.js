const { Op } = require("sequelize");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Attendance, User, Department } = require("../models");
const { exportToExcel, exportToPdf } = require("../utils/export.util");

const REPORT_COLUMNS = [
  { header: "Employee ID", key: "employeeCode", width: 15 },
  { header: "Name", key: "fullName", width: 22 },
  { header: "Department", key: "department", width: 18 },
  { header: "Date", key: "date", width: 14 },
  { header: "Check In", key: "checkIn", width: 12 },
  { header: "Check Out", key: "checkOut", width: 12 },
  { header: "Working Hours", key: "workingHours", width: 14 },
  { header: "Status", key: "status", width: 12 },
];
const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "-";
// const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-');

const toReportRows = (records) =>
  records.map((r) => ({
    employeeCode: r.User?.employee_code,
    fullName: r.User?.full_name,
    department: r.User?.Department?.name || "-",
    date: r.attendance_date,
    checkIn: fmtTime(r.check_in_time),
    checkOut: fmtTime(r.check_out_time),
    workingHours: r.working_hours ?? "-",
    status: r.status,
  }));

/**
 * Resolves a `range` query param ('daily' | 'weekly' | 'monthly') plus
 * optional explicit startDate/endDate into a concrete date range.
 */
const resolveRange = ({ range, date, startDate, endDate }) => {
  if (startDate && endDate) return { startDate, endDate };

  const base = date ? new Date(date) : new Date();

  if (range === "weekly") {
    const day = base.getDay();
    const start = new Date(base);
    start.setDate(base.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  if (range === "monthly") {
    const y = base.getFullYear();
    const m = base.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  // daily (default)
  const d = base.toISOString().slice(0, 10);
  return { startDate: d, endDate: d };
};

const fetchReportRecords = async ({
  startDate,
  endDate,
  departmentId,
  userId,
}) => {
  const where = { attendance_date: { [Op.between]: [startDate, endDate] } };
  if (userId) where.user_id = userId;

  const userWhere = {};
  if (departmentId) userWhere.department_id = departmentId;

  return Attendance.findAll({
    where,
    include: [
      {
        model: User,
        where: Object.keys(userWhere).length ? userWhere : undefined,
        attributes: ["id", "employee_code", "full_name"],
        include: [{ model: Department, attributes: ["name"] }],
      },
    ],
    order: [
      ["attendance_date", "ASC"],
      [User, "full_name", "ASC"],
    ],
  });
};

/**
 * GET /api/reports
 * JSON report data (daily/weekly/monthly, optional department/employee filter).
 */
const getReport = asyncHandler(async (req, res) => {
  const {
    range = "daily",
    date,
    startDate: qsStart,
    endDate: qsEnd,
    departmentId,
    userId,
  } = req.query;
  const { startDate, endDate } = resolveRange({
    range,
    date,
    startDate: qsStart,
    endDate: qsEnd,
  });

  const records = await fetchReportRecords({
    startDate,
    endDate,
    departmentId,
    userId,
  });

  return new ApiResponse(200, {
    startDate,
    endDate,
    range,
    totalRecords: records.length,
    records: toReportRows(records),
  }).send(res);
});

/**
 * GET /api/reports/export/excel
 */
const exportExcelReport = asyncHandler(async (req, res) => {
  const {
    range = "daily",
    date,
    startDate: qsStart,
    endDate: qsEnd,
    departmentId,
    userId,
  } = req.query;
  const { startDate, endDate } = resolveRange({
    range,
    date,
    startDate: qsStart,
    endDate: qsEnd,
  });

  const records = await fetchReportRecords({
    startDate,
    endDate,
    departmentId,
    userId,
  });
  const rows = toReportRows(records);

  await exportToExcel(res, {
    title: `Attendance ${range}`,
    columns: REPORT_COLUMNS,
    rows,
    filename: `attendance_${range}_${startDate}_to_${endDate}`,
  });
});

/**
 * GET /api/reports/export/pdf
 */
const exportPdfReport = asyncHandler(async (req, res) => {
  const {
    range = "daily",
    date,
    startDate: qsStart,
    endDate: qsEnd,
    departmentId,
    userId,
  } = req.query;
  const { startDate, endDate } = resolveRange({
    range,
    date,
    startDate: qsStart,
    endDate: qsEnd,
  });

  const records = await fetchReportRecords({
    startDate,
    endDate,
    departmentId,
    userId,
  });
  const rows = toReportRows(records);

  exportToPdf(res, {
    title: `Attendance Report (${startDate} to ${endDate})`,
    columns: REPORT_COLUMNS,
    rows,
    filename: `attendance_${range}_${startDate}_to_${endDate}`,
  });
});

/**
 * GET /api/reports/employee/:id
 * Employee-wise report over a custom date range.
 */
const getEmployeeReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate)
    throw ApiError.badRequest("startDate and endDate are required");

  const records = await fetchReportRecords({ startDate, endDate, userId: id });

  return new ApiResponse(200, {
    startDate,
    endDate,
    totalRecords: records.length,
    records: toReportRows(records),
  }).send(res);
});

module.exports = {
  getReport,
  exportExcelReport,
  exportPdfReport,
  getEmployeeReport,
};
