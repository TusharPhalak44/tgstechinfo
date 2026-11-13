import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolveContentRoute } from '../lib/contentRoute';

/**
 * Handles legacy root URLs like /my-article-slug that were previously generated in old sitemaps.
 * Looks up the content item by slug and seamlessly redirects to its canonical URL
 * (e.g. /article/:category/:slug or /events/:slug), or renders 404 if not found.
 */
const LegacySlugRedirect = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setNotFound(true);
      return;
    }

    const resolveSlug = async () => {
      try {
        const response = await axios.get(`/api/public/content/${encodeURIComponent(slug)}`);
        if (cancelled) return;

        const content = response.data?.content;
        if (content && content.slug) {
          const resolved = resolveContentRoute(content);
          if (resolved?.url && resolved.url !== `/${slug}`) {
            navigate(resolved.url, { replace: true });
            return;
          }
        }
        setNotFound(true);
      } catch {
        if (!cancelled) {
          setNotFound(true);
        }
      }
    };

    resolveSlug();

    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  if (notFound) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', background: '#f8f9fa', minHeight: '80vh' }}>
        <h1 style={{ fontSize: 72, fontWeight: 900, color: '#0F172A', margin: 0 }}>404</h1>
        <p style={{ fontSize: 20, color: '#64748B', marginBottom: 32 }}>Page not found</p>
        <a href="/" style={{ background: '#2563EB', color: '#fff', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#64748B' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Loading page...</div>
      </div>
    </div>
  );
};

export default LegacySlugRedirect;
