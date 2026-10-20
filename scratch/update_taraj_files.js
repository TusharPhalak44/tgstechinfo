const fs = require('fs');
const path = require('path');

const TARAJ_ROOT = 'c:/Users/Nakshtra/OneDrive/Desktop/TaRajGlobal/tarajglobal';

// 1. Update tarajglobal/server/app.js
const serverAppPath = path.join(TARAJ_ROOT, 'server/app.js');
let serverAppContent = fs.readFileSync(serverAppPath, 'utf8');

if (!serverAppContent.includes('audienceRoutes')) {
  // Add import
  serverAppContent = serverAppContent.replace(
    "import chatRoutes from './routes/chat.routes.js'",
    "import chatRoutes from './routes/chat.routes.js'\nimport audienceRoutes from './routes/audience.routes.js'"
  );
  // Add route mount
  serverAppContent = serverAppContent.replace(
    "app.use('/api/chat', chatRoutes)",
    "app.use('/api/chat', chatRoutes)\napp.use('/api/audience', audienceRoutes)"
  );
  fs.writeFileSync(serverAppPath, serverAppContent, 'utf8');
  console.log('tarajglobal/server/app.js updated successfully!');
} else {
  console.log('tarajglobal/server/app.js already contains audienceRoutes.');
}

// 2. Update tarajglobal/client/src/pages/Home/index.jsx
const homePath = path.join(TARAJ_ROOT, 'client/src/pages/Home/index.jsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

if (!homeContent.includes('AudienceMapSection')) {
  // Add import
  homeContent = homeContent.replace(
    "import Services from '@components/sections/Services/Services'",
    "import Services from '@components/sections/Services/Services'\nimport AudienceMapSection from '@components/sections/AudienceMap'"
  );

  // Update CHAPTERS
  homeContent = homeContent.replace(
    "{ id: 'services', label: 'Solutions' },\n  { id: 'results', label: 'Impact' },",
    "{ id: 'services', label: 'Solutions' },\n  { id: 'reach', label: 'Global Reach' },\n  { id: 'results', label: 'Impact' },"
  );

  // Add component to JSX
  homeContent = homeContent.replace(
    "<Services activeGoal={activeGoal} />\n      <Stats activeGoal={activeGoal} />",
    "<Services activeGoal={activeGoal} />\n      <AudienceMapSection />\n      <Stats activeGoal={activeGoal} />"
  );

  fs.writeFileSync(homePath, homeContent, 'utf8');
  console.log('tarajglobal/client/src/pages/Home/index.jsx updated successfully!');
} else {
  console.log('tarajglobal/client/src/pages/Home/index.jsx already contains AudienceMapSection.');
}
