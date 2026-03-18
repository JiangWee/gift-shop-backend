const express = require('express');
const router = express.Router();
const medicalController = require('../controllers/medicalController');

// POST /api/medical-inquiry - 接收医疗咨询表单
router.post('/medical-inquiry', medicalController.submitInquiry);

module.exports = router;
