import { motion } from 'framer-motion';

export const ContactHero = () => (
  <motion.div
    className="max-w-7xl mx-auto text-center mb-10"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  >
    <h1
      className="text-4xl sm:text-6xl font-extrabold tracking-tight pb-2"
      style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      Get in Touch
    </h1>
    <p
      className="mt-4 text-xl max-w-3xl mx-auto font-medium"
      style={{ color: 'var(--color-body)' }}
    >
      We'd love to hear from you. Whether you have a question, feedback, a
      partnership opportunity, or need support, our team is here to help.
    </p>
  </motion.div>
);
