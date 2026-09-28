const { execSync } = require('child_process');

const commits = ['10e06c2', '3394685', 'f422d75', 'c8c5e23', 'a927d34', 'c7e6fa1', 'c858db8', 'acffcd3', '7e1bcd2', '1ecf402'];

for (const c of commits) {
  try {
    const file = execSync(`git show ${c}:frontend/src/components/public/Home.jsx`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const match = file.match(/const HERO_SLIDES = \[([\s\S]*?)\];/);
    if (match) {
      console.log(`=== Commit ${c} ===`);
      console.log(match[0]);
    } else {
      console.log(`=== Commit ${c} === No HERO_SLIDES found!`);
      // Check what was in hero section in this commit
      const heroMatch = file.match(/HeroSection[\s\S]{0,500}/);
      if (heroMatch) {
        console.log('HeroSection snippet:', heroMatch[0].slice(0, 200));
      }
    }
  } catch (err) {
    console.log(`Error on commit ${c}:`, err.message);
  }
}
