/**
 * Contact Page Template
 * Pre-built template for contact pages
 */

import { NodeType } from '../utils/types';

export const contactTemplate = {
  root: {
    id: 'root',
    type: 'page',
    label: 'Contact Page',
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
                label: 'Contact Heading',
                content: 'Get In Touch',
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
                label: 'Contact Subtitle',
                content: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
                alignment: 'center',
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
          background: 'linear-gradient(135deg, #4a7cff 0%, #667eea 100%)',
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

export default contactTemplate;
