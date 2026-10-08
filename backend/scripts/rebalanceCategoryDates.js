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

    // 3. Presidents' Day (3rd Monday in Feb)
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

    // 5. Juneteenth (June 19)
    addWithObservation(new Date(year, 5, 19), 'Juneteenth');

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
 * Builds valid business days between March 1, 2022 and October 6, 2026.
 * Excludes weekends and US Federal Holidays.
 */
function buildValidBusinessDays() {
    const pad = (n) => String(n).padStart(2, '0');
    const usHolidays = {};
    for (let y = 2022; y <= 2026; y++) {
        Object.assign(usHolidays, getUSFederalHolidays(y));
    }

    const validDays = [];
    const cur = new Date(2022, 2, 1); // March 1, 2022
    const end = new Date(2026, 9, 6);  // October 6, 2026

    while (cur <= end) {
        const dow = cur.getDay(); // 0 = Sun, 6 = Sat
        const dayStr = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;

        if (dow !== 0 && dow !== 6 && !usHolidays[dayStr]) {
            validDays.push(dayStr);
        }
        cur.setDate(cur.getDate() + 1);
    }

    return validDays;
}

/**
 * Generates formatted publishing time across full 24 hours (00:00:00 to 23:59:59).
 */
function get24HourTime(seedIndex) {
    const pad = (n) => String(n).padStart(2, '0');
    const totalMinutes = (seedIndex * 73 + 17) % (24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = (seedIndex * 37 + 11) % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

async function rebalanceDates() {
    const isApply = process.argv.includes('--apply');
    console.log(`\n============================================================`);
    console.log(`  TGS PUBLISH - Category Date Re-balancing Tool`);
    console.log(`  Mode: ${isApply ? '🚀 APPLY TO DATABASE' : '🔍 DRY-RUN PREVIEW (use --apply to commit)'}`);
    console.log(`============================================================\n`);

    const validDays = buildValidBusinessDays();
    const numValidDays = validDays.length;
    console.log(`Total valid business days pool: ${numValidDays} days (${validDays[0]} to ${validDays[numValidDays - 1]})`);

    // Fetch all published contents
    const [rows] = await pool.query(`
        SELECT c.id, c.title, c.category_id, cat.name as category_name,
               c.content_type_id, ct.slug as content_type_slug, c.published_date
        FROM contents c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN content_types ct ON c.content_type_id = ct.id
        WHERE c.status = 'published'
        ORDER BY c.id DESC
    `);

    console.log(`Total published records found: ${rows.length}\n`);

    // Group contents by category
    const categoryGroups = {};
    rows.forEach(item => {
        const catKey = item.category_name || 'Uncategorized';
        if (!categoryGroups[catKey]) {
            categoryGroups[catKey] = {
                categoryId: item.category_id,
                name: catKey,
                items: []
            };
        }
        categoryGroups[catKey].items.push(item);
    });

    const categoriesList = Object.values(categoryGroups);
    // Sort categories by number of items descending
    categoriesList.sort((a, b) => b.items.length - a.items.length);

    const plannedUpdates = [];
    const usedDateTimes = new Set();

    // Distribute dates for each category
    categoriesList.forEach((group, catIdx) => {
        const count = group.items.length;
        // group.items is already ordered by c.id DESC
        const catOffset = (catIdx * 7) % 15; // small stagger across categories

        let prevAssignedDayIndex = numValidDays;

        group.items.forEach((item, itemIdx) => {
            let targetDayIndex;

            if (count === 1) {
                // 1 item: assign recent 2026 date
                targetDayIndex = numValidDays - 1 - (catOffset % 8);
            } else if (count === 2) {
                targetDayIndex = itemIdx === 0
                    ? numValidDays - 1 - (catOffset % 8)
                    : Math.round(numValidDays * 0.70); // late 2025
            } else if (count === 3) {
                const ratios = [0.98, 0.65, 0.35];
                targetDayIndex = Math.round((numValidDays - 1) * ratios[itemIdx]);
            } else {
                // Smooth distribution from recent (2026) to early (2022)
                const linearRatio = itemIdx / (count - 1); // 0 (newest) to 1 (oldest)
                const curvedRatio = Math.pow(linearRatio, 1.25); // natural growth
                
                // For small categories (< 6 items), don't push all the way to early 2022
                const minDayLimit = count < 6 ? Math.round(numValidDays * 0.25) : 0;
                const availableRange = (numValidDays - 1 - catOffset) - minDayLimit;
                
                targetDayIndex = Math.round((numValidDays - 1 - catOffset) - (curvedRatio * availableRange));
            }

            // Guarantee strictly descending day index within the category
            if (targetDayIndex >= prevAssignedDayIndex) {
                targetDayIndex = prevAssignedDayIndex - 1;
            }
            targetDayIndex = Math.max(0, Math.min(numValidDays - 1, targetDayIndex));
            prevAssignedDayIndex = targetDayIndex;

            let assignedDateStr = validDays[targetDayIndex];
            let assignedTime = get24HourTime(item.id + catIdx);
            let fullDateTime = `${assignedDateStr} ${assignedTime}`;

            // Deduplicate exact timestamps across categories
            let counter = 1;
            while (usedDateTimes.has(fullDateTime)) {
                const adjustedTime = get24HourTime(item.id + catIdx + counter);
                fullDateTime = `${assignedDateStr} ${adjustedTime}`;
                counter++;
            }
            usedDateTimes.add(fullDateTime);

            plannedUpdates.push({
                id: item.id,
                title: item.title,
                category: group.name,
                contentType: item.content_type_slug || 'other',
                oldDate: item.published_date,
                newDate: fullDateTime,
                year: parseInt(assignedDateStr.substring(0, 4), 10)
            });
        });
    });

    // Verify per-category ordering: group for reporting
    const categoryCheck = {};
    plannedUpdates.forEach(u => {
        if (!categoryCheck[u.category]) categoryCheck[u.category] = [];
        categoryCheck[u.category].push(u);
    });

    // Summary Statistics by Category
    console.log(`---------------------------------------------------------------------------------------------------------`);
    console.log(`CATEGORY DISTRIBUTION SUMMARY (No more 2-year gaps!):`);
    console.log(`---------------------------------------------------------------------------------------------------------`);
    console.log(`Category Name             | Total | 2026 | 2025 | 2024 | 2023 | 2022 | Min Date   | Max Date`);
    console.log(`---------------------------------------------------------------------------------------------------------`);

    Object.keys(categoryCheck).sort().forEach(catName => {
        const items = categoryCheck[catName];
        const y26 = items.filter(x => x.year === 2026).length;
        const y25 = items.filter(x => x.year === 2025).length;
        const y24 = items.filter(x => x.year === 2024).length;
        const y23 = items.filter(x => x.year === 2023).length;
        const y22 = items.filter(x => x.year === 2022).length;
        const dates = items.map(x => x.newDate.substring(0, 10)).sort();
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];

        const nameCol = catName.padEnd(25);
        const totCol = String(items.length).padStart(5);
        console.log(`${nameCol} | ${totCol} | ${String(y26).padStart(4)} | ${String(y25).padStart(4)} | ${String(y24).padStart(4)} | ${String(y23).padStart(4)} | ${String(y22).padStart(4)} | ${minDate} | ${maxDate}`);
    });

    // Global Year Summary
    const total2026 = plannedUpdates.filter(x => x.year === 2026).length;
    const total2025 = plannedUpdates.filter(x => x.year === 2025).length;
    const total2024 = plannedUpdates.filter(x => x.year === 2024).length;
    const total2023 = plannedUpdates.filter(x => x.year === 2023).length;
    const total2022 = plannedUpdates.filter(x => x.year === 2022).length;

    console.log(`---------------------------------------------------------------------------------------------------------`);
    console.log(`OVERALL GLOBAL TOTALS:`);
    console.log(`2026: ${total2026} | 2025: ${total2025} | 2024: ${total2024} | 2023: ${total2023} | 2022: ${total2022} | Total: ${plannedUpdates.length}`);
    console.log(`---------------------------------------------------------------------------------------------------------\n`);

    // Generate Standalone SQL File for Easy 1-Click Live Import
    const sqlFilePath = path.resolve(__dirname, '../database/rebalance_category_dates.sql');
    let sqlContent = `-- =====================================================================\n`;
    sqlContent += `-- TGS Publish - Category Date Re-balancing Migration\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Smooth Business-Day Distribution from Oct 2026 to March 2022\n`;
    sqlContent += `-- Ensures consistent, continuous timeline within each category\n`;
    sqlContent += `-- =====================================================================\n\n`;
    sqlContent += `START TRANSACTION;\n\n`;

    plannedUpdates.forEach(u => {
        const cleanTitle = (u.title || '').replace(/'/g, "\\'").substring(0, 60);
        sqlContent += `-- ID: ${u.id} | [${u.category}] | ${cleanTitle}\n`;
        sqlContent += `UPDATE contents SET published_date = '${u.newDate}', created_at = '${u.newDate}', scheduled_publish_date = NULL WHERE id = ${u.id};\n\n`;
    });

    sqlContent += `COMMIT;\n`;
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    console.log(`✅ Standalone SQL file generated at:\n   ${sqlFilePath}\n   (Ready to import into live phpMyAdmin or run via CLI)\n`);

    // If --apply flag was passed, update local database now
    if (isApply) {
        console.log(`🔄 Applying updates to local database in a transaction...`);
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            for (const u of plannedUpdates) {
                await conn.query(`
                    UPDATE contents 
                    SET published_date = ?, created_at = ?, scheduled_publish_date = NULL 
                    WHERE id = ?
                `, [u.newDate, u.newDate, u.id]);
            }
            await conn.commit();
            console.log(`🎉 SUCCESS: ${plannedUpdates.length} records successfully updated in local database!`);
        } catch (err) {
            await conn.rollback();
            console.error(`❌ ERROR: Transaction rolled back:`, err.message);
        } finally {
            conn.release();
        }
    } else {
        console.log(`ℹ️ To apply these changes to the local database, run:`);
        console.log(`   node scripts/rebalanceCategoryDates.js --apply\n`);
    }

    process.exit(0);
}

rebalanceDates().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
