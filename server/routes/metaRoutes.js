const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/locais', metaController.getLocais);
router.post('/locais', verifyToken, requireAdmin, metaController.createLocal);

router.get('/statuses', metaController.getStatuses);
router.post('/statuses', verifyToken, requireAdmin, metaController.createStatus);

module.exports = router;
