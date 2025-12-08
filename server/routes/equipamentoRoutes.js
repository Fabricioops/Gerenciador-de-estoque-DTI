const express = require('express');
const router = express.Router();
const equipamentoController = require('../controllers/equipamentoController');

// GET /api/equipamentos -> lista equipamentos
router.get('/', equipamentoController.list);
// POST /api/equipamentos -> cria equipamento
router.post('/', equipamentoController.create);
// PUT /api/equipamentos/:id -> atualiza equipamento
router.put('/:id', equipamentoController.update);
// DELETE /api/equipamentos/:id -> remove equipamento
router.delete('/:id', equipamentoController.remove);

module.exports = router;
