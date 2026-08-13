const express = require('express');
const router = express.Router();
const movimentacaocontroller = require('../controllers/movimentacaoController.js');
const { verifyToken } = require('../middleware/authMiddleware');



const movimentacaoController =
require('../controllers/movimentacaoController');

router.get(
    '/',verifyToken,
    movimentacaoController.listarMovimentacoes
);

module.exports = router;

