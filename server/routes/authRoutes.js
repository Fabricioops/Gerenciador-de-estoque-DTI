const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', verifyToken, requireAdmin, authController.registerUser);
router.post('/users', verifyToken, requireAdmin, authController.createUser);

router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
