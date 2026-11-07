<<<<<<< HEAD
const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const bcrypt = require('bcryptjs');
const db = require('../db');

const originalExecuteQuery = db.executeQuery;
let lastQuery;
let lastParams;

db.executeQuery = async (sql, params) => {
    lastQuery = sql;
    lastParams = params;
    return { insertId: 1 };
};

const authController = require('./authController');

after(() => {
    db.executeQuery = originalExecuteQuery;
});

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

test('cadastro público sempre cria Técnico, mesmo se receber permissao admin', async () => {
    const res = createResponse();

    await authController.registerUser({
        body: {
            nome: '  Usuário Teste  ',
            email: ' teste@example.com ',
            password: 'senha-teste',
            permissao: 'admin'
        }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.match(lastQuery, /INSERT INTO Usuarios/);
    assert.equal(lastParams[0], 'Usuário Teste');
    assert.equal(lastParams[1], 'teste@example.com');
    assert.equal(lastParams[3], 'padrao');
    assert.equal(await bcrypt.compare('senha-teste', lastParams[2]), true);
});

test('cadastro de usuário com permissão rejeita permissão desconhecida', async () => {
    const res = createResponse();

    await authController.createUser({
        body: {
            nome: 'Usuário Teste',
            email: 'teste@example.com',
            password: 'senha-teste',
            permissao: 'root'
        }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Permissão deve ser Técnico ou Administrador.');
});

test('cadastro administrativo persiste a permissão Administrador', async () => {
    const res = createResponse();

    await authController.createUser({
        body: {
            nome: 'Admin Teste',
            email: 'admin@example.com',
            password: 'senha-teste',
            permissao: 'ADMINISTRADOR'
        }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(lastParams[3], 'admin');
});

test('cadastros rejeitam campos obrigatórios ausentes sem consultar o banco', async () => {
    lastQuery = null;
    const res = createResponse();

    await authController.registerUser({ body: { nome: 'Sem senha' } }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(lastQuery, null);
=======
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

const { registerUser } = require('./authController');

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

test('registration validates input before touching the database', async () => {
  executedQuery = null;
  const res = responseRecorder();
  await registerUser({ body: { nome: '', email: 'invalid', password: 'short', permissao: 'admin' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(executedQuery, null);
});

test('registration rejects arbitrary permission values', async () => {
  executedQuery = null;
  const res = responseRecorder();
  await registerUser({
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

test('registration normalizes values and stores a password hash', async () => {
  queryResult = { insertId: 3 };
  executedQuery = null;
  const res = responseRecorder();
  await registerUser({
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
  assert.notEqual(executedQuery.params[2], 'long-enough-password');
  assert.equal(await bcrypt.compare('long-enough-password', executedQuery.params[2]), true);
});

test('registration rejects duplicate emails with a conflict response', async () => {
  queryResult = Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
  const res = responseRecorder();
  await registerUser({
    body: {
      nome: 'Test User',
      email: 'test@example.com',
      password: 'long-enough-password',
      permissao: 'padrao'
    }
  }, res);
  assert.equal(res.statusCode, 409);
>>>>>>> 9c4cd8c (Reforça segurança do cadastro, configura segredos e adiciona testes automatizados)
});
