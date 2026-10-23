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
});
