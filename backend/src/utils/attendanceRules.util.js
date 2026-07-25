const env = require('../config/env');

/**
 * Determines whether a check-in time counts as "late" based on the
 * configured office start time + grace period.
 */
const isLateCheckIn = (checkInDate) => {
  const [startH, startM] = env.OFFICE_START_TIME.split(':').map(Number);
  const cutoff = new Date(checkInDate);
  cutoff.setHours(startH, startM + env.LATE_MARK_GRACE_MINUTES, 0, 0);
  return checkInDate > cutoff;
};

/**
 * Computes working hours (decimal) between check-in and check-out.
 */
const computeWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const ms = new Date(checkOut) - new Date(checkIn);
  if (ms <= 0) return 0;
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
};

/**
 * Determines final attendance status once check-out has happened,
 * based on total working hours vs configured thresholds.
 */
const computeFinalStatus = (workingHours, wasLate) => {
  if (workingHours === null || workingHours === undefined) return wasLate ? 'late' : 'present';
  if (workingHours < env.HALF_DAY_MIN_HOURS) return 'half_day';
  if (workingHours < env.FULL_DAY_MIN_HOURS) return wasLate ? 'late' : 'half_day';
  return wasLate ? 'late' : 'present';
};

/**
 * Returns today's date in YYYY-MM-DD (server local time), used as the
 * canonical key for one-attendance-record-per-day-per-employee.
 */
const todayDateOnly = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

module.exports = { isLateCheckIn, computeWorkingHours, computeFinalStatus, todayDateOnly };
