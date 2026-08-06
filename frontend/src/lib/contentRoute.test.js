import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveContentRoute } from './contentRoute.js';

test('resolves landing-page content to the standalone route', () => {
  const route = resolveContentRoute({
    slug: 'demo-page',
    builder_layout: JSON.stringify(['html']),
    content_type: 'article'
  });

  assert.deepEqual(route, { url: '/content/demo-page', newTab: true });
});

test('preserves an existing internal API URL', () => {
  const route = resolveContentRoute({
    slug: 'news-post',
    url: '/news/news-post'
  });

  assert.deepEqual(route, { url: '/news/news-post', newTab: false });
});

test('opens external URLs in a new tab', () => {
  const route = resolveContentRoute({
    slug: 'external-link',
    url: 'https://example.com/path'
  });

  assert.deepEqual(route, { url: 'https://example.com/path', newTab: true });
});

test('falls back to a content-type route for regular content', () => {
  const route = resolveContentRoute({
    slug: 'ai-trends',
    content_type: 'blog'
  });

  assert.deepEqual(route, { url: '/blog/ai-trends', newTab: false });
});

test('normalizes plural content types to the route slug', () => {
  const route = resolveContentRoute({
    slug: 'ai-trends',
    content_type: 'Articles'
  });

  assert.deepEqual(route, { url: '/article/ai-trends', newTab: false });
});
