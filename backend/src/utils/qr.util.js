const crypto = require('crypto');
const QRCode = require('qrcode');
const env = require('../config/env');

/**
 * Generates a cryptographically random opaque token. This is the ONLY
 * thing embedded in the employee's QR code — never their id, name, email,
 * or any PII. The token is meaningless without a DB lookup.
 */
const generateSecureToken = () => crypto.randomBytes(32).toString('base64url');

/**
 * HMAC-signs the token so that even if the DB token table were somehow
 * exposed, a forged QR payload could not be re-derived without QR_SECRET.
 * The QR image encodes `token.signature`.
 */
const signToken = (token) =>
  crypto.createHmac('sha256', env.QR_SECRET).update(token).digest('base64url');

const buildQrPayload = (token) => `${token}.${signToken(token)}`;

const verifyQrPayload = (payload) => {
  if (typeof payload !== 'string' || !payload.includes('.')) return null;
  const [token, signature] = payload.split('.');
  if (!token || !signature) return null;
  const expected = signToken(token);
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) return null;
  return token;
};

/**
 * Renders a QR code PNG (as a data URL) for the given signed payload.
 */
const generateQrImage = async (payload) =>
  QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
  });

module.exports = { generateSecureToken, buildQrPayload, verifyQrPayload, generateQrImage };
