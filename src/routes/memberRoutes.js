const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const memberPortalController = require('../controllers/memberPortalController');

// All member routes require authenticated token
router.use(authenticateToken);

// Privacy Policy & Consent (FR-44, FR-45)
router.get('/privacy-policy', memberPortalController.getPrivacyPolicy);
router.post('/privacy-policy/consent', memberPortalController.submitPrivacyConsent);

// Dashboard & Profile
router.get('/dashboard', memberPortalController.getDashboard);
router.get('/profile', memberPortalController.getProfile);
router.put('/profile', memberPortalController.updateProfile);

// Re-registration (FR-21 s.d FR-25)
router.get('/re-registration/form-data', memberPortalController.getReRegistrationFormData);
router.post('/re-registration', upload.single('foto_terbaru'), memberPortalController.submitReRegistration);

// Onboarding Activation Wizard (Atomic 3-Step)
router.post('/activation/validate-password', memberPortalController.validateActivationPassword);
router.post('/activation/complete', memberPortalController.completeActivation);

// Member Directory (FR-46, FR-47) - Powered by MySQL view v_direktori_anggota
router.get('/directory', memberPortalController.getDirectory);

module.exports = router;
