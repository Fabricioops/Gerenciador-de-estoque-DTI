process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin } = require('./authMiddleware');

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('verifyToken rejects missing and invalid bearer tokens', () => {
  for (const authorization of ['', 'Bearer invalid-token']) {
    const req = { headers: { authorization } };
    const res = responseRecorder();
    let nextCalled = false;
    verifyToken(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  }
});

test('verifyToken accepts a signed token and attaches its user', () => {
  const user = { id: 7, permissao: 'admin' };
  const req = {
    headers: {
      authorization: `Bearer ${jwt.sign(user, process.env.JWT_SECRET)}`
    }
  };
  const res = responseRecorder();
  let nextCalled = false;
  verifyToken(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, user.id);
});

test('requireAdmin rejects technicians and accepts administrators', () => {
  const denied = responseRecorder();
  let nextCalled = false;
  requireAdmin({ user: { permissao: 'padrao' } }, denied, () => { nextCalled = true; });
  assert.equal(denied.statusCode, 403);
  assert.equal(nextCalled, false);

  const allowed = responseRecorder();
  requireAdmin({ user: { permissao: 'ADMIN' } }, allowed, () => { nextCalled = true; });
  assert.equal(allowed.statusCode, null);
  assert.equal(nextCalled, true);
});
