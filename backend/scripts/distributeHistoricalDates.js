const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

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
        if (d.getDay() === 1) {
            count++;
            if (count === 3) break;
        }
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Martin Luther King Jr. Day';

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

    d = new Date(year, 4, 31);
    while (d.getDay() !== 1) {
        d.setDate(d.getDate() - 1);
    }
    holidays[toStr(d)] = 'Memorial Day';

    addWithObservation(new Date(year, 5, 19), 'Juneteenth National Independence Day');
    addWithObservation(new Date(year, 6, 4), 'Independence Day');

    d = new Date(year, 8, 1);
    while (d.getDay() !== 1) {
        d.setDate(d.getDate() + 1);
    }
    holidays[toStr(d)] = 'Labor Day';

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

    addWithObservation(new Date(year, 10, 11), 'Veterans Day');

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

    addWithObservation(new Date(year, 11, 25), 'Christmas Day');

    return holidays;
}

function buildValidBusinessDays() {
    const pad = (n) => String(n).padStart(2, '0');
    const usHolidays = {};
    for (let y = 2022; y <= 2026; y++) {
        Object.assign(usHolidays, getUSFederalHolidays(y));
    }

    const validDays = [];
    const cur = new Date(2022, 2, 1);
    const end = new Date(2026, 9, 5);

    while (cur <= end) {
        const dow = cur.getDay();
        const dayStr = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;

        if (dow !== 0 && dow !== 6 && !usHolidays[dayStr]) {
            validDays.push(dayStr);
        }
        cur.setDate(cur.getDate() + 1);
    }

    return { validDays, usHolidays };
}

/**
 * Distributes content publication dates across a growth timeline:
 * - Start: March 1, 2022 (company inception)
 * - End: October 5, 2026 (today)
 * - Excludes all Saturdays, Sundays, and US Federal Holidays.
 * - Strict Monotonicity: ID 1 starts at 2026-10-05 and every subsequent ID is STRICTLY earlier than the previous one.
 */
async function distributeHistoricalDates() {
    try {
        console.log('🚀 Starting content date distribution (March 2022 to October 2026 - Business Days Only)...');

        const [rows] = await pool.query(`
            SELECT id, title, status, published_date, created_at 
            FROM contents 
            WHERE status = 'published' 
            ORDER BY id DESC
        `);

        const total = rows.length;
        if (total === 0) {
            console.log('No published content found.');
            process.exit(0);
        }

        console.log(`Found ${total} published content items to distribute.`);

        const { validDays, usHolidays } = buildValidBusinessDays();
        const numValidDays = validDays.length;
        const pad = (n) => String(n).padStart(2, '0');

        console.log(`Pool of valid business days: ${numValidDays}`);

        // Step 1: Calculate curve target calendar day for each record
        const items = [];
        for (let i = 0; i < total; i++) {
            const item = rows[i];
            const ratio = total > 1 ? i / (total - 1) : 0;
            const curve = Math.pow(ratio, 1.65);
            const dayIndex = Math.min(
                numValidDays - 1,
                Math.max(0, Math.round((numValidDays - 1) * (1 - curve)))
            );
            const day = validDays[dayIndex];

            items.push({
                id: item.id,
                title: item.title,
                day
            });
        }

        // Step 2: Assign strictly decreasing timestamps within each calendar day
        const naturalHours = [15, 11, 16, 10, 14, 12, 17, 13];
        let idx = 0;
        while (idx < total) {
            let nextIdx = idx;
            while (nextIdx < total && items[nextIdx].day === items[idx].day) {
                nextIdx++;
            }
            const count = nextIdx - idx;

            if (count === 1) {
                const h = naturalHours[idx % naturalHours.length];
                const m = (idx * 17 + 23) % 60;
                const s = (idx * 29 + 11) % 60;
                items[idx].formatted = `${items[idx].day} ${pad(h)}:${pad(m)}:${pad(s)}`;
            } else {
                const startSec = 17 * 3600 + 45 * 60;
                const endSec = 9 * 3600 + 30 * 60;
                const secStep = (startSec - endSec) / count;

                for (let k = 0; k < count; k++) {
                    const jitter = ((idx + k) * 13) % Math.max(1, Math.floor(secStep * 0.4));
                    const totalSec = Math.max(endSec, Math.min(startSec, Math.round(startSec - k * secStep - jitter)));
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const s = totalSec % 60;
                    items[idx + k].formatted = `${items[idx].day} ${pad(h)}:${pad(m)}:${pad(s)}`;
                }
            }
            idx = nextIdx;
        }

        // Guarantee strict descending monotonicity
        for (let i = 1; i < total; i++) {
            if (items[i].formatted >= items[i - 1].formatted) {
                const prev = new Date(items[i - 1].formatted.replace(' ', 'T') + '+05:30');
                const adjusted = new Date(prev.getTime() - 60000);
                const yr = adjusted.getFullYear();
                const mo = pad(adjusted.getMonth() + 1);
                const da = pad(adjusted.getDate());
                const hh = pad(adjusted.getHours());
                const mm = pad(adjusted.getMinutes());
                const ss = pad(adjusted.getSeconds());
                items[i].formatted = `${yr}-${mo}-${da} ${hh}:${mm}:${ss}`;
            }
        }

        // Step 3: Validate strict monotonicity, weekends, and holidays
        let isStrictlyMonotonic = true;
        let weekendsFound = 0;
        let holidaysFound = 0;

        for (let i = 0; i < total; i++) {
            const dateStr = items[i].formatted.slice(0, 10);
            const [y, m, d] = dateStr.split('-').map(Number);
            const dow = new Date(y, m - 1, d).getDay();

            if (dow === 0 || dow === 6) weekendsFound++;
            if (usHolidays[dateStr]) holidaysFound++;

            if (i > 0 && items[i].formatted >= items[i - 1].formatted) {
                isStrictlyMonotonic = false;
                console.error(`❌ Monotonicity violation at index ${i}: ${items[i].formatted} >= ${items[i - 1].formatted}`);
            }
        }

        if (!isStrictlyMonotonic || weekendsFound > 0 || holidaysFound > 0) {
            throw new Error(`Validation failed! Weekends: ${weekendsFound}, Holidays: ${holidaysFound}, Monotonic: ${isStrictlyMonotonic}`);
        }
        console.log('✅ Validation: 0 weekends, 0 US Federal Holidays, strictly reverse monotonic.');

        // Step 4: Execute database updates
        for (const u of items) {
            await pool.query(
                `UPDATE contents 
                 SET published_date = ?, created_at = ?, scheduled_publish_date = NULL 
                 WHERE id = ?`,
                [u.formatted, u.formatted, u.id]
            );
        }

        // Step 5: Generate update_historical_dates_2022_2026.sql
        const sqlLines = [
            '-- =====================================================================',
            '-- Migration: Content Dates Distribution (March 2022 to October 2026)',
            '-- Rules: Business Days Only (Excludes all Saturdays, Sundays & US Federal Holidays)',
            '-- Company: TGS Tech Info',
            '-- Order: Strictly Monotonically Decreasing (Reverse Chronological)',
            `-- Total Records: ${total}`,
            `-- Generated At: ${new Date().toISOString()}`,
            '-- =====================================================================\n',
            'START TRANSACTION;\n'
        ];

        const yearCounts = { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };

        for (const u of items) {
            const yr = u.formatted.slice(0, 4);
            yearCounts[yr] = (yearCounts[yr] || 0) + 1;

            const safeTitle = (u.title || '').replace(/'/g, "\\'").slice(0, 50);
            sqlLines.push(`-- ID: ${u.id} | ${safeTitle}`);
            sqlLines.push(`UPDATE contents SET published_date = '${u.formatted}', created_at = '${u.formatted}', scheduled_publish_date = NULL WHERE id = ${u.id};\n`);
        }

        sqlLines.push('COMMIT;\n');

        const sqlFilePath = path.join(__dirname, '../database/update_historical_dates_2022_2026.sql');
        fs.writeFileSync(sqlFilePath, sqlLines.join('\n'), 'utf8');
        console.log(`📄 Saved clean SQL file to ${sqlFilePath}`);

        console.log('\n✅ Successfully updated published_date and created_at for all items!');
        console.log('\n📊 Content Distribution Breakdown by Year:');
        console.table(
            Object.entries(yearCounts).map(([yr, count]) => ({
                Year: yr,
                'Articles Count': count,
                'Percentage': `${((count / total) * 100).toFixed(1)}%`
            }))
        );

        console.log('\n📌 Samples:');
        console.log(`- First Article (ID ${items[0].id}): ${items[0].formatted} — "${items[0].title.slice(0, 40)}"`);
        console.log(`- Second Article (ID ${items[1].id}): ${items[1].formatted} — "${items[1].title.slice(0, 40)}"`);
        console.log(`- Third Article (ID ${items[2].id}): ${items[2].formatted} — "${items[2].title.slice(0, 40)}"`);
        const midIdx = Math.floor(total / 2);
        console.log(`- Mid Article (ID ${items[midIdx].id}): ${items[midIdx].formatted} — "${items[midIdx].title.slice(0, 40)}"`);
        const lastIdx = total - 1;
        console.log(`- Last Article (ID ${items[lastIdx].id}): ${items[lastIdx].formatted} — "${items[lastIdx].title.slice(0, 40)}"`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error distributing dates:', err);
        process.exit(1);
    }
}

distributeHistoricalDates();
