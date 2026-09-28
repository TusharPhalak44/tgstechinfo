const EditRequest = require('../models/EditRequest');
const Content = require('../models/Content');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { sendTemplatedEmail } = require('../config/email');
const logAudit = require('../utils/auditLogger');
const { isValidStatusTransition, CONTENT_STATUSES, EDIT_REQUEST_STATUSES } = require('../utils/statusHelper');

// Admin sends edit request to content creator
exports.sendEditRequest = async (req, res) => {
    try {
        const { id } = req.params; // content_id
        const { admin_comment } = req.body;

        const content = await Content.findById(id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Check if content is in a state that allows edit requests
        if (content.status === CONTENT_STATUSES.DRAFT) {
            return res.status(400).json({ message: 'Cannot send edit request for draft content' });
        }

        // If there's already a pending edit request, update it instead of blocking
        const existingRequestId = await EditRequest.checkPendingEditRequest(id);
        if (existingRequestId) {
            await EditRequest.update(existingRequestId, { admin_comment, status: EDIT_REQUEST_STATUSES.PENDING });
        }

        // Create edit request only if no existing one was updated
        let editRequest;
        if (existingRequestId) {
            editRequest = await EditRequest.findById(existingRequestId);
        } else {
            editRequest = await EditRequest.create({
                content_id: id,
                requested_by: req.user.id,
                requested_to: content.user_id,
                admin_comment
            });
        }

        // Set content status to changes_requested so user knows action is needed
        await Content.updateStatus(id, CONTENT_STATUSES.CHANGES_REQUESTED, admin_comment);

        // Send notification to content creator
        await createNotification(
            content.user_id,
            id,
            'edit_request',
            `Admin has requested edits for your content "${content.title}".${admin_comment ? ' Comment: ' + admin_comment : ''}`
        );

        // Send email to content creator
        try {
            const creator = await User.findById(content.user_id);
            const rawFrontend = process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            const frontendUrl = rawFrontend.split(',')[0].trim();

            const { sendEmail } = require('../config/email');
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #1a237e; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; background: #f5f5f5; }
                        .footer { padding: 20px; text-align: center; background: #e0e0e0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Edit Request for Your Content</h2>
                        </div>
                        <div class="content">
                            <h3>Hi ${creator.first_name} ${creator.last_name},</h3>
                            <p>An admin has requested edits for your content: <strong>${content.title}</strong></p>
                            <p><strong>Admin Comment:</strong> ${admin_comment || 'No specific reason provided'}</p>
                            <p>Please log in to your dashboard to review and accept this edit request.</p>
                            <p><a href="${frontendUrl}/dashboard" style="background: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
                            <br>
                            <p>Regards,</p>
                            <p><strong>TGS Tech Info Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} TGS Tech Info. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            await sendEmail(creator.email, `Edit Request: ${content.title}`, emailHtml);
        } catch (e) {
            console.warn('Email failed:', e.message);
        }

        // Log to audit logs
        await logAudit(req, 'create', 'edit_request', editRequest.id, `Sent edit request for content: ${content.title}`, 'success');

        res.status(201).json({ message: 'Edit request sent successfully', editRequest });
    } catch (error) {
        console.error('Send edit request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all edit requests for a user (content creator)
exports.getUserEditRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const filters = {};
        if (status) filters.status = status;

        const editRequests = await EditRequest.findByRequestedTo(req.user.id, filters);
        res.json(editRequests);
    } catch (error) {
        console.error('Get user edit requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all edit requests (admin view)
exports.getAllEditRequests = async (req, res) => {
    try {
        const { status, content_id, requested_to } = req.query;
        const filters = {};
        if (status) filters.status = status;
        if (content_id) filters.content_id = content_id;
        if (requested_to) filters.requested_to = requested_to;

        const editRequests = await EditRequest.findAll(filters);
        res.json(editRequests);
    } catch (error) {
        console.error('Get all edit requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get edit requests for specific content
exports.getContentEditRequests = async (req, res) => {
    try {
        const { id } = req.params; // content_id
        const editRequests = await EditRequest.findByContentId(id);
        res.json(editRequests);
    } catch (error) {
        console.error('Get content edit requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Content creator accepts edit request
exports.acceptEditRequest = async (req, res) => {
    try {
        const { id } = req.params; // edit_request_id
        const { creator_comment } = req.body;

        const editRequest = await EditRequest.findById(id);
        if (!editRequest) {
            return res.status(404).json({ message: 'Edit request not found' });
        }

        // Check if the user is the intended recipient
        if (editRequest.requested_to !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if request is still pending
        if (editRequest.status !== EDIT_REQUEST_STATUSES.PENDING) {
            return res.status(400).json({ message: 'Edit request is no longer pending' });
        }

        // Update edit request status
        const updatedRequest = await EditRequest.updateStatus(id, EDIT_REQUEST_STATUSES.ACCEPTED, creator_comment);

        // Send notification to admin
        const content = await Content.findById(editRequest.content_id);
        await createNotification(
            editRequest.requested_by,
            editRequest.content_id,
            'edit_request_accepted',
            `Your edit request for "${content.title}" has been accepted by the creator.`
        );

        // Log to audit logs
        await logAudit(req, 'update', 'edit_request', id, `Accepted edit request for content: ${content.title}`, 'success');

        res.json({ message: 'Edit request accepted successfully', editRequest: updatedRequest });
    } catch (error) {
        console.error('Accept edit request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Content creator rejects edit request
exports.rejectEditRequest = async (req, res) => {
    try {
        const { id } = req.params; // edit_request_id
        const { creator_comment } = req.body;

        const editRequest = await EditRequest.findById(id);
        if (!editRequest) {
            return res.status(404).json({ message: 'Edit request not found' });
        }

        // Check if the user is the intended recipient
        if (editRequest.requested_to !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if request is still pending
        if (editRequest.status !== EDIT_REQUEST_STATUSES.PENDING) {
            return res.status(400).json({ message: 'Edit request is no longer pending' });
        }

        // Update edit request status
        const updatedRequest = await EditRequest.updateStatus(id, EDIT_REQUEST_STATUSES.REJECTED, creator_comment);

        // Send notification to admin
        const content = await Content.findById(editRequest.content_id);
        await createNotification(
            editRequest.requested_by,
            editRequest.content_id,
            'edit_request_rejected',
            `Your edit request for "${content.title}" has been rejected by the creator.${creator_comment ? ' Reason: ' + creator_comment : ''}`
        );

        // Log to audit logs
        await logAudit(req, 'update', 'edit_request', id, `Rejected edit request for content: ${content.title}`, 'success');

        res.json({ message: 'Edit request rejected successfully', editRequest: updatedRequest });
    } catch (error) {
        console.error('Reject edit request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark edit request as completed (after content is edited and resubmitted)
exports.completeEditRequest = async (req, res) => {
    try {
        const { id } = req.params; // edit_request_id

        const editRequest = await EditRequest.findById(id);
        if (!editRequest) {
            return res.status(404).json({ message: 'Edit request not found' });
        }

        // Only admin or the creator can complete
        if (editRequest.requested_by !== req.user.id && editRequest.requested_to !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update edit request status
        const updatedRequest = await EditRequest.updateStatus(id, EDIT_REQUEST_STATUSES.COMPLETED);

        // Log to audit logs
        const content = await Content.findById(editRequest.content_id);
        await logAudit(req, 'update', 'edit_request', id, `Completed edit request for content: ${content.title}`, 'success');

        res.json({ message: 'Edit request completed successfully', editRequest: updatedRequest });
    } catch (error) {
        console.error('Complete edit request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if content can be edited by user
exports.canEditContent = async (req, res) => {
    try {
        const { id } = req.params; // content_id

        const content = await Content.findById(id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Check if user owns the content or is admin
        const isOwner = content.user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.json({ canEdit: false, reason: 'You do not have permission to edit this content' });
        }

        // Admin can always edit
        if (isAdmin) {
            return res.json({ canEdit: true, reason: 'Admin can edit any content' });
        }

        // Check content status
        if (content.status === CONTENT_STATUSES.DRAFT || content.status === CONTENT_STATUSES.CHANGES_REQUESTED) {
            return res.json({ canEdit: true, reason: content.status === CONTENT_STATUSES.CHANGES_REQUESTED ? 'changes_requested' : 'Draft content can be edited' });
        }

        if (content.status === CONTENT_STATUSES.PUBLISHED) {
            return res.json({ canEdit: false, reason: 'Published content cannot be edited' });
        }

        // For pending/approved content — check for an active edit request
        const activeRequest = await EditRequest.checkActiveEditRequest(id);
        if (!activeRequest) {
            return res.json({ canEdit: false, reason: 'No active edit request found. Content is under review.' });
        }

        if (activeRequest.status === EDIT_REQUEST_STATUSES.PENDING) {
            return res.json({ canEdit: false, reason: 'Edit request is pending. Please accept the edit request first.' });
        }

        if (activeRequest.status === EDIT_REQUEST_STATUSES.ACCEPTED) {
            return res.json({ canEdit: true, reason: EDIT_REQUEST_STATUSES.ACCEPTED });
        }

        return res.json({ canEdit: false, reason: 'Content cannot be edited in current state' });
    } catch (error) {
        console.error('Check edit permission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
