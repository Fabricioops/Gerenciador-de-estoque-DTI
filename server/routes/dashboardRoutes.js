// Rotas da API para dados do dashboard
// Essas rotas foram adicionadas para fornecer os dados que preenchem os
// gráficos e cards no frontend (category, status e summary).
const { verifyToken } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get(
   '/equipamentos/category',
   verifyToken,
   dashboardController.getCategoryCounts
);

router.get(
   '/equipamentos/status',
   verifyToken,
   dashboardController.getStatusCounts
);

router.get(
   '/summary',
   verifyToken,
   dashboardController.getSummary
);

router.get(
   '/counts',
   verifyToken,
   dashboardController.getCounts
);
module.exports = router;
