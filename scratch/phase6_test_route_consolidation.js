// Test Phase 6 route consolidation logic & redirects
const assert = require('assert');

function simulateAdminRedirect(pathname, search = '', state = null) {
    const targetPath = (pathname === '/admin' || pathname === '/admin/')
        ? '/dashboard'
        : pathname.replace(/^\/admin(\/|$)/, '/dashboard$1');

    return {
        to: `${targetPath}${search}`,
        replace: true,
        state
    };
}

console.log('--- Running Phase 6 Route Consolidation Logic Tests ---');

const testCases = [
    {
        inputPath: '/admin',
        inputSearch: '',
        expected: '/dashboard',
        desc: 'Base /admin redirects to /dashboard'
    },
    {
        inputPath: '/admin/',
        inputSearch: '',
        expected: '/dashboard',
        desc: 'Trailing slash /admin/ redirects to /dashboard'
    },
    {
        inputPath: '/admin/submissions',
        inputSearch: '?page=2&limit=20',
        expected: '/dashboard/submissions?page=2&limit=20',
        desc: 'Submissions query parameters (?page=2&limit=20) preserved'
    },
    {
        inputPath: '/admin/audience',
        inputSearch: '',
        expected: '/dashboard/audience',
        desc: 'Audience dashboard route preserved'
    },
    {
        inputPath: '/admin/review/381',
        inputSearch: '?source=notification',
        expected: '/dashboard/review/381?source=notification',
        desc: 'Dynamic review ID (381) and query preserved'
    },
    {
        inputPath: '/admin/edit/42',
        inputSearch: '?tab=metadata',
        expected: '/dashboard/edit/42?tab=metadata',
        desc: 'Dynamic edit ID (42) and query preserved'
    },
    {
        inputPath: '/admin/content/15',
        inputSearch: '',
        expected: '/dashboard/content/15',
        desc: 'Dynamic content detail ID preserved'
    },
    {
        inputPath: '/admin/analytics',
        inputSearch: '?period=30d&filter=geo',
        expected: '/dashboard/analytics?period=30d&filter=geo',
        desc: 'Analytics filters preserved'
    },
    {
        inputPath: '/admin/users',
        inputSearch: '?role=admin&search=john',
        expected: '/dashboard/users?role=admin&search=john',
        desc: 'User search query params preserved'
    },
    {
        inputPath: '/admin/pending-review',
        inputSearch: '',
        expected: '/dashboard/pending-review',
        desc: 'Editorial review queue preserved'
    },
    {
        inputPath: '/admin/media-library',
        inputSearch: '?folder=articles',
        expected: '/dashboard/media-library?folder=articles',
        desc: 'Media library folder query preserved'
    }
];

let passed = 0;
testCases.forEach((tc, idx) => {
    const res = simulateAdminRedirect(tc.inputPath, tc.inputSearch, { fromTest: true });
    assert.strictEqual(res.to, tc.expected, `Mismatch for ${tc.inputPath}`);
    assert.strictEqual(res.replace, true, `Expected replace: true for ${tc.inputPath}`);
    assert.deepStrictEqual(res.state, { fromTest: true }, `Expected state preserved for ${tc.inputPath}`);
    console.log(`✅ [PASS] ${idx + 1}. ${tc.desc}: ${tc.inputPath}${tc.inputSearch} -> ${res.to}`);
    passed++;
});

// Test loop avoidance
console.log('\n--- Testing Loop Avoidance ---');
const dashboardPath = '/dashboard/review/381';
const redirectedAgain = simulateAdminRedirect(dashboardPath);
assert.strictEqual(redirectedAgain.to, dashboardPath, 'Should not alter non-admin paths');
console.log('✅ [PASS] Loop avoidance: /dashboard paths are not intercepted or looped');

console.log(`\n🎉 All ${passed + 1} route consolidation logic tests passed!`);
