/**
 * Webinar Landing Page Template
 * Pre-built template for webinar registration pages
 */

import { NodeType } from '../utils/types';

export const webinarTemplate = {
  root: {
    id: 'root',
    type: 'page',
    label: 'Webinar Landing Page',
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
                label: 'Webinar Title',
                content: 'Join Our Exclusive Webinar',
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
                label: 'Webinar Subtitle',
                content: 'Learn industry secrets from our expert speakers',
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
                label: 'Register Button',
                content: JSON.stringify({ text: 'Register Now', url: '#register' }),
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
      {
        id: 'details-section',
        type: 'section',
        label: 'Webinar Details',
        children: [
          {
            id: 'details-container',
            type: 'container',
            label: 'Details Container',
            children: [
              {
                id: 'details-heading',
                type: NodeType.HEADING,
                label: 'Details Heading',
                content: 'Webinar Details',
                headingLevel: 'h2',
                alignment: 'center',
                children: [],
                settings: {},
                styles: {},
                responsive: {},
                metadata: { createdAt: Date.now(), updatedAt: Date.now() },
              },
              {
                id: 'details-content',
                type: NodeType.PARAGRAPH,
                label: 'Details Content',
                content: 'Date: [Date] | Time: [Time] | Duration: [Duration]',
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
              padding: '32px',
            },
            responsive: {},
            metadata: { createdAt: Date.now(), updatedAt: Date.now() },
          },
        ],
        settings: {},
        styles: {
          background: '#fff',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '20px',
          border: '1px solid #e8e8e8',
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

export default webinarTemplate;
