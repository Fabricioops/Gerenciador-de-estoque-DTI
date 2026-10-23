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
});
