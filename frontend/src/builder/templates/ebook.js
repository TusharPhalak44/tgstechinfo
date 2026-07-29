/**
 * eBook Landing Page Template
 * Pre-built template for eBook download pages
 */

import { NodeType } from '../utils/types';

export const ebookTemplate = {
  root: {
    id: 'root',
    type: 'page',
    label: 'eBook Landing Page',
    children: [
      {
        id: 'hero-section',
        type: 'section',
        label: 'Hero Section',
        children: [
          {
            id: 'hero-container',
            type: 'container',
            label: 'Hero Container',
            children: [
              {
                id: 'hero-heading',
                type: NodeType.HEADING,
                label: 'eBook Title',
                content: 'Get Your Free eBook',
                headingLevel: 'h1',
                alignment: 'center',
                children: [],
                settings: {},
                styles: {},
                responsive: {},
                metadata: { createdAt: Date.now(), updatedAt: Date.now() },
              },
              {
                id: 'hero-subtitle',
                type: NodeType.PARAGRAPH,
                label: 'eBook Subtitle',
                content: 'Comprehensive guide to help you succeed',
                alignment: 'center',
                children: [],
                settings: {},
                styles: {},
                responsive: {},
                metadata: { createdAt: Date.now(), updatedAt: Date.now() },
              },
              {
                id: 'hero-cta',
                type: NodeType.BUTTON,
                label: 'Download Button',
                content: JSON.stringify({ text: 'Download eBook', url: '#download' }),
                children: [],
                settings: {},
                styles: {},
                responsive: {},
                metadata: { createdAt: Date.now(), updatedAt: Date.now() },
              },
            ],
            settings: {},
            styles: {
              textAlign: 'center',
              padding: '60px 20px',
            },
            responsive: {},
            metadata: { createdAt: Date.now(), updatedAt: Date.now() },
          },
        ],
        settings: {},
        styles: {
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: '#fff',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '20px',
        },
        responsive: {},
        metadata: { createdAt: Date.now(), updatedAt: Date.now() },
      },
    ],
    settings: {},
    styles: {},
    responsive: {},
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
};

export default ebookTemplate;
