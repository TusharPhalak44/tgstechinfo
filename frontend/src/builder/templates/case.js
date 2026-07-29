/**
 * Case Study Template
 * Pre-built template for case study pages
 */

import { NodeType } from '../utils/types';

export const caseTemplate = {
  root: {
    id: 'root',
    type: 'page',
    label: 'Case Study Page',
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
                label: 'Case Study Title',
                content: 'How We Helped Our Client Succeed',
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
                label: 'Case Study Subtitle',
                content: 'A detailed look at our successful partnership',
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

export default caseTemplate;
