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
