const fs = require('fs');
const path = require('path');
const Media = require('../src/models/Media');
const mediaController = require('../src/controllers/mediaController');

async function testPhase8() {
    console.log('--- Testing Phase 8: Media Upload Performance & Disk Streaming ---');
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const testFilename = `test-perf-${Date.now()}.png`;
    const testFilePath = path.join(uploadDir, testFilename);
    let createdMediaId = null;

    try {
        // 1. Create a dummy test image on disk
        const sampleBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(testFilePath, sampleBuffer);
        console.log('✅ Created test image file on disk:', testFilePath);

        // 2. Save media record with file_data=null (disk-only)
        const saved = await Media.create({
            filename: testFilename,
            original_name: 'test-icon.png',
            file_path: `/uploads/${testFilename}`,
            file_type: 'image',
            file_size: sampleBuffer.length,
            mime_type: 'image/png',
            folder: 'Images',
            uploaded_by: 1,
            file_data: null
        });
        createdMediaId = saved.id;
        console.log('✅ Saved media in DB without memory blob, ID:', createdMediaId);

        // 3. Test serveFile streams directly from disk
        let servedViaSendFile = false;
        const mockReq = { params: { filename: testFilename }, query: {} };
        const mockRes = {
            sendFile: (filePath) => {
                console.log('serveFile routed directly to res.sendFile (streaming):', filePath);
                servedViaSendFile = true;
                return mockRes;
            },
            status: (code) => {
                console.log('Status code:', code);
                return mockRes;
            },
            json: (obj) => {
                console.log('JSON response:', obj);
                return mockRes;
            }
        };

        await mediaController.serveFile(mockReq, mockRes);
        if (!servedViaSendFile) throw new Error('serveFile did not stream from disk via res.sendFile!');
        console.log('✅ serveFile verified: streams from disk without buffering entire file in memory.');

        // 4. Test deleteFile removes both database record and disk file
        const mockDeleteReq = { params: { id: createdMediaId } };
        let deleteResult = null;
        const mockDeleteRes = {
            json: (data) => { deleteResult = data; return mockDeleteRes; },
            status: () => mockDeleteRes
        };

        await mediaController.deleteFile(mockDeleteReq, mockDeleteRes);
        console.log('deleteFile result:', deleteResult);

        const checkDb = await Media.findById(createdMediaId);
        const checkDisk = fs.existsSync(testFilePath);

        console.log('Record exists in DB?', !!checkDb);
        console.log('File exists on disk?', checkDisk);

        if (checkDb) throw new Error('Media was not deleted from DB!');
        if (checkDisk) throw new Error('Media was not deleted from disk!');
        console.log('✅ Media deletion safely cleaned both DB and disk.');

        console.log('\n🎉 ALL PHASE 8 TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Phase 8 test failed:', err);
        // Clean up in case of failure
        if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
        if (createdMediaId) await Media.delete(createdMediaId);
        process.exit(1);
    }
}

testPhase8();
