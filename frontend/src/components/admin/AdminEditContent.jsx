import React from 'react';
import CreateContent from '../user/CreateContent';

/**
 * AdminEditContent (Legacy Bridge)
 * Delegating all editing actions to canonical CreateContent.
 */
const AdminEditContent = (props) => {
  return <CreateContent {...props} />;
};

export default AdminEditContent;
