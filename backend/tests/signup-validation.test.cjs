const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidEmail } = require('../validation');

test('accepts a conventional email address', () => {
  assert.equal(isValidEmail('student@example.com'), true);
});

test('rejects missing separators and whitespace', () => {
  for (const value of ['student.example.com', 'student@localhost', 'student @example.com', 'student@example .com']) {
    assert.equal(isValidEmail(value), false, value);
  }
});

test('rejects empty, non-string, and overlong values', () => {
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail(null), false);
  assert.equal(isValidEmail('a'.repeat(243) + '@example.com'), false);
});

const { normalizeLoginCredentials, isValidRegistrationPassword } = require('../validation');

test('normalizes login usernames and rejects malformed or oversized credentials', () => {
  assert.deepEqual(normalizeLoginCredentials(' student ', 'secret'), {
    username: 'student',
    password: 'secret',
  });
  for (const [username, password] of [
    [null, 'secret'],
    ['student', null],
    ['   ', 'secret'],
    ['u'.repeat(51), 'secret'],
    ['student', 'x'.repeat(1025)],
  ]) {
    assert.equal(normalizeLoginCredentials(username, password), null);
  }
});

test('registration passwords respect bcrypt UTF-8 byte limits', () => {
  assert.equal(isValidRegistrationPassword('abc123'), true);
  assert.equal(isValidRegistrationPassword('é'.repeat(36)), true);
  assert.equal(isValidRegistrationPassword('é'.repeat(37)), false);
  assert.equal(isValidRegistrationPassword('x'.repeat(73)), false);
  assert.equal(isValidRegistrationPassword('12345'), false);
});
