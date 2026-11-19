const BenchmarkService = require('../src/services/benchmarkService');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testConnection() {
    console.log('--- Benchmark Email Connection Diagnostic ---');
    console.log('Base URL:', BenchmarkService.getBaseUrl());
    console.log('Configured:', BenchmarkService.isConfigured());
    console.log('API Key (masked):', BenchmarkService.getApiKey() ? `${BenchmarkService.getApiKey().slice(0, 6)}...${BenchmarkService.getApiKey().slice(-4)}` : 'NOT SET');

    if (!BenchmarkService.isConfigured()) {
        console.error('❌ Error: BENCHMARK_API_KEY is not set in backend/.env');
        process.exit(1);
    }

    const res = await BenchmarkService.getContactLists();
    console.log('\n--- API Response ---');
    console.log('Success:', res.success);
    console.log('Status Code:', res.statusCode);
    if (res.success) {
        console.log('✅ Connection Successful!');
        console.log('Lists Data:', JSON.stringify(res.data, null, 2));
    } else {
        console.log('❌ Connection Failed:', res.error);
        if (res.details) {
            console.log('Details:', JSON.stringify(res.details, null, 2));
        }
    }
}

testConnection().catch(console.error);
