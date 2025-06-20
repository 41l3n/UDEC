const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

const {
  uploadEvidence,
  getEvidence,
  listEvidence,
  verifyEvidence
} = require('../controllers/evidence');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Upload evidence (requires investigator or admin role)
router.post('/upload',
  authenticateJWT,
  requireRole(['investigator', 'admin']),
  upload.single('file'),
  uploadEvidence
);

// Get specific evidence
router.get('/:id',
  authenticateJWT,
  getEvidence
);

// List all evidence
router.get('/',
  authenticateJWT,
  listEvidence
);

// Verify evidence integrity
router.get('/:id/verify',
  authenticateJWT,
  verifyEvidence
);

module.exports = router;
