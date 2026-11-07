<<<<<<< HEAD
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireAdmin } = require('./authMiddleware');
const authRoutes = require('../routes/authRoutes');
const metaRoutes = require('../routes/metaRoutes');

function routeHandlers(router, method, path) {
    const route = router.stack
        .map(layer => layer.route)
        .find(candidate => candidate && candidate.path === path && candidate.methods[method]);
    return route ? route.stack.map(layer => layer.handle) : [];
}

function createResponse() {
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

test('requireAdmin nega criação administrativa a Técnico', () => {
    const res = createResponse();
    let nextCalled = false;

    requireAdmin({ user: { permissao: 'padrao' } }, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
});

test('requireAdmin permite Administrador', () => {
    const res = createResponse();
    let nextCalled = false;

    requireAdmin({ user: { permissao: 'ADMIN' } }, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, null);
    assert.equal(nextCalled, true);
});

test('criação de usuários exige autenticação e permissão administrativa', () => {
    const handlers = routeHandlers(authRoutes, 'post', '/users');
    assert.equal(handlers.length, 3);
    assert.ok(handlers.some(handler => handler.name === 'verifyToken'));
    assert.ok(handlers.includes(requireAdmin));
});

test('criação de locais e status exige autenticação e permissão administrativa', () => {
    for (const path of ['/locais', '/statuses']) {
        const handlers = routeHandlers(metaRoutes, 'post', path);
        assert.equal(handlers.length, 3);
        assert.ok(handlers.some(handler => handler.name === 'verifyToken'));
        assert.ok(handlers.includes(requireAdmin));
    }
=======
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin } = require('./authMiddleware');

function responseRecorder() {
  return {
    statusCode: 200,
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

test('verifyToken rejects absent and invalid bearer tokens', () => {
  for (const authorization of ['', 'Bearer invalid-token']) {
    const req = { headers: { authorization } };
    const res = responseRecorder();
    let continued = false;
    verifyToken(req, res, () => { continued = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
  }
});

test('verifyToken accepts a valid token and sets the user', () => {
  const user = { id: 7, permissao: 'admin' };
  const req = {
    headers: {
      authorization: `Bearer ${jwt.sign(user, process.env.JWT_SECRET)}`
    }
  };
  const res = responseRecorder();
  let continued = false;
  verifyToken(req, res, () => { continued = true; });
  assert.equal(continued, true);
  assert.equal(req.user.id, user.id);
});

test('requireAdmin rejects regular users and accepts administrators', () => {
  const denied = responseRecorder();
  requireAdmin({ user: { permissao: 'padrao' } }, denied, () => assert.fail('must deny'));
  assert.equal(denied.statusCode, 403);

  let continued = false;
  requireAdmin({ user: { permissao: 'admin' } }, responseRecorder(), () => { continued = true; });
  assert.equal(continued, true);
>>>>>>> 9c4cd8c (Reforça segurança do cadastro, configura segredos e adiciona testes automatizados)
});
