import React, { useEffect, useState } from 'react';

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check local storage or default to light
    if (typeof window !== 'undefined') {
      return document.documentElement.dataset.theme === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);

  const toggle = () => setIsDark(!isDark);

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 rounded-full bg-[var(--color-primary)] text-white px-4 py-2 hover:bg-[var(--color-primary-hover)] transition"
    >
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};
