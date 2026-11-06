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
    ['student', 'x'.repeat(73)],
    ['student', 'é'.repeat(37)],
  ]) {
    assert.equal(normalizeLoginCredentials(username, password), null);
  }
});

test('login passwords use bcrypt UTF-8 byte boundaries', () => {
  assert.notEqual(normalizeLoginCredentials('student', 'é'.repeat(36)), null);
  assert.equal(normalizeLoginCredentials('student', 'é'.repeat(37)), null);
  assert.equal(normalizeLoginCredentials('student', 'x'.repeat(73)), null);
});

test('registration passwords respect bcrypt UTF-8 byte limits', () => {
  assert.equal(isValidRegistrationPassword('abc123'), true);
  assert.equal(isValidRegistrationPassword('é'.repeat(36)), true);
  assert.equal(isValidRegistrationPassword('é'.repeat(37)), false);
  assert.equal(isValidRegistrationPassword('x'.repeat(73)), false);
  assert.equal(isValidRegistrationPassword('12345'), false);
});


const { normalizeQuestionLimit, resolveQuestionLimitSetting } = require('../validation');

test('accepts non-negative integer quiz question limits', () => {
  for (const [input, expected] of [[0, 0], [12, 12], ['12', 12], [' 12 ', 12], ['000', 0]]) {
    assert.equal(normalizeQuestionLimit(input), expected);
  }
});

test('rejects malformed and unsafe quiz question limits', () => {
  for (const input of [-1, 1.5, '1.5', '10items', '0x10', '', '   ', null, undefined, Number.MAX_SAFE_INTEGER + 1, '9007199254740992']) {
    assert.equal(normalizeQuestionLimit(input), null, String(input));
  }
});


test('resolves persisted question limit settings without permissive parsing', () => {
  assert.equal(resolveQuestionLimitSetting(null), 0);
  assert.equal(resolveQuestionLimitSetting({ value: '15' }), 15);
  assert.equal(resolveQuestionLimitSetting({ value: '0' }), 0);
  for (const value of ['15questions', '1.5', '-1', '', null, undefined]) {
    assert.equal(resolveQuestionLimitSetting({ value }), null, String(value));
  }
});


const { selectRandomQuestions } = require('../validation');

test('selects a random subset with Fisher-Yates without mutating stored order', () => {
  const questions = ['a', 'b', 'c', 'd'];
  const randomValues = [0, 0, 0];

  const selected = selectRandomQuestions(questions, 2, () => randomValues.shift());

  assert.deepEqual(selected, ['b', 'c']);
  assert.deepEqual(questions, ['a', 'b', 'c', 'd']);
});

test('leaves question sets unchanged when no sampling is required', () => {
  const questions = ['a', 'b'];
  let randomCalls = 0;

  assert.deepEqual(selectRandomQuestions(questions, 2, () => { randomCalls += 1; return 0; }), questions);
  assert.deepEqual(selectRandomQuestions(questions, 0, () => { randomCalls += 1; return 0; }), questions);
  assert.equal(randomCalls, 0);
});
