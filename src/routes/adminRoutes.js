const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const dashboardController = require('../controllers/dashboardController');
const memberController = require('../controllers/memberController');
const registrationController = require('../controllers/registrationController');
const periodController = require('../controllers/periodController');
const cmsController = require('../controllers/cmsController');
const logController = require('../controllers/logController');

// All routes in adminRoutes require authenticated Admin (FR-15)
router.use(authenticateToken, requireAdmin);

// 1. Dashboard Overview [FR-28]
router.get('/dashboard/stats', dashboardController.getOverviewStats);

// 2. Member Management [FR-29 s.d. FR-33, FR-35, FR-38]
router.get('/members', memberController.getMembers);
router.get('/members/template', memberController.downloadTemplate);
router.get('/members/export', memberController.exportMembers);
router.post('/members/import-preview', upload.single('file'), memberController.previewImport);
router.post('/members/import-commit', memberController.commitImport);
router.get('/members/:no_register', memberController.getMemberDetail);
router.post('/members', memberController.createMember);
router.put('/members/:no_register', memberController.updateMember);
router.patch('/members/:no_register/toggle-status', memberController.toggleStatusMember);
router.post('/members/:no_register/reset-password', memberController.resetPasswordMember);
router.get('/members/:no_register/print-biodata', memberController.printBiodata);

// 3. Monitoring & Override Registrasi Ulang [FR-34, FR-32]
router.get('/registrations/monitoring', registrationController.getMonitoringList);
router.post('/registrations/override', upload.any(), registrationController.adminInputReRegistration);

// 4. Pengaturan Periode & Divisi (FR-33 Penyesuaian)
router.get('/periodes', periodController.getPeriodes);
router.post('/periodes', periodController.createPeriod);
router.patch('/periodes/:id/toggle', periodController.togglePeriodStatus);

// Kelola Divisi (Menggantikan Kelola Atribut)
router.get('/divisions', periodController.getDivisions);
router.post('/divisions', periodController.createDivision);
router.put('/divisions/:id', periodController.updateDivision);
router.delete('/divisions/:id', periodController.deleteDivision);

// Atribut Tetap (Hanya Topi Rimba & Baju Lapangan)
router.get('/attributes', periodController.getAttributes);

// 5. CMS Website [FR-39 s.d. FR-42]
// Articles (P-02: Multi-image support)
router.get('/cms/articles', cmsController.getArticles);
router.post('/cms/articles', upload.any(), cmsController.createArticle);
router.put('/cms/articles/:id', upload.any(), cmsController.updateArticle);
router.delete('/cms/articles/:id', cmsController.deleteArticle);

// Struktur Organisasi (P-01: Unggah Gambar Bagan Struktur)
router.get('/cms/struktur', cmsController.getStrukturOrganisasi);
router.post('/cms/struktur', upload.single('foto'), cmsController.updateStrukturOrganisasi);

// Pengurus (Legacy compatibility)
router.get('/cms/pengurus', cmsController.getPengurus);
router.post('/cms/pengurus', upload.single('foto'), cmsController.createPengurus);
router.delete('/cms/pengurus/:id', cmsController.deletePengurus);

// Prestasi
router.get('/cms/prestasi', cmsController.getPrestasi);
router.post('/cms/prestasi', upload.single('foto'), cmsController.createPrestasi);
router.delete('/cms/prestasi/:id', cmsController.deletePrestasi);

// Static Content
router.get('/cms/static-content', cmsController.getStaticContent);
router.put('/cms/static-content', cmsController.updateStaticContent);

// 6. Log Aktivitas Admin [FR-36]
router.get('/logs', logController.getActivityLogs);

module.exports = router;

