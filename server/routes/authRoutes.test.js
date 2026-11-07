process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const controllerPath = require.resolve('../controllers/authController');
const routesPath = require.resolve('./authRoutes');
const previousController = require.cache[controllerPath];
let registrations = 0;

require.cache[controllerPath] = {
  id: controllerPath,
  filename: controllerPath,
  loaded: true,
  exports: {
    login: (_req, res) => res.sendStatus(200),
    registerUser: (_req, res) => {
      registrations += 1;
      res.sendStatus(201);
    },
    createUser: (_req, res) => {
      registrations += 1;
      res.sendStatus(201);
    }
  }
};

const router = require('./authRoutes');
const app = express();
app.use(express.json(), router);
const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;

async function postRegistration(path, permission) {
  const headers = { 'content-type': 'application/json' };
  if (permission) {
    const token = jwt.sign({ id: 1, permissao: permission }, process.env.JWT_SECRET);
    headers.authorization = `Bearer ${token}`;
  }
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nome: 'Test', permissao: 'admin' })
  });
}

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  delete require.cache[routesPath];
  if (previousController) require.cache[controllerPath] = previousController;
  else delete require.cache[controllerPath];
});

for (const path of ['/register', '/users']) {
  test(`${path} rejects unauthenticated registration`, async () => {
    const response = await postRegistration(path);
    assert.equal(response.status, 401);
  });

  test(`${path} rejects a technician`, async () => {
    const response = await postRegistration(path, 'padrao');
    assert.equal(response.status, 403);
  });

  test(`${path} allows an administrator`, async () => {
    const response = await postRegistration(path, 'admin');
    assert.equal(response.status, 201);
  });
}

test('only authenticated administrators reach user registration handlers', () => {
  assert.equal(registrations, 2);
});
