const http = require('http');

function fetchUrl(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

(async () => {
  console.log('--- Phase 7 Endpoints Audit ---');

  // 1. Frontend Homepage
  try {
    const home = await fetchUrl({ hostname: 'localhost', port: 5173, path: '/', method: 'GET' });
    console.log(`Frontend /: status ${home.statusCode}, length: ${home.data.length}, contains root: ${home.data.includes('id="root"')}`);
  } catch (e) {
    console.log(`Frontend / error: ${e.message}`);
  }

  // 2. Hero Images
  const heroImgs = [
    '/images/hero/hero_ai.jpg',
    '/images/hero/hero_cybersecurity.jpg',
    '/images/hero/hero_cloud.jpg',
    '/images/hero/hero_data.jpg'
  ];
  for (const img of heroImgs) {
    try {
      const res = await fetchUrl({ hostname: 'localhost', port: 5173, path: img, method: 'GET' });
      console.log(`Hero image ${img}: status ${res.statusCode}, contentType: ${res.headers['content-type']}, length: ${res.data.length}`);
    } catch (e) {
      console.log(`Hero image ${img} error: ${e.message}`);
    }
  }

  // 3. Public Content API
  try {
    const pubContent = await fetchUrl({ hostname: 'localhost', port: 5000, path: '/api/public/content?limit=5', method: 'GET' });
    const json = JSON.parse(pubContent.data);
    console.log(`Public Content: status ${pubContent.statusCode}, total: ${json.data?.total || json.total || 'N/A'}, items: ${json.data?.contents?.length || json.data?.length || 0}`);
  } catch (e) {
    console.log(`Public Content error: ${e.message}`);
  }

  // 4. Public Categories API
  try {
    const pubCat = await fetchUrl({ hostname: 'localhost', port: 5000, path: '/api/public/categories', method: 'GET' });
    const json = JSON.parse(pubCat.data);
    console.log(`Public Categories: status ${pubCat.statusCode}, count: ${Array.isArray(json.data) ? json.data.length : (Array.isArray(json) ? json.length : 'N/A')}`);
  } catch (e) {
    console.log(`Public Categories error: ${e.message}`);
  }

  // 5. Public Search API
  try {
    const pubSearch = await fetchUrl({ hostname: 'localhost', port: 5000, path: '/api/public/search?q=AI&limit=5', method: 'GET' });
    console.log(`Public Search: status ${pubSearch.statusCode}`);
  } catch (e) {
    console.log(`Public Search error: ${e.message}`);
  }

  // 6. Chatbot Search API
  try {
    const payload = JSON.stringify({ query: 'AI' });
    const botRes = await fetchUrl({
      hostname: 'localhost',
      port: 5000,
      path: '/api/chatbot/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);
    const json = JSON.parse(botRes.data);
    console.log(`Chatbot Search: status ${botRes.statusCode}, results: ${json.data ? json.data.length : (Array.isArray(json) ? json.length : 'N/A')}`);
  } catch (e) {
    console.log(`Chatbot Search error: ${e.message}`);
  }

  // 7. Unauthenticated Admin Protection (Should return 401)
  const protectedPaths = [
    '/api/admin/content',
    '/api/admin/users',
    '/api/admin/dashboard/stats',
    '/api/admin/dashboard/kpis',
    '/api/admin/chatbot/stats'
  ];
  for (const p of protectedPaths) {
    try {
      const res = await fetchUrl({ hostname: 'localhost', port: 5000, path: p, method: 'GET' });
      console.log(`Protected ${p}: status ${res.statusCode} (Expected 401)`);
    } catch (e) {
      console.log(`Protected ${p} error: ${e.message}`);
    }
  }

  // 8. Public Submissions / Contact form
  try {
    const postPayload = JSON.stringify({
      full_name: 'Phase 7 Tester',
      email: 'test_phase7@example.com',
      subject: 'Forensic Audit Ingestion',
      message: 'Forensic audit submission test',
      consent_given: true
    });
    const subRes = await fetchUrl({
      hostname: 'localhost',
      port: 5000,
      path: '/api/public/contact',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postPayload)
      }
    }, postPayload);
    console.log(`Public Contact Submission: status ${subRes.statusCode}`);
  } catch (e) {
    console.log(`Public Contact Submission error: ${e.message}`);
  }

  process.exit(0);
})();
