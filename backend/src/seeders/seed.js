require('dotenv').config();
const { sequelize, User, Department, Designation } = require('../models');
const { hashPassword } = require('../utils/password.util');
const env = require('../config/env');
const logger = require('../utils/logger');

const DEPARTMENTS = ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance', 'Operations'];
const DESIGNATIONS = ['Software Engineer', 'Senior Software Engineer', 'HR Executive', 'Sales Executive', 'Marketing Manager', 'Accountant', 'Operations Manager'];

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Departments
    for (const name of DEPARTMENTS) {
      await Department.findOrCreate({ where: { name } });
    }

    // Designations
    for (const title of DESIGNATIONS) {
      await Designation.findOrCreate({ where: { title } });
    }

    // Super Admin
    const existingSuperAdmin = await User.findOne({ where: { email: env.SUPER_ADMIN_EMAIL } });
    if (!existingSuperAdmin) {
      const password_hash = await hashPassword(env.SUPER_ADMIN_PASSWORD);
      await User.create({
        employee_code: 'EMP-0000',
        full_name: 'Super Administrator',
        email: env.SUPER_ADMIN_EMAIL,
        password_hash,
        role: 'super_admin',
        is_active: true,
        date_of_joining: new Date().toISOString().slice(0, 10),
      });
      logger.info(`Super Admin created: ${env.SUPER_ADMIN_EMAIL}`);
    } else {
      logger.info('Super Admin already exists, skipping.');
    }

    logger.info('Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error(`Seeding failed: ${err.message}`);
    process.exit(1);
  }
};

seed();
