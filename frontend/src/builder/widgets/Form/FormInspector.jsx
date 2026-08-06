/**
 * Form Inspector Component
 * The Content tab in the Properties panel for the Form widget.
 * Delegates entirely to FormWidget which has the full editing UI.
 */

import React from 'react';
import FormWidget from './FormWidget.jsx';

export default function FormInspector({ node, onUpdate }) {
  return <FormWidget node={node} onUpdate={onUpdate} />;
}
