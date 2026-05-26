// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Rota de Login
router.post('/login', authController.login);

// Rota para registrar um novo usuário (opcional, pode ser protegida depois)
router.post('/register', authController.registerUser);

// Rota de depuração: retorna o payload do token
router.get('/me', verifyToken, (req, res) => {
	res.json({ user: req.user });
});

module.exports = router;
