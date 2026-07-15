import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';

export const ContactForm = ({ agreed, setAgreed }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    inquiry_category: 'general',
    subject: '',
    message: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!agreed) {
      setError('You must agree to the Privacy Policy to submit.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/public/contact', {
        ...formData,
        consent_given: agreed
      });
      setSuccess(response.data.message);
      setFormData({
        full_name: '',
        email: '',
        company: '',
        inquiry_category: 'general',
        subject: '',
        message: ''
      });
      setAgreed(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      full_name: '',
      email: '',
      company: '',
      inquiry_category: 'general',
      subject: '',
      message: ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <Card className="card glass-card shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-800">Send us a message</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Full Name *</label>
              <Input 
                name="full_name"
                required 
                placeholder="John Doe" 
                value={formData.full_name}
                onChange={handleChange}
                className="transition-shadow focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Email Address *</label>
              <Input 
                name="email"
                required 
                type="email" 
                placeholder="john@example.com" 
                value={formData.email}
                onChange={handleChange}
                className="transition-shadow focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Company (Optional)</label>
              <Input 
                name="company"
                placeholder="Your Company" 
                value={formData.company}
                onChange={handleChange}
                className="transition-shadow focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Inquiry Category</label>
              <Select 
                value={formData.inquiry_category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, inquiry_category: value }))}
              >
                <SelectTrigger className="transition-shadow focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="issue">Report an Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Subject *</label>
            <Input 
              name="subject"
              required 
              placeholder="How can we help you?" 
              value={formData.subject}
              onChange={handleChange}
              className="transition-shadow focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="space-y-2 group">
            <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Message *</label>
            <Textarea 
              name="message"
              required 
              placeholder="Please provide as much detail as possible..." 
              rows={5} 
              value={formData.message}
              onChange={handleChange}
              className="transition-shadow focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="consent" checked={agreed} onCheckedChange={setAgreed} />
            <label htmlFor="consent" className="text-sm font-medium leading-none text-gray-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I agree to the Privacy Policy. *
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={!agreed || loading} className="flex-1 md:flex-none btn-primary">
              {loading ? 'Submitting...' : 'Submit Message'}
            </Button>
            <Button type="button" onClick={handleReset} variant="outline" className="flex-1 md:flex-none btn-secondary">
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
