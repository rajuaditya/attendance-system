const { body, param } = require('express-validator');

const createEmployeeValidator = [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name is required (2-100 chars)'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Invalid phone number'),
  body('role').isIn(['admin', 'employee']).withMessage('Role must be admin or employee'),
  body('departmentId').optional({ checkFalsy: true }).isInt().withMessage('Invalid department'),
  body('designationId').optional({ checkFalsy: true }).isInt().withMessage('Invalid designation'),
  body('dateOfJoining').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date of joining'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    .withMessage('Password must include upper, lower, number, and special character'),
];

const updateEmployeeValidator = [
  param('id').isInt().withMessage('Invalid employee id'),
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Invalid phone number'),
  body('departmentId').optional({ checkFalsy: true }).isInt(),
  body('designationId').optional({ checkFalsy: true }).isInt(),
  body('dateOfJoining').optional({ checkFalsy: true }).isISO8601(),
];

const idParamValidator = [param('id').isInt().withMessage('Invalid id')];

module.exports = { createEmployeeValidator, updateEmployeeValidator, idParamValidator };
