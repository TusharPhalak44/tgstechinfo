/**
 * Product Launch Template
 * Pre-built template for product launch pages
 */

import { NodeType } from '../utils/types';

export const productTemplate = {
  root: {
    id: 'root',
    type: 'page',
    label: 'Product Launch Page',
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
                label: 'Product Title',
                content: 'Introducing Our New Product',
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
                label: 'Product Subtitle',
                content: 'Revolutionary solution for your needs',
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
                label: 'CTA Button',
                content: JSON.stringify({ text: 'Learn More', url: '#learn-more' }),
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
          background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
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

export default productTemplate;
