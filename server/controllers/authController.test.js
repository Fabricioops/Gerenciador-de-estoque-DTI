process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const dbPath = require.resolve('../db');
const controllerPath = require.resolve('./authController');
const previousDb = require.cache[dbPath];
let queryResult;
let executedQuery;

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: {
    executeQuery: async (sql, params) => {
      executedQuery = { sql, params };
      if (queryResult instanceof Error) throw queryResult;
      return queryResult;
    }
  }
};

const authController = require('./authController');

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

test.after(() => {
  delete require.cache[controllerPath];
  if (previousDb) require.cache[dbPath] = previousDb;
  else delete require.cache[dbPath];
});

test('cadastro valida os campos antes de consultar o banco', async () => {
  executedQuery = null;
  const res = responseRecorder();
  await authController.registerUser({
    body: { nome: '', email: 'invalid', password: 'short', permissao: 'admin' }
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(executedQuery, null);
});

test('cadastro rejeita permissão desconhecida', async () => {
  executedQuery = null;
  const res = responseRecorder();
  await authController.registerUser({
    body: {
      nome: 'Test User',
      email: 'test@example.com',
      password: 'long-enough-password',
      permissao: 'superadmin'
    }
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(executedQuery, null);
});

test('cadastro normaliza os dados e armazena senha com hash', async () => {
  queryResult = { insertId: 3 };
  executedQuery = null;
  const res = responseRecorder();
  await authController.registerUser({
    body: {
      nome: '  Test User  ',
      email: ' TEST@example.com ',
      password: 'long-enough-password',
      permissao: ' ADMIN '
    }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(executedQuery.params[0], 'Test User');
  assert.equal(executedQuery.params[1], 'test@example.com');
  assert.equal(executedQuery.params[3], 'admin');
  assert.equal(await bcrypt.compare('long-enough-password', executedQuery.params[2]), true);
});

test('cadastro rejeita email duplicado com conflito', async () => {
  queryResult = Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
  const res = responseRecorder();
  await authController.createUser({
    body: {
      nome: 'Test User',
      email: 'test@example.com',
      password: 'long-enough-password',
      permissao: 'padrao'
    }
  }, res);
  assert.equal(res.statusCode, 409);
});
