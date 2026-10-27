const Newsletter = require('../models/Newsletter');

exports.getSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.findAll();
        res.json(subscribers);
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.removeSubscriber = async (req, res) => {
    try {
        const { email } = req.params;
        const subscriber = await Newsletter.unsubscribe(email);
        
        if (!subscriber) {
            return res.status(404).json({ message: 'Subscriber not found' });
        }
        
        res.json({ message: 'Subscriber removed successfully' });
    } catch (error) {
        console.error('Remove subscriber error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resubscribe = async (req, res) => {
    try {
        const { email } = req.params;
        const subscriber = await Newsletter.subscribe(email);
        res.json({ success: true, message: 'Subscriber activated successfully', subscriber });
    } catch (error) {
        console.error('Resubscribe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};