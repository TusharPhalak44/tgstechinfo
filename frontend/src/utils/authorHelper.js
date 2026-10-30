/**
 * Generate SEO-friendly URL slug for an author (e.g. 'abigail-taylor' or 'admin-user')
 * @param {Object} authorOrContent - Author object or content item containing first_name, last_name, role, user_id
 * @returns {string} Slug string
 */
export const getAuthorSlug = (authorOrContent) => {
  if (!authorOrContent) return 'admin-user';
  const first = String(authorOrContent.first_name || '').trim();
  const last = String(authorOrContent.last_name || '').trim();
  const fullName = `${first} ${last}`.trim();
  if (!fullName) {
    if (authorOrContent.role === 'admin' || authorOrContent.user_id === 1 || authorOrContent.id === 1) {
      return 'admin-user';
    }
    return String(authorOrContent.user_id || authorOrContent.id || 'author');
  }
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default getAuthorSlug;

