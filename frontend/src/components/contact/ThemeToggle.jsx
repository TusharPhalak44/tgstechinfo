import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 rounded-full bg-[var(--color-primary)] text-white px-4 py-2 hover:bg-[var(--color-primary-hover)] transition"
    >
      {darkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};
