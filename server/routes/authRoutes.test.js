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
    }
  }
};

const router = require('./authRoutes');
const app = express();
app.use(express.json(), router);
const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  delete require.cache[routesPath];
  if (previousController) require.cache[controllerPath] = previousController;
  else delete require.cache[controllerPath];
});

test('user registration is unavailable without an administrator token', async () => {
  const response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nome: 'Test', permissao: 'admin' })
  });
  assert.equal(response.status, 401);
  assert.equal(registrations, 0);
});

test('regular users cannot register another user', async () => {
  const token = jwt.sign({ id: 2, permissao: 'padrao' }, process.env.JWT_SECRET);
  const response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ nome: 'Test', permissao: 'admin' })
  });
  assert.equal(response.status, 403);
  assert.equal(registrations, 0);
});

test('an administrator can access the registration handler', async () => {
  const token = jwt.sign({ id: 1, permissao: 'admin' }, process.env.JWT_SECRET);
  const response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ nome: 'Test', permissao: 'padrao' })
  });
  assert.equal(response.status, 201);
  assert.equal(registrations, 1);
});
