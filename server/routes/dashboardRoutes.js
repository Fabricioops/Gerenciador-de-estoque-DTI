// Rotas da API para dados do dashboard
// Essas rotas foram adicionadas para fornecer os dados que preenchem os
// gráficos e cards no frontend (category, status e summary).
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/equipamentos/category', dashboardController.getCategoryCounts);
router.get('/equipamentos/status', dashboardController.getStatusCounts);
router.get('/summary', dashboardController.getSummary);
router.get('/counts', dashboardController.getCounts);

module.exports = router;
