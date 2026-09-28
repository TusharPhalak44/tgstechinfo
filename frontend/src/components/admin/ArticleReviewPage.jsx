import React from 'react';
import ContentReviewDetail from './ContentReviewDetail';

/**
 * ArticleReviewPage (Legacy Bridge)
 * Delegating all review actions to canonical ContentReviewDetail.
 */
const ArticleReviewPage = (props) => {
  return <ContentReviewDetail {...props} />;
};

export default ArticleReviewPage;