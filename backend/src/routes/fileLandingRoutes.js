const express = require('express');
const router = express.Router({ mergeParams: true });
const { serveLandingPageOrAsset, handleLandingPageFormSubmit } = require('../controllers/fileLandingController');

// Serve root landing page (/lp/:slug or /lp/:slug/)
router.get('/:slug', serveLandingPageOrAsset);

// Serve landing page assets or nested files (/lp/:slug/css/style.css, /lp/:slug/assets/banner.jpg, etc.)
router.get('/:slug/{*subpath}', serveLandingPageOrAsset);

// Handle form submissions posted directly to landing page URLs
router.post('/:slug', handleLandingPageFormSubmit);
router.post('/:slug/{*subpath}', handleLandingPageFormSubmit);

module.exports = router;
