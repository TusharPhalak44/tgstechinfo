const mysql = require('../node_modules/mysql2/promise');

function getUSFederalHolidays(year) {
    const holidays = {};
    const pad = (n) => String(n).padStart(2, '0');
    const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    function addWithObservation(d, name) {
        holidays[toStr(d)] = name;
        const day = d.getDay();
        if (day === 0) {
            const obs = new Date(d);
            obs.setDate(d.getDate() + 1);
            holidays[toStr(obs)] = `${name} (Observed)`;
        } else if (day === 6) {
            const obs = new Date(d);
            obs.setDate(d.getDate() - 1);
            holidays[toStr(obs)] = `${name} (Observed)`;
        }
    }

    addWithObservation(new Date(year, 0, 1), "New Year's Day");
    let d = new Date(year, 0, 1);
    let count = 0;
    while (d.getMonth() === 0) {
        if (d.getDay() === 1) { count++; if (count === 3) break; }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Martin Luther King Jr. Day';

    d = new Date(year, 1, 1); count = 0;
    while (d.getMonth() === 1) {
        if (d.getDay() === 1) { count++; if (count === 3) break; }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = "Presidents' Day";

    d = new Date(year, 4, 31);
    while (d.getDay() !== 1) { d.setDate(d.getDate() - 1); }
    holidays[toStr(d)] = 'Memorial Day';

    addWithObservation(new Date(year, 5, 19), 'Juneteenth National Independence Day');
    addWithObservation(new Date(year, 6, 4), 'Independence Day');

    d = new Date(year, 8, 1);
    while (d.getDay() !== 1) { d.setDate(d.getDate() + 1); }
    holidays[toStr(d)] = 'Labor Day';

    d = new Date(year, 9, 1); count = 0;
    while (d.getMonth() === 9) {
        if (d.getDay() === 1) { count++; if (count === 2) break; }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Columbus Day';

    addWithObservation(new Date(year, 10, 11), 'Veterans Day');

    d = new Date(year, 10, 1); count = 0;
    while (d.getMonth() === 10) {
        if (d.getDay() === 4) { count++; if (count === 4) break; }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Thanksgiving Day';

    addWithObservation(new Date(year, 11, 25), 'Christmas Day');

    return holidays;
}

const usHolidays = {};
for (let y = 2022; y <= 2026; y++) {
    Object.assign(usHolidays, getUSFederalHolidays(y));
}

async function verifyDb(dbName) {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: dbName
    });

    console.log(`\n============================================================`);
    console.log(`🔎 AUDIT VERIFICATION REPORT FOR [${dbName}]`);
    console.log(`============================================================`);

    // 1. Weekend check
    const [weekends] = await conn.query(`
        SELECT id, title, published_date, DAYNAME(published_date) as day_name
        FROM contents
        WHERE status = 'published' AND DAYOFWEEK(published_date) IN (1, 7)
    `);
    console.log(`1. Weekend records found (Saturdays/Sundays): ${weekends.length}`);

    // 2. Holiday check
    const [allPublished] = await conn.query(`
        SELECT id, title, DATE_FORMAT(published_date, '%Y-%m-%d') as pub_date, DAYNAME(published_date) as day_name
        FROM contents
        WHERE status = 'published'
    `);
    const holidayMatches = allPublished.filter(row => usHolidays[row.pub_date]);
    console.log(`2. US Federal Holiday records found: ${holidayMatches.length}`);

    // 3. Date range & count
    const [range] = await conn.query(`
        SELECT 
            MIN(published_date) as earliest, 
            MAX(published_date) as latest, 
            COUNT(*) as total_published 
        FROM contents 
        WHERE status = 'published'
    `);
    console.log('3. Summary range:');
    console.table(range);

    // 4. Top 5 on website (latest - 2026)
    const [topRows] = await conn.query(`
        SELECT id, title, DATE_FORMAT(published_date, '%Y-%m-%d %H:%i:%s') as pub_date, DAYNAME(published_date) as day_name
        FROM contents
        WHERE status = 'published'
        ORDER BY published_date DESC
        LIMIT 5
    `);
    console.log('4. Top 5 published contents (latest):');
    console.table(topRows);

    // 5. Earliest 5 on website (2022)
    const [bottomRows] = await conn.query(`
        SELECT id, title, DATE_FORMAT(published_date, '%Y-%m-%d %H:%i:%s') as pub_date, DAYNAME(published_date) as day_name
        FROM contents
        WHERE status = 'published'
        ORDER BY published_date ASC
        LIMIT 5
    `);
    console.log('5. Oldest 5 published contents (earliest):');
    console.table(bottomRows);

    await conn.end();
}

async function main() {
    await verifyDb('tgstechinfo');
    await verifyDb('publishing_platform');
    process.exit(0);
}

main().catch(console.error);
