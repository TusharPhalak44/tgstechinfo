import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Navigation, ExternalLink, Building2, Globe } from 'lucide-react';

export const OfficeMap = () => {
  const addressQuery = encodeURIComponent(
    'The Space Business Complex, Office No 512 - 516, Grant Rd, Kharadi, Pune, Maharashtra 411014, India'
  );
  const mapsDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
  
  // Google Maps Embed URL for Kharadi Pune Business Center
  const mapEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3782.493976378411!2d73.9472!3d18.5518!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c3c6f8f55555%3A0x123456789abcdef!2sKharadi%2C%20Pune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b relative z-10" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--color-heading)' }}>
            <Building2 className="w-6 h-6 text-amber-500" />
            Global Headquarters & Location
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Visit our publication operations center or reach out via our direct international phone lines.
          </p>
        </div>

        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          href={mapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm transition-all self-start sm:self-auto"
        >
          <Navigation className="w-4 h-4" />
          <span>Get Directions</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </motion.a>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
        {/* HQ Address */}
        <div 
          className="p-4 rounded-xl border transition-all" 
          style={{ backgroundColor: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" /> HQ Address
          </div>
          <p className="text-xs font-extrabold" style={{ color: 'var(--color-heading)' }}>
            The Space Business Complex
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Office No 512 - 516, Grant Rd, Kharadi, Pune, MH 411014, India
          </p>
        </div>

        {/* Business Hours EST */}
        <div 
          className="p-4 rounded-xl border transition-all" 
          style={{ backgroundColor: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" /> Business Hours
          </div>
          <p className="text-xs font-extrabold" style={{ color: 'var(--color-heading)' }}>
            Monday – Friday
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            9:00 AM – 6:00 PM EST <span className="text-amber-500 font-semibold">(Sat & Sun: Closed)</span>
          </p>
        </div>

        {/* Phone Support (US & IN) */}
        <div 
          className="p-4 rounded-xl border transition-all" 
          style={{ backgroundColor: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
            <Phone className="w-4 h-4" /> Direct Phone Lines
          </div>
          <div className="space-y-1">
            <a
              href="tel:+13464878307"
              className="text-xs font-bold hover:underline flex items-center gap-1.5"
              style={{ color: 'var(--color-heading)' }}
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>US: +1 346-487-8307</span>
            </a>
            <a
              href="tel:+919665599442"
              className="text-xs font-bold hover:underline flex items-center gap-1.5"
              style={{ color: 'var(--color-heading)' }}
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>IN: +91 96655-99442</span>
            </a>
          </div>
        </div>
      </div>

      {/* Embedded Map Container */}
      <div className="relative w-full h-80 rounded-xl overflow-hidden border shadow-inner relative z-10" style={{ borderColor: 'var(--color-border)' }}>
        <iframe
          title="TGS Tech Info HQ Location"
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'contrast(1.05) opacity(0.95)' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </motion.div>
  );
};
