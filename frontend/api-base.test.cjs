const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
const declaration = source.match(/^const API_BASE = .*;$/m);

test('API base defaults to the same origin when no override is configured', () => {
  assert.ok(declaration, 'API_BASE declaration should exist');
  const result = vm.runInNewContext(`${declaration[0]}\nAPI_BASE`, { window: {} });
  assert.equal(result, '');
});

test('API base honors an explicitly configured API URL', () => {
  assert.ok(declaration, 'API_BASE declaration should exist');
  const result = vm.runInNewContext(`${declaration[0]}\nAPI_BASE`, {
    window: { QUIZ_API_BASE: 'https://api.example.test' }
  });
  assert.equal(result, 'https://api.example.test');
});
