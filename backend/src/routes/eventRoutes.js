const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, isAdmin } = require('../middleware/auth');

/* ==============================================================
   PUBLIC ROUTES
============================================================== */
// List published events with search and filters
router.get('/', eventController.getPublicEvents);

// Get single published event by slug
router.get('/:slug', eventController.getPublicEventBySlug);

// Register for an event
router.post('/:id/register', eventController.registerForEvent);

// Download .ics calendar invite
router.get('/:id/calendar.ics', eventController.downloadCalendarIcs);

/* ==============================================================
   ADMIN ROUTES (Requires Authentication + Admin Role)
============================================================== */
// List all events for admin dashboard
router.get('/admin/all', authenticate, isAdmin, eventController.getAdminEvents);

// Get event by ID for editing
router.get('/admin/single/:id', authenticate, isAdmin, eventController.getAdminEventById);

// Create new event (both /create and /admin/create supported)
router.post('/create', eventController.createEvent);
router.post('/admin/create', eventController.createEvent);

// Update event
router.put('/admin/update/:id', authenticate, isAdmin, eventController.updateEvent);

// Delete event
router.delete('/admin/delete/:id', authenticate, isAdmin, eventController.deleteEvent);

// Get attendees list for an event
router.get('/admin/:id/attendees', authenticate, isAdmin, eventController.getEventAttendees);

// Update attendee status (e.g. Attended, Cancelled)
router.patch('/admin/attendees/:registrationId/status', authenticate, isAdmin, eventController.updateAttendeeStatus);

// Export attendees list to CSV
router.get('/admin/:id/export-csv', authenticate, isAdmin, eventController.exportAttendeesCsv);

module.exports = router;
