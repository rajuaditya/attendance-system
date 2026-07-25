const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const path = require('path');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust first proxy (needed for correct req.ip behind reverse proxies/load balancers)
app.set('trust proxy', 1);

/* ---------------------- Security Middleware ---------------------- */

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// Prevent HTTP parameter pollution
app.use(hpp());

/* ---------------------- Body Parsing ---------------------- */

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/*
 * Basic XSS mitigation: strip <script> tags and dangerous HTML from
 * string fields in the request body. (xss-clean is unmaintained for
 * newer Express versions, so a minimal inline sanitizer is used instead
 * of pulling in an abandoned package.)
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value.replace(/<script.*?>.*?<\/script>/gis, '').replace(/[<>]/g, '');
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)]));
  }
  return value;
};

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
  next();
});

/* ---------------------- Rate Limiting ---------------------- */

app.use('/api', apiLimiter);

/* ---------------------- Static Files ---------------------- */

// Profile photos are served statically; uploads directory only ever
// contains validated image files written by multer (see upload.middleware.js)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ---------------------- Routes ---------------------- */

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Employee Attendance Management System API' });
});

/* ---------------------- Error Handling ---------------------- */

app.use(notFound);
app.use(errorHandler);

module.exports = app;
