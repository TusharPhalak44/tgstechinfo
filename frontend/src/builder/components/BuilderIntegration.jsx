/**
 * BuilderIntegration Component
 * Integrates the new VisualBuilder with existing CreateContent component
 * Provides backward compatibility and smooth migration path
 *
 * Save/restore pipeline (v2.0):
 *   VisualBuilder serializes → { version:'2.0', layout: <full tree> }
 *   BuilderIntegration stores that JSON in `builder_page_data` via onSave callback
 *   CreateContent persists `builder_page_data` to the server
 *   On reload CreateContent passes builder_page_data back as initialData
 *   BuilderDeserializer.deserializeNewFormat reconstructs the full tree
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, message } from 'antd';
import VisualBuilder from './VisualBuilder';
import { convertDatabaseToBuilder, isLegacyFormat } from '../utils/compatibility';
import { registerAllWidgets } from '../registry/registerWidgets';

/**
 * BuilderIntegration Component
 */
export default function BuilderIntegration({
  existingData,
  onSave,
  onCancel,
  enableNewBuilder = false
}) {
  const [builderData, setBuilderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert existing data to builder format on mount / when existingData changes
  useEffect(() => {
    setIsLoading(true);
    try {
      if (existingData?.builder_page_data) {
        // v2.0 path — full page tree was persisted; feed it directly to the deserializer
        let pageData = existingData.builder_page_data;
        if (typeof pageData === 'string') {
          try { pageData = JSON.parse(pageData); } catch { pageData = null; }
        }
        setBuilderData(pageData || null);
      } else if (existingData) {
        // Legacy path — convert from builder_layout / builder_content_elements
        const converted = convertDatabaseToBuilder(existingData);
        setBuilderData(converted);
      } else {
        setBuilderData(null);
      }
    } catch (error) {
      console.error('[BuilderIntegration] Error loading data:', error);
      message.error('Failed to load existing content');
      setBuilderData(null);
    } finally {
      setIsLoading(false);
    }
  }, [existingData]);

  const handleBuilderSave = useCallback((serializedData, options = {}) => {
    // serializedData is already { version:'2.0', layout: <full tree>, metadata: {} }
    // Pass it straight back to CreateContent via onSave so it can be persisted.
    onSave?.({
      builder_page_data: serializedData,   // <- new canonical field
      // Keep legacy fields so other parts of CreateContent remain compatible
      builder_layout: serializedData?.layout ? [{ id: 'root', type: 'page' }] : [],
      builder_content_elements: [],
      content: '',
    });
    // Only show success message on manual save, not auto-sync
    if (!options.autoSync) {
      message.success('Visual builder saved successfully');
    }
  }, [onSave]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 400,
        color: '#999',
      }}>
        Loading builder…
      </div>
    );
  }

  return (
    <div
      className="builder-integration"
      style={{
        minHeight: 'calc(100vh - 200px)',
        height: 780,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e8e8e8',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <VisualBuilder
        initialData={builderData}
        onSave={handleBuilderSave}
        onCancel={onCancel}
        embedded={true}
      />
    </div>
  );
}

/** Hook to check if data is in legacy format */
export function useLegacyFormat(data) {
  return isLegacyFormat(data);
}
