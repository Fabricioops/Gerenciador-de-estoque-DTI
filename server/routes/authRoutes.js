// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Rota de Login
router.post('/login', authController.login);

// Cadastro público sempre cria uma conta de Técnico.
router.post('/register', authController.registerUser);

// Somente Administradores podem escolher a permissão da nova conta.
router.post('/users', verifyToken, requireAdmin, authController.createUser);

// Rota de depuração: retorna o payload do token
router.get('/me', verifyToken, (req, res) => {
	res.json({ user: req.user });
});

module.exports = router;
