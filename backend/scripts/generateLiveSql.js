const fs = require('fs');
const readline = require('readline');
const path = require('path');

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

    addWithObservation(new Date(year, 5, 19), 'Juneteenth');
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

const CATEGORY_NAMES = {
    1: 'Technology',
    2: 'Artificial Intelligence',
    3: 'Generative AI',
    4: 'Machine Learning',
    5: 'Cybersecurity',
    6: 'Cloud Computing',
    7: 'Data Analytics',
    8: 'Data Science',
    9: 'Software Development',
    10: 'IT Infrastructure',
    11: 'DevOps',
    12: 'Networking',
    13: 'Automation',
    14: 'Healthcare',
    15: 'Finance',
    16: 'HR Tech',
    17: 'MarTech',
    18: 'EdTech',
    19: 'FinTech',
    21: 'Warehouse Management'
};

async function generateLiveSql() {
    console.log(`\n============================================================`);
    console.log(`  TGS PUBLISH - Live Database Category Date Re-balancing`);
    console.log(`  Target: All 881 items from contents.sql dump`);
    console.log(`  Timeline: Oct 6, 2026 down to March 1, 2022`);
    console.log(`  Timezone Distribution: Full 24 Hours (00:00:00 - 23:59:59)`);
    console.log(`============================================================\n`);

    const validDays = buildValidBusinessDays();
    const numValidDays = validDays.length;
    console.log(`Total valid business days pool: ${numValidDays} days (${validDays[0]} to ${validDays[numValidDays - 1]})`);

    // Parse live_contents.sql
    const dumpPath = path.resolve(__dirname, '../database/live_contents.sql');
    const rl = readline.createInterface({
        input: fs.createReadStream(dumpPath),
        crlfDelay: Infinity
    });

    const items = [];
    for await (const line of rl) {
        const trimmed = line.trim();
        const m = trimmed.match(/^\((\d+),\s*([0-9NULL]+),\s*([0-9NULL]+),\s*([0-9NULL]+),\s*'((?:[^'\\]|\\.)*)'/);
        if (m) {
            const id = parseInt(m[1], 10);
            const categoryId = m[4] === 'NULL' ? null : parseInt(m[4], 10);
            const title = m[5].replace(/\\'/g, "'").substring(0, 70);
            items.push({ id, categoryId, title });
        }
    }

    console.log(`Parsed ${items.length} records from live dump.`);

    // Group items by categoryId
    const catGroups = {};
    items.forEach(item => {
        const cKey = item.categoryId !== null ? item.categoryId : 0;
        if (!catGroups[cKey]) catGroups[cKey] = [];
        catGroups[cKey].push(item);
    });

    // Within each category, sort items strictly by id DESC (newest items first)
    Object.keys(catGroups).forEach(cKey => {
        catGroups[cKey].sort((a, b) => b.id - a.id);
    });

    // Sort categories by count DESC
    const sortedCatKeys = Object.keys(catGroups).sort((a, b) => catGroups[b].length - catGroups[a].length);

    const plannedUpdates = [];
    const usedDateTimes = new Set();

    sortedCatKeys.forEach((cKey, catIdx) => {
        const catItems = catGroups[cKey];
        const count = catItems.length;
        const catName = CATEGORY_NAMES[cKey] || `Category ${cKey}`;
        const catOffset = (catIdx * 7) % 15;

        let prevAssignedDayIndex = numValidDays;

        catItems.forEach((item, itemIdx) => {
            let targetDayIndex;

            if (count === 1) {
                targetDayIndex = numValidDays - 1 - (catOffset % 8);
            } else if (count === 2) {
                targetDayIndex = itemIdx === 0
                    ? numValidDays - 1 - (catOffset % 8)
                    : Math.round(numValidDays * 0.70);
            } else if (count === 3) {
                const ratios = [0.98, 0.65, 0.35];
                targetDayIndex = Math.round((numValidDays - 1) * ratios[itemIdx]);
            } else {
                // Linear to gentle curve so items span 2026 down to 2022
                const linearRatio = itemIdx / (count - 1);
                const curvedRatio = Math.pow(linearRatio, 1.20);

                const minDayLimit = count < 6 ? Math.round(numValidDays * 0.25) : 0;
                const availableRange = (numValidDays - 1 - catOffset) - minDayLimit;

                targetDayIndex = Math.round((numValidDays - 1 - catOffset) - (curvedRatio * availableRange));
            }

            // Strictly descending day index within the category
            if (targetDayIndex >= prevAssignedDayIndex) {
                targetDayIndex = prevAssignedDayIndex - 1;
            }
            targetDayIndex = Math.max(0, Math.min(numValidDays - 1, targetDayIndex));
            prevAssignedDayIndex = targetDayIndex;

            let assignedDateStr = validDays[targetDayIndex];
            let assignedTime = get24HourTime(item.id + catIdx);
            let fullDateTime = `${assignedDateStr} ${assignedTime}`;

            // Deduplicate across the entire 881 dataset
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
                categoryId: cKey,
                categoryName: catName,
                newDate: fullDateTime,
                year: parseInt(assignedDateStr.substring(0, 4), 10)
            });
        });
    });

    // Summary Statistics by Category
    console.log(`---------------------------------------------------------------------------------------------------------`);
    console.log(`LIVE DATABASE (881 ITEMS) CATEGORY DISTRIBUTION SUMMARY:`);
    console.log(`---------------------------------------------------------------------------------------------------------`);
    console.log(`Category Name             | Total | 2026 | 2025 | 2024 | 2023 | 2022 | Min Date   | Max Date`);
    console.log(`---------------------------------------------------------------------------------------------------------`);

    const categoryReport = {};
    plannedUpdates.forEach(u => {
        if (!categoryReport[u.categoryName]) categoryReport[u.categoryName] = [];
        categoryReport[u.categoryName].push(u);
    });

    Object.keys(categoryReport).sort().forEach(cName => {
        const cItems = categoryReport[cName];
        const y26 = cItems.filter(x => x.year === 2026).length;
        const y25 = cItems.filter(x => x.year === 2025).length;
        const y24 = cItems.filter(x => x.year === 2024).length;
        const y23 = cItems.filter(x => x.year === 2023).length;
        const y22 = cItems.filter(x => x.year === 2022).length;
        const dates = cItems.map(x => x.newDate.substring(0, 10)).sort();
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];

        const nameCol = cName.padEnd(25);
        const totCol = String(cItems.length).padStart(5);
        console.log(`${nameCol} | ${totCol} | ${String(y26).padStart(4)} | ${String(y25).padStart(4)} | ${String(y24).padStart(4)} | ${String(y23).padStart(4)} | ${String(y22).padStart(4)} | ${minDate} | ${maxDate}`);
    });

    const total26 = plannedUpdates.filter(x => x.year === 2026).length;
    const total25 = plannedUpdates.filter(x => x.year === 2025).length;
    const total24 = plannedUpdates.filter(x => x.year === 2024).length;
    const total23 = plannedUpdates.filter(x => x.year === 2023).length;
    const total22 = plannedUpdates.filter(x => x.year === 2022).length;

    console.log(`---------------------------------------------------------------------------------------------------------`);
    console.log(`OVERALL LIVE TOTALS (881 ITEMS):`);
    console.log(`2026: ${total26} | 2025: ${total25} | 2024: ${total24} | 2023: ${total23} | 2022: ${total22} | Total: ${plannedUpdates.length}`);
    console.log(`---------------------------------------------------------------------------------------------------------\n`);

    // Generate SQL file sorted by ID ASC for clean, predictable execution
    plannedUpdates.sort((a, b) => a.id - b.id);

    const sqlFilePath = path.resolve(__dirname, '../database/rebalance_category_dates.sql');
    let sqlContent = `-- =====================================================================\n`;
    sqlContent += `-- TGS Publish - Live Database Category Date Re-balancing Migration\n`;
    sqlContent += `-- Target Records: 881 contents (from live contents.sql dump)\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Timeline: October 6, 2026 to March 1, 2022 (Reverse Chronological)\n`;
    sqlContent += `-- Rules: Business Days Only (Mon-Fri, US Holidays Excluded)\n`;
    sqlContent += `-- Timezone: Full 24 Hours (00:00:00 to 23:59:59)\n`;
    sqlContent += `-- Sequence: Strictly continuous per-category (Zero 2-year gaps)\n`;
    sqlContent += `-- =====================================================================\n\n`;
    sqlContent += `START TRANSACTION;\n\n`;

    plannedUpdates.forEach(u => {
        const cleanTitle = (u.title || '').replace(/'/g, "\\'").substring(0, 60);
        sqlContent += `-- ID: ${u.id} | [${u.categoryName}] | ${cleanTitle}\n`;
        sqlContent += `UPDATE contents SET published_date = '${u.newDate}', created_at = '${u.newDate}', scheduled_publish_date = NULL WHERE id = ${u.id};\n\n`;
    });

    sqlContent += `COMMIT;\n`;

    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    console.log(`✅ SQL file generated successfully at:\n   ${sqlFilePath}`);

    // Also copy to Downloads folder for convenient access by user
    const downloadsCopyPath = 'C:\\Users\\TGS34\\Downloads\\rebalance_category_dates.sql';
    try {
        fs.writeFileSync(downloadsCopyPath, sqlContent, 'utf8');
        console.log(`✅ Also copied to Downloads folder for 1-click access:\n   ${downloadsCopyPath}\n`);
    } catch (e) {
        console.log(`Notice: Could not write directly to Downloads: ${e.message}`);
    }
}

generateLiveSql().catch(console.error);
