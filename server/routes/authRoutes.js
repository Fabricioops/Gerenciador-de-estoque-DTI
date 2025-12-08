// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota de Login
router.post('/login', authController.login);

// Rota para registrar um novo usuário (opcional, pode ser protegida depois)
router.post('/register', authController.registerUser);

module.exports = router;
