import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Mail, 
  Building, 
  FileText, 
  MessageSquare,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const categoryOptions = [
  { id: 'editorial', label: 'Editorial / Pitch', desc: 'Articles, Press Releases, News' },
  { id: 'partnership', label: 'Partnerships & Media', desc: 'Sponsorships, Ads, Media Kits' },
  { id: 'general', label: 'General Enquiry', desc: 'Platform questions & Info' },
  { id: 'feedback', label: 'Feedback / Authors', desc: 'Writer account & platform help' },
  { id: 'issue', label: 'Report Issue', desc: 'Technical bugs or broken links' },
  { id: 'other', label: 'Other Enquiries', desc: 'Miscellaneous requests' },
];

export const ContactForm = ({ agreed, setAgreed, selectedCategory, onCategoryChange }) => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    inquiry_category: selectedCategory || 'general',
    subject: '',
    message: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalPopup, setModalPopup] = useState(null);

  // Sync category if passed from parent (e.g. via PublishingDesks click)
  useEffect(() => {
    if (selectedCategory) {
      setFormData(prev => ({ ...prev, inquiry_category: selectedCategory }));
    }
  }, [selectedCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleCategorySelect = (catId) => {
    setFormData(prev => ({ ...prev, inquiry_category: catId }));
    if (onCategoryChange) onCategoryChange(catId);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!agreed) {
      const errMsg = 'You must agree to the Privacy Policy before submitting your message.';
      setError(errMsg);
      alert(errMsg);
      setModalPopup({ type: 'error', message: errMsg });
      return;
    }

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      const errMsg = 'Please fill in all required fields marked with (*).';
      setError(errMsg);
      alert(errMsg);
      setModalPopup({ type: 'error', message: errMsg });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/public/contact', {
        ...formData,
        consent_given: agreed
      });

      const successMsg = response.data?.message || 'Contact form submitted successfully. We will get back to you soon.';
      setSuccess(successMsg);
      alert(successMsg);
      setModalPopup({ type: 'success', message: successMsg });

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
      const errMsg = err.response?.data?.message || 'Failed to send message. Please check your details and try again.';
      setError(errMsg);
      alert(errMsg);
      setModalPopup({ type: 'error', message: errMsg });
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

  const charCount = formData.message.length;

  return (
    <div
      id="contact-form-section"
      className="p-6 sm:p-8 rounded-2xl border shadow-md transition-all duration-300 relative overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Theme Color Accent Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%)' }}
      />

      <div className="flex items-center justify-between mb-6 pb-4 border-b relative z-10" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-heading)' }}>
            <MessageSquare className="w-6 h-6 text-amber-500" />
            Send a Direct Message
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Fill out the form below. Messages are instantly dispatched to the selected desk.
          </p>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20" style={{ color: 'var(--color-heading)' }}>
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Direct Desk Connection
        </span>
      </div>

      {/* Alert Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm shadow-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
            <div className="flex-1 font-medium">{success}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Category Visual Chips */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-heading)' }}>
            1. Select Enquiry Topic <span className="text-amber-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categoryOptions.map((cat) => {
              const isSelected = formData.inquiry_category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 font-bold shadow-xs'
                      : 'hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'rgba(247, 148, 29, 0.08)' : 'var(--color-bg-alt)',
                    borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                    color: isSelected ? 'var(--color-accent)' : 'var(--color-body)'
                  }}
                >
                  <span className="font-semibold text-xs flex items-center justify-between">
                    {cat.label}
                    {isSelected && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-1 font-normal">
                    {cat.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Details Grid */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-heading)' }}>
            2. Your Information
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-body)' }}>
                Full Name <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-heading)'
                  }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-body)' }}>
                Email Address <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="alex@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-heading)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Company / Organization */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-body)' }}>
              Company / Publication Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                name="company"
                placeholder="e.g. Tech Global Inc. or Freelance Journalist"
                value={formData.company}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-heading)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Message Details */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-heading)' }}>
            3. Enquiry Details
          </label>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-body)' }}>
              Subject Line <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                name="subject"
                required
                placeholder="Brief summary of your enquiry..."
                value={formData.subject}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-heading)'
                }}
              />
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium" style={{ color: 'var(--color-body)' }}>
                Message / Pitch Body <span className="text-amber-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {charCount} characters
              </span>
            </div>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Provide context, story background, target timeline, or specific questions for our editors..."
              value={formData.message}
              onChange={handleChange}
              className="w-full p-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-y"
              style={{
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-heading)'
              }}
            />
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-slate-500/5" style={{ borderColor: 'var(--color-border)' }}>
          <input
            type="checkbox"
            id="consent"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="consent" className="text-xs leading-relaxed cursor-pointer" style={{ color: 'var(--color-body)' }}>
            I agree to allow TGS Tech Info to process my details to respond to this enquiry in accordance with the{' '}
            <a href="/privacy-policy" className="font-semibold text-amber-500 hover:underline" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>. *
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!agreed || loading}
            className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all ${
              !agreed || loading
                ? 'opacity-50 cursor-not-allowed bg-slate-400'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending to Desk...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Message</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-medium text-sm border flex items-center justify-center gap-2 transition-all hover:bg-slate-500/10"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-body)'
            }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </form>

      {/* Visual Popup Modal */}
      <AnimatePresence>
        {modalPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-md w-full p-6 sm:p-8 rounded-2xl shadow-2xl text-center relative border"
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                borderColor: 'var(--color-border, #e2e8f0)',
                color: 'var(--color-heading, #0f172a)'
              }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-md">
                {modalPopup.type === 'success' ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">
                {modalPopup.type === 'success' ? 'Message Sent!' : 'Submission Notice'}
              </h3>

              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-muted, #64748b)' }}>
                {modalPopup.message}
              </p>

              <button
                type="button"
                onClick={() => setModalPopup(null)}
                className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white shadow-md transition-all bg-amber-500 hover:bg-amber-600"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
