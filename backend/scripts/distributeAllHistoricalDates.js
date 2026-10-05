const fs = require('fs');
const path = require('path');
const mysql = require('../node_modules/mysql2/promise');

/**
 * Returns a map of all US Federal Holidays (and observed dates) for a given year.
 */
function getUSFederalHolidays(year) {
    const holidays = {};
    const pad = (n) => String(n).padStart(2, '0');
    const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    function addWithObservation(d, name) {
        holidays[toStr(d)] = name;
        const day = d.getDay();
        if (day === 0) {
            // Sunday -> observed Monday
            const obs = new Date(d);
            obs.setDate(d.getDate() + 1);
            holidays[toStr(obs)] = `${name} (Observed)`;
        } else if (day === 6) {
            // Saturday -> observed Friday
            const obs = new Date(d);
            obs.setDate(d.getDate() - 1);
            holidays[toStr(obs)] = `${name} (Observed)`;
        }
    }

    // 1. New Year's Day (Jan 1)
    addWithObservation(new Date(year, 0, 1), "New Year's Day");

    // 2. Martin Luther King Jr. Day (3rd Monday in Jan)
    let d = new Date(year, 0, 1);
    let count = 0;
    while (d.getMonth() === 0) {
        if (d.getDay() === 1) {
            count++;
            if (count === 3) break;
        }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Martin Luther King Jr. Day';

    // 3. Washington's Birthday / Presidents' Day (3rd Monday in Feb)
    d = new Date(year, 1, 1);
    count = 0;
    while (d.getMonth() === 1) {
        if (d.getDay() === 1) {
            count++;
            if (count === 3) break;
        }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = "Presidents' Day";

    // 4. Memorial Day (Last Monday in May)
    d = new Date(year, 4, 31);
    while (d.getDay() !== 1) {
        d.setDate(d.getDate() - 1);
    }
    holidays[toStr(d)] = 'Memorial Day';

    // 5. Juneteenth National Independence Day (June 19)
    addWithObservation(new Date(year, 5, 19), 'Juneteenth National Independence Day');

    // 6. Independence Day (July 4)
    addWithObservation(new Date(year, 6, 4), 'Independence Day');

    // 7. Labor Day (1st Monday in Sep)
    d = new Date(year, 8, 1);
    while (d.getDay() !== 1) {
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Labor Day';

    // 8. Columbus Day (2nd Monday in Oct)
    d = new Date(year, 9, 1);
    count = 0;
    while (d.getMonth() === 9) {
        if (d.getDay() === 1) {
            count++;
            if (count === 2) break;
        }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Columbus Day';

    // 9. Veterans Day (Nov 11)
    addWithObservation(new Date(year, 10, 11), 'Veterans Day');

    // 10. Thanksgiving Day (4th Thursday in Nov)
    d = new Date(year, 10, 1);
    count = 0;
    while (d.getMonth() === 10) {
        if (d.getDay() === 4) {
            count++;
            if (count === 4) break;
        }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Thanksgiving Day';

    // 11. Christmas Day (Dec 25)
    addWithObservation(new Date(year, 11, 25), 'Christmas Day');

    return holidays;
}

/**
 * Builds the list of valid business days between March 1, 2022 and October 5, 2026.
 * Excludes Saturdays, Sundays, and all US Federal Holidays.
 */
function buildValidBusinessDays() {
    const pad = (n) => String(n).padStart(2, '0');
    const usHolidays = {};
    for (let y = 2022; y <= 2026; y++) {
        Object.assign(usHolidays, getUSFederalHolidays(y));
    }

    const validDays = [];
    const cur = new Date(2022, 2, 1); // March 1, 2022
    const end = new Date(2026, 9, 5);  // October 5, 2026

    while (cur <= end) {
        const dow = cur.getDay(); // 0 = Sun, 6 = Sat
        const dayStr = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;

        // Exclude Saturday, Sunday, and US Federal Holidays
        if (dow !== 0 && dow !== 6 && !usHolidays[dayStr]) {
            validDays.push(dayStr);
        }
        cur.setDate(cur.getDate() + 1);
    }

    return { validDays, usHolidays };
}

/**
 * Sequential Reverse Date Distributor for TGS Publish
 * - Dates start at TODAY (Monday, October 5, 2026) and smoothly decrease back to March 1, 2022.
 * - STRICT BUSINESS DAYS ONLY: Saturdays, Sundays, and US Federal Holidays are completely excluded.
 * - Records are processed sequentially by ID ASC (ID 1, 2, 3...) so the generated SQL
 *   file is strictly ordered by ID and strictly ordered by date descending.
 * - Rich progressive density: 2026 (~34%), 2025 (~22%), 2024 (~17%), 2023 (~15%), 2022 (~12%).
 */
async function processDatabase(dbName, sqlOutputFileName) {
    console.log(`\n============================================================`);
    console.log(`🚀 Processing Database: [${dbName}]`);
    console.log(`============================================================`);

    let conn;
    try {
        conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: dbName
        });
    } catch (e) {
        console.error(`❌ Could not connect to database [${dbName}]:`, e.message);
        return;
    }

    try {
        // Fetch ALL published contents ordered by ID DESC (Preserves original website order)
        const [rows] = await conn.query(`
            SELECT c.id, c.title, COALESCE(ct.slug, 'article') as type_slug, COALESCE(ct.name, 'Article') as type_name
            FROM contents c 
            LEFT JOIN content_types ct ON c.content_type_id = ct.id 
            WHERE c.status = 'published' 
            ORDER BY c.id DESC
        `);

        const total = rows.length;
        if (total === 0) {
            console.log(`No published content found in [${dbName}].`);
            await conn.end();
            return;
        }

        console.log(`Found ${total} published content items in [${dbName}].`);

        const { validDays, usHolidays } = buildValidBusinessDays();
        const numValidDays = validDays.length;
        const pad = (n) => String(n).padStart(2, '0');

        console.log(`Valid business days pool (No weekends, No US Federal Holidays): ${numValidDays} days`);
        console.log(`Earliest business day: ${validDays[0]} | Latest business day: ${validDays[numValidDays - 1]}`);

        // Step 1: Assign valid calendar days using a smooth power curve
        // i = 0 -> latest day (2026-10-05)
        // i = total - 1 -> earliest day (2022-03-01)
        const dates = [];
        for (let i = 0; i < total; i++) {
            const ratio = total > 1 ? i / (total - 1) : 0;
            // Power curve p=1.65 gives natural growth across 2022-2026
            const curve = Math.pow(ratio, 1.65);
            const dayIndex = Math.min(
                numValidDays - 1,
                Math.max(0, Math.round((numValidDays - 1) * (1 - curve)))
            );
            const dayStr = validDays[dayIndex];

            dates.push({
                item: rows[i],
                dayStr
            });
        }

        // Step 2: Assign natural descending business hours
        const naturalHours = [15, 11, 16, 10, 14, 12, 17, 13];
        const updates = [];

        let i = 0;
        while (i < total) {
            let j = i;
            while (j < total && dates[j].dayStr === dates[i].dayStr) {
                j++;
            }
            const count = j - i;
            const day = dates[i].dayStr;

            if (count === 1) {
                const h = naturalHours[i % naturalHours.length];
                const m = (i * 17 + 23) % 60;
                const s = (i * 29 + 11) % 60;
                updates.push({
                    id: dates[i].item.id,
                    title: dates[i].item.title,
                    type: dates[i].item.type_slug,
                    formatted: `${day} ${pad(h)}:${pad(m)}:${pad(s)}`
                });
            } else {
                // Multiple items on same business day: strictly descending timestamps from ~17:45 down to ~09:30
                const startSec = 17 * 3600 + 45 * 60; // 17:45:00
                const endSec = 9 * 3600 + 30 * 60;    // 09:30:00
                const secStep = (startSec - endSec) / count;

                for (let k = 0; k < count; k++) {
                    const jitter = ((i + k) * 13) % Math.max(1, Math.floor(secStep * 0.4));
                    const totalSec = Math.max(endSec, Math.min(startSec, Math.round(startSec - k * secStep - jitter)));
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const s = totalSec % 60;

                    updates.push({
                        id: dates[i + k].item.id,
                        title: dates[i + k].item.title,
                        type: dates[i + k].item.type_slug,
                        formatted: `${day} ${pad(h)}:${pad(m)}:${pad(s)}`
                    });
                }
            }
            i = j;
        }

        // Guarantee strict descending order (updates[k].formatted < updates[k - 1].formatted)
        for (let k = 1; k < updates.length; k++) {
            if (updates[k].formatted >= updates[k - 1].formatted) {
                // If on same day or equal, adjust seconds to be strictly earlier
                const prevDate = new Date(updates[k - 1].formatted.replace(' ', 'T') + '+05:30');
                const currDate = new Date(updates[k].formatted.replace(' ', 'T') + '+05:30');
                if (currDate >= prevDate) {
                    const adjusted = new Date(prevDate.getTime() - 60000); // 1 minute earlier
                    const yr = adjusted.getFullYear();
                    const mo = pad(adjusted.getMonth() + 1);
                    const da = pad(adjusted.getDate());
                    const hh = pad(adjusted.getHours());
                    const mm = pad(adjusted.getMinutes());
                    const ss = pad(adjusted.getSeconds());
                    updates[k].formatted = `${yr}-${mo}-${da} ${hh}:${mm}:${ss}`;
                }
            }
        }

        // Step 3: Strict Validation Check
        console.log(`\n🔍 Performing 100% strict compliance audits...`);
        let weekendViolations = 0;
        let holidayViolations = 0;
        let monotonicityViolations = 0;

        for (let k = 0; k < updates.length; k++) {
            const dateOnly = updates[k].formatted.slice(0, 10);
            const [y, m, d] = dateOnly.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            const dow = dt.getDay();

            if (dow === 0 || dow === 6) {
                weekendViolations++;
                console.error(`❌ Weekend violation: ID ${updates[k].id} has date ${updates[k].formatted} (${dow === 0 ? 'Sunday' : 'Saturday'})`);
            }
            if (usHolidays[dateOnly]) {
                holidayViolations++;
                console.error(`❌ Holiday violation: ID ${updates[k].id} has date ${dateOnly} (${usHolidays[dateOnly]})`);
            }
            if (k > 0 && updates[k].formatted >= updates[k - 1].formatted) {
                monotonicityViolations++;
                console.error(`❌ Monotonicity violation at index ${k}: ${updates[k].formatted} >= ${updates[k - 1].formatted}`);
            }
        }

        if (weekendViolations > 0 || holidayViolations > 0 || monotonicityViolations > 0) {
            throw new Error(`Validation audit failed! Weekends: ${weekendViolations}, Holidays: ${holidayViolations}, Monotonicity: ${monotonicityViolations}`);
        }

        console.log(`✅ Weekend Check: 0 weekend dates (No Saturdays, No Sundays)`);
        console.log(`✅ Holiday Check: 0 US Federal Holiday dates`);
        console.log(`✅ Monotonicity Check: Strictly decreasing reverse chronological order validated`);

        // Step 4: Execute database updates
        console.log(`Applying updates to MySQL database [${dbName}]...`);
        for (const u of updates) {
            await conn.query(
                `UPDATE contents 
                 SET published_date = ?, created_at = ?, scheduled_publish_date = NULL 
                 WHERE id = ?`,
                [u.formatted, u.formatted, u.id]
            );
        }

        // Step 5: Generate clean sequential SQL file
        const sqlLines = [
            '-- =====================================================================',
            `-- Migration: Content Dates Distribution for Database [${dbName}]`,
            '-- Rules: Business Days Only (Excludes all Saturdays, Sundays & US Federal Holidays)',
            '-- Order: Original Content Sequence (ID DESC) & Reverse Chronological by Date',
            '-- Start: October 5, 2026 (Monday / Top of Site) to March 1, 2022',
            `-- Total Records: ${updates.length}`,
            `-- Generated At: ${new Date().toISOString()}`,
            '-- =====================================================================\n',
            'START TRANSACTION;\n'
        ];

        const yearCounts = { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
        const byType = {};

        for (const u of updates) {
            const yr = u.formatted.slice(0, 4);
            yearCounts[yr] = (yearCounts[yr] || 0) + 1;

            if (!byType[u.type]) byType[u.type] = { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
            byType[u.type][yr]++;

            const safeTitle = (u.title || '').replace(/'/g, "\\'").slice(0, 50);
            sqlLines.push(`-- ID: ${u.id} | [${u.type}] | ${safeTitle}`);
            sqlLines.push(`UPDATE contents SET published_date = '${u.formatted}', created_at = '${u.formatted}', scheduled_publish_date = NULL WHERE id = ${u.id};\n`);
        }

        sqlLines.push('COMMIT;\n');

        const sqlFilePath = path.join(__dirname, '../database', sqlOutputFileName);
        fs.writeFileSync(sqlFilePath, sqlLines.join('\n'), 'utf8');
        console.log(`📄 Saved clean sequential SQL file to: ${sqlFilePath}`);

        console.log(`\n📊 Breakdown by Year in [${dbName}]:`);
        console.table(
            Object.entries(yearCounts).map(([yr, count]) => ({
                Year: yr,
                'Articles Count': count,
                'Percentage': `${((count / total) * 100).toFixed(1)}%`
            }))
        );

        console.log(`\n📊 Breakdown by Content Type across Years in [${dbName}]:`);
        console.table(byType);

        console.log(`\n📌 Sample Preview:`);
        console.log(`- Top / Record 1 (ID ${updates[0].id}): ${updates[0].formatted} — "${updates[0].title.slice(0, 40)}"`);
        console.log(`- Record 2       (ID ${updates[1].id}): ${updates[1].formatted} — "${updates[1].title.slice(0, 40)}"`);
        console.log(`- Record 3       (ID ${updates[2].id}): ${updates[2].formatted} — "${updates[2].title.slice(0, 40)}"`);
        const midIdx = Math.floor(total / 2);
        console.log(`- Mid            (ID ${updates[midIdx].id}): ${updates[midIdx].formatted} — "${updates[midIdx].title.slice(0, 40)}"`);
        const lastIdx = total - 1;
        console.log(`- Last           (ID ${updates[lastIdx].id}): ${updates[lastIdx].formatted} — "${updates[lastIdx].title.slice(0, 40)}"`);

        await conn.end();
    } catch (err) {
        console.error(`❌ Error in [${dbName}]:`, err);
        if (conn) await conn.end();
        throw err;
    }
}

async function main() {
    try {
        // Process tgstechinfo (full 832 items)
        await processDatabase('tgstechinfo', 'update_tgstechinfo_dates_2022_2026.sql');
        // Process publishing_platform (287 items)
        await processDatabase('publishing_platform', 'update_historical_dates_2022_2026.sql');
        console.log('\n🎉 ALL DATABASES SUCCESSFULLY UPDATED WITH BUSINESS-DAYS-ONLY DATES!');
        process.exit(0);
    } catch (e) {
        console.error('Fatal error during execution:', e);
        process.exit(1);
    }
}

main();
