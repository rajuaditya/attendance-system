require('dotenv').config();

/**
 * Centralized, validated environment configuration.
 * Fail fast if a required secret is missing in production.
 */
const required = (name, fallback = undefined) => {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_NAME: process.env.DB_NAME || 'attendance_system',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DIALECT: process.env.DB_DIALECT || 'mysql',
DB_USE_SSL: process.env.DB_USE_SSL === 'true',

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET', 'dev_access_secret_change_me_32chars'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me_32chars'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',

  RESET_TOKEN_EXPIRES_MIN: parseInt(process.env.RESET_TOKEN_EXPIRES_MIN || '30', 10),

  QR_TOKEN_ROTATE_MINUTES: parseInt(process.env.QR_TOKEN_ROTATE_MINUTES || '1440', 10),
  QR_SECRET: required('QR_SECRET', 'dev_qr_secret_change_me_32chars'),

  OFFICE_START_TIME: process.env.OFFICE_START_TIME || '09:30',
  LATE_MARK_GRACE_MINUTES: parseInt(process.env.LATE_MARK_GRACE_MINUTES || '15', 10),
  HALF_DAY_MIN_HOURS: parseFloat(process.env.HALF_DAY_MIN_HOURS || '4'),
  FULL_DAY_MIN_HOURS: parseFloat(process.env.FULL_DAY_MIN_HOURS || '8'),

  RATE_LIMIT_WINDOW_MIN: parseInt(process.env.RATE_LIMIT_WINDOW_MIN || '15', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  LOGIN_RATE_LIMIT_MAX: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),

  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || 'superadmin@company.com',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@123',
};

if (env.NODE_ENV === 'production') {
  ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'QR_SECRET', 'DB_PASSWORD'].forEach((k) => {
    if (!process.env[k]) {
      throw new Error(`Production requires ${k} to be explicitly set`);
    }
  });
}

module.exports = env;
