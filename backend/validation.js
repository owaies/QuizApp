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

function normalizeQuestionLimit(value) {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;

  const limit = Number(normalized);
  return Number.isSafeInteger(limit) ? limit : null;
}

function resolveQuestionLimitSetting(setting) {
  if (setting === null || setting === undefined) return 0;
  return normalizeQuestionLimit(setting.value);
}

function normalizeLoginCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return null;
  const normalizedUsername = username.trim();
  if (
    !normalizedUsername ||
    normalizedUsername.length > 50 ||
    !password ||
    Buffer.byteLength(password, 'utf8') > 72
  ) return null;
  return { username: normalizedUsername, password };
}

module.exports = { isValidEmail, isValidRegistrationPassword, normalizeLoginCredentials, normalizeQuestionLimit, resolveQuestionLimitSetting };
