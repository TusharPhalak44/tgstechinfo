/**
 * Globe Breadcrumb Navigation
 * Shows navigation hierarchy and allows clicking to navigate back
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

const GlobeBreadcrumb = ({
  navigationStack = [],
  onNavigate = null,
  darkMode = true,
}) => {
  const handleBreadcrumbClick = (index) => {
    if (onNavigate) {
      onNavigate(index);
    }
  };

  if (!navigationStack || navigationStack.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-3 border-b ${
      darkMode 
        ? 'bg-slate-900/50 border-slate-800' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <span className={`text-xs font-mono font-semibold tracking-wider ${
        darkMode ? 'text-slate-500' : 'text-slate-400'
      }`}>
        LOCATION
      </span>

      <div className="flex items-center gap-1">
        {navigationStack.map((item, index) => (
          <React.Fragment key={index}>
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className={`px-3 py-1 rounded transition-all text-sm font-mono ${
                index === navigationStack.length - 1
                  ? darkMode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-cyan-100/50 text-cyan-700 border border-cyan-300'
                  : darkMode
                    ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-cyan-600 hover:bg-slate-100'
              }`}
            >
              {item.name}
            </button>

            {index < navigationStack.length - 1 && (
              <ChevronRight size={16} className={darkMode ? 'text-slate-600' : 'text-slate-400'} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current zoom level indicator */}
      <div className={`ml-auto text-xs font-mono ${
        darkMode ? 'text-slate-500' : 'text-slate-400'
      }`}>
        Level: {navigationStack.length - 1}
      </div>
    </div>
  );
};

export default GlobeBreadcrumb;
