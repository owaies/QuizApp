const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);
}

function isValidRegistrationPassword(value) {
  return typeof value === 'string' &&
    value.length >= 6 &&
    value.length <= 72 &&
    Buffer.byteLength(value, 'utf8') <= 72;
}

function normalizeLoginCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return null;
  const normalizedUsername = username.trim();
  if (!normalizedUsername || normalizedUsername.length > 50 || !password || password.length > 1024) return null;
  return { username: normalizedUsername, password };
}

module.exports = { isValidEmail, isValidRegistrationPassword, normalizeLoginCredentials };
