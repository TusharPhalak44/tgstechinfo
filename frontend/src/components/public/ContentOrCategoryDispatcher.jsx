import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import CategoryList from './CategoryList';

// Core category slugs present in the system for instant synchronous resolution
const DEFAULT_CATEGORY_SLUGS = new Set([
  'technology',
  'artificial-intelligence',
  'generative-ai',
  'machine-learning',
  'cybersecurity',
  'cloud-computing',
  'data-analytics',
  'data-science',
  'software-development',
  'it-infrastructure',
  'devops',
  'networking',
  'automation',
  'healthtech',
  'healthcare',
  'hr-tech',
  'hrtech',
  'martech',
  'edtech',
  'fintech',
  'itech'
]);

// In-memory cache for dynamically fetched categories from backend database
let dynamicCategorySlugsCache = null;

export const isCategorySlug = (slug) => {
  if (!slug) return false;
  const clean = String(slug).toLowerCase().trim();
  if (DEFAULT_CATEGORY_SLUGS.has(clean)) return true;
  if (dynamicCategorySlugsCache && dynamicCategorySlugsCache.has(clean)) return true;
  return false;
};

/**
 * Dispatcher for 2-segment routes like /<content-type>/<param>.
 * If <param> matches a known category (e.g. /article/itech, /blog/fintech, /whitepaper/technology),
 * it renders CategoryList showing all content of that type in that category.
 * If <param> is an article/content slug (e.g. /article/my-unique-article-title),
 * it renders detailElement (ArticleDetail / EventDetailPage / CaseStudyPage).
 */
const ContentOrCategoryDispatcher = ({ detailElement }) => {
  const { slug, category } = useParams();
  const location = useLocation();
  const targetParam = slug || category || '';
  const cleanSlug = String(targetParam).toLowerCase().trim();

  const [isCategory, setIsCategory] = useState(() => isCategorySlug(cleanSlug));

  useEffect(() => {
    let cancelled = false;

    if (DEFAULT_CATEGORY_SLUGS.has(cleanSlug)) {
      setIsCategory(true);
      return;
    }

    if (!dynamicCategorySlugsCache) {
      axios.get('/api/public/categories')
        .then(res => {
          if (cancelled) return;
          const set = new Set();
          if (Array.isArray(res.data)) {
            res.data.forEach(c => {
              if (c.slug) set.add(String(c.slug).toLowerCase().trim());
            });
          }
          dynamicCategorySlugsCache = set;
          setIsCategory(set.has(cleanSlug));
        })
        .catch(() => {
          if (!cancelled) {
            setIsCategory(false);
          }
        });
    } else {
      setIsCategory(dynamicCategorySlugsCache.has(cleanSlug));
    }

    return () => {
      cancelled = true;
    };
  }, [cleanSlug]);

  if (isCategory) {
    return <CategoryList />;
  }

  return detailElement;
};

export default ContentOrCategoryDispatcher;
