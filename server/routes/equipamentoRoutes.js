const express = require('express');
const router = express.Router();
const equipamentoController = require('../controllers/equipamentoController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/equipamentos -> lista equipamentos
router.get('/',verifyToken, equipamentoController.list);
// POST /api/equipamentos -> cria equipamento
router.post('/',verifyToken, equipamentoController.create);
// PUT /api/equipamentos/:id -> atualiza equipamento
router.put('/:id',verifyToken, equipamentoController.update);
// DELETE /api/equipamentos/:id -> remove equipamento
router.delete('/:id',verifyToken, equipamentoController.remove);

module.exports = router;
