const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Content Routes for Landing Page & Public Website
router.get('/content/beranda', publicController.getBerandaContent);
router.get('/content/tentang-kami', publicController.getTentangKamiContent);
router.get('/content/kontak', publicController.getKontakContent);
router.get('/content/struktur-organisasi', publicController.getStrukturOrganisasi);

// Master & List Data
router.get('/divisions', publicController.getDivisions);
router.get('/filters', publicController.getFilters);
router.get('/categories', publicController.getCategories);
router.get('/prestasi', publicController.getPrestasi);

// Articles & Activities
router.get('/articles', publicController.getArticles);
router.get('/articles/:slug', publicController.getArticleDetail);

module.exports = router;
