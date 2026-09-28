const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/config/auth');

// Country-wise user distribution
const countryDistribution = [
    { country: 'India', count: 40 },
    { country: 'Australia', count: 76 },
    { country: 'United States', count: 74 },
    { country: 'Germany', count: 65 },
    { country: 'Japan', count: 64 },
    { country: 'Canada', count: 61 },
    { country: 'United Kingdom', count: 60 },
    { country: 'France', count: 58 }
];

// Country-specific data
const countryData = {
    'India': {
        firstNames: ['Arjun', 'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Rohan', 'Saanvi', 'Ananya', 'Diya', 'Kavya', 'Aarohi', 'Advik', 'Kabir', 'Veer', 'Kiaan', 'Saanvi', 'Ananya', 'Diya', 'Kavya', 'Aarohi', 'Advik', 'Kabir', 'Veer', 'Kiaan', 'Riya', 'Ishaan', 'Aryan', 'Siddharth', 'Ishita', 'Aditi', 'Rahul', 'Priya', 'Amit', 'Neha', 'Raj', 'Pooja', 'Suresh', 'Anita', 'Vikram', 'Meera', 'Gaurav'],
        lastNames: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Malhotra', 'Rao', 'Nair', 'Reddy', 'Chopra', 'Das', 'Iyer', 'Pillai', 'Menon', 'Saxena', 'Tiwari', 'Shukla', 'Dubey', 'Mishra', 'Pandey', 'Yadav', 'Jain', 'Agarwal', 'Kaur', 'Bhatia', 'Khanna', 'Kapoor', 'Shah', 'Mehta'],
        jobTitles: ['Software Engineer', 'Data Analyst', 'Project Manager', 'Business Analyst', 'Marketing Manager', 'Sales Executive', 'HR Manager', 'Financial Analyst', 'Operations Manager', 'Quality Assurance', 'DevOps Engineer', 'Product Manager', 'UX Designer', 'Web Developer', 'Mobile Developer', 'Cloud Architect', 'Security Analyst', 'Network Engineer', 'Database Administrator', 'System Administrator'],
        companies: ['Tata Consultancy Services', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'Larsen & Toubro Infotech', 'Mindtree', 'Mphasis', 'Hexaware', 'Zensar Technologies', 'Cyient', 'L&T Technology Services', 'Birlasoft', 'NIIT Technologies', 'RapidValue Solutions', 'ValueLabs', 'Quest Global', 'Altran', 'Atos Syntel', 'Cognizant India']
    },
    'Australia': {
        firstNames: ['Liam', 'Oliver', 'Noah', 'William', 'Jack', 'Lucas', 'James', 'Thomas', 'Henry', 'Mason', 'Charlotte', 'Olivia', 'Amelia', 'Isla', 'Mia', 'Sophia', 'Ava', 'Ruby', 'Evelyn', 'Grace', 'Harper', 'Lily', 'Emily', 'Zoe', 'Chloe', 'Ivy', 'Millie', 'Hannah', 'Ella', 'Evie', 'Sienna', 'Penelope', 'Chloe', 'Abigail', 'Emily', 'Evelyn', 'Grace', 'Harper', 'Lily', 'Mia'],
        lastNames: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker'],
        jobTitles: ['Software Developer', 'Business Analyst', 'Project Manager', 'Marketing Specialist', 'Sales Consultant', 'HR Coordinator', 'Financial Advisor', 'Operations Manager', 'Quality Assurance', 'DevOps Engineer', 'Product Owner', 'UX Designer', 'Web Developer', 'Mobile Developer', 'Cloud Architect', 'Security Engineer', 'Network Administrator', 'Database Manager', 'System Administrator', 'Technical Lead'],
        companies: ['Atlassian', 'Canva', 'Xero', 'Afterpay', 'REA Group', 'Carsales', 'WiseTech Global', 'TechnologyOne', 'Altium', 'Seek', 'Aconex', 'REA Group', 'Carsales', 'Telstra', 'Optus', 'Vodafone', 'NAB', 'CBA', 'Westpac', 'ANZ']
    },
    'United States': {
        firstNames: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'],
        jobTitles: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Business Analyst', 'Marketing Director', 'Sales Manager', 'HR Director', 'Financial Analyst', 'Operations Director', 'QA Engineer', 'DevOps Engineer', 'Product Owner', 'UX Designer', 'Full Stack Developer', 'iOS Developer', 'Cloud Architect', 'Security Engineer', 'Network Engineer', 'DBA', 'System Admin'],
        companies: ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Twitter', 'LinkedIn', 'Salesforce', 'Adobe', 'IBM', 'Oracle', 'SAP', 'Intel', 'NVIDIA', 'AMD', 'Cisco', 'VMware', 'Red Hat', 'Canonical']
    },
    'Germany': {
        firstNames: ['Lukas', 'Leon', 'Finn', 'Jonas', 'Felix', 'Paul', 'Max', 'Elias', 'Noah', 'Ben', 'Mia', 'Emma', 'Hannah', 'Sofia', 'Anna', 'Lea', 'Lina', 'Marie', 'Lena', 'Mila', 'Clara', 'Elisa', 'Lara', 'Laura', 'Nina', 'Emilia', 'Aurelia', 'Mina', 'Lotta', 'Mathilda', 'Paula', 'Amelie', 'Leni', 'Maya', 'Romy', 'Lilly', 'Ella', 'Nora', 'Juna'],
        lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Zimmermann', 'Krüger', 'Lange', 'Schmid', 'Weidmann', 'Funk', 'Lehmann', 'Martin', 'Jung', 'Köhler', 'Vogel', 'Beck'],
        jobTitles: ['Softwareentwickler', 'Datenanalyst', 'Projektleiter', 'Business Analyst', 'Marketing Manager', 'Vertriebsleiter', 'Personalberater', 'Finanzanalyst', 'Operations Manager', 'Qualitätssicherung', 'DevOps Ingenieur', 'Product Owner', 'UX Designer', 'Webentwickler', 'App-Entwickler', 'Cloud Architekt', 'Sicherheitsanalyst', 'Netzwerkadministrator', 'Datenbankadministrator', 'Systemadministrator'],
        companies: ['SAP', 'Siemens', 'Bosch', 'BMW', 'Volkswagen', 'Daimler', 'Deutsche Telekom', 'Allianz', 'BASF', 'Bayer', 'Merck', 'ThyssenKrupp', 'Continental', 'Infineon', 'Henkel', 'Fresenius', 'Linde', 'EON', 'RWE', 'Deutsche Bank']
    },
    'Japan': {
        firstNames: ['Haruto', 'Sota', 'Yuto', 'Koki', 'Ren', 'Riku', 'Sora', 'Haruki', 'Yuki', 'Hayato', 'Hina', 'Yui', 'Aoi', 'Sakura', 'Mei', 'Rin', 'Mio', 'Yua', 'Hana', 'Koharu', 'Rina', 'Aira', 'Saki', 'Misaki', 'Yuna', 'Nozomi', 'Ayaka', 'Riko', 'Miyu', 'Kanon', 'Yume', 'Kokona', 'Nanami', 'Suzu', 'Himari', 'Kokone', 'Rira', 'Anju', 'Karen'],
        lastNames: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kimura', 'Hayashi', 'Mori', 'Shimizu', 'Yamaguchi', 'Aoki', 'Inoue', 'Kudo', 'Koyama', 'Sasaki', 'Yamada', 'Fujita', 'Okamoto', 'Goto', 'Hasegawa', 'Murakami', 'Kojima', 'Fukuda', 'Ota', 'Miura', 'Fujiwara'],
        jobTitles: ['ソフトウェアエンジニア', 'データアナリスト', 'プロジェクトマネージャー', 'ビジネスアナリスト', 'マーケティングマネージャー', 'セールスマネージャー', '人事担当', '財務アナリスト', 'オペレーションマネージャー', '品質保証', 'DevOpsエンジニア', 'プロダクトオーナー', 'UXデザイナー', 'Web開発者', 'モバイル開発者', 'クラウドアーキテクト', 'セキュリティエンジニア', 'ネットワーク管理者', 'データベース管理者', 'システム管理者'],
        companies: ['Toyota', 'Sony', 'Honda', 'Nintendo', 'Panasonic', 'Canon', 'Toshiba', 'Hitachi', 'Mitsubishi', 'NEC', 'Fujitsu', 'Rakuten', 'SoftBank', 'Recruit', 'CyberAgent', 'DeNA', 'Gree', 'Mixi', 'Line', 'Mercari']
    },
    'Canada': {
        firstNames: ['Liam', 'Noah', 'Oliver', 'Ethan', 'Lucas', 'Mason', 'Logan', 'Levi', 'Benjamin', 'Jackson', 'Olivia', 'Emma', 'Ava', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Harper', 'Mia', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Avery', 'Ella', 'Scarlett', 'Grace', 'Lily', 'Aria', 'Chloe', 'Victoria', 'Madison', 'Luna', 'Penelope', 'Stella', 'Nora', 'Hazel', 'Zoey'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'],
        jobTitles: ['Software Developer', 'Data Analyst', 'Project Manager', 'Business Analyst', 'Marketing Specialist', 'Sales Consultant', 'HR Coordinator', 'Financial Advisor', 'Operations Manager', 'Quality Assurance', 'DevOps Engineer', 'Product Owner', 'UX Designer', 'Web Developer', 'Mobile Developer', 'Cloud Architect', 'Security Engineer', 'Network Administrator', 'Database Manager', 'System Administrator'],
        companies: ['Shopify', 'Riot Games', 'OpenText', 'CGI', 'BlackBerry', 'Constellation Software', 'D2L', 'Kik Interactive', 'Hootsuite', 'FreshBooks', 'Wave', 'Stripe Canada', 'Uber Canada', 'Google Canada', 'Microsoft Canada', 'Amazon Canada', 'IBM Canada', 'Cisco Canada', 'Intel Canada', 'NVIDIA Canada']
    },
    'United Kingdom': {
        firstNames: ['Oliver', 'George', 'Harry', 'Noah', 'Jack', 'Arthur', 'Leo', 'Oscar', 'Charlie', 'Theo', 'Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Isabella', 'Sophia', 'Grace', 'Lily', 'Freya', 'Sienna', 'Evelyn', 'Scarlett', 'Emily', 'Harper', 'Willow', 'Phoebe', 'Charlotte', 'Ella', 'Ruby', 'Sophie', 'Evie', 'Ivy', 'Poppy', 'Maisy', 'Alice', 'Esme', 'Rosie', 'Layla'],
        lastNames: ['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts', 'Johnson', 'Lewis', 'Walker', 'Robinson', 'Wood', 'Thompson', 'Wright', 'White', 'Watson', 'Jackson', 'West', 'Harris', 'Cooper', 'King', 'Lee', 'Martin', 'Clarke', 'James', 'Morgan', 'Hughes', 'Edwards'],
        jobTitles: ['Software Developer', 'Business Analyst', 'Project Manager', 'Marketing Manager', 'Sales Executive', 'HR Manager', 'Financial Analyst', 'Operations Manager', 'QA Engineer', 'DevOps Engineer', 'Product Owner', 'UX Designer', 'Web Developer', 'Mobile Developer', 'Cloud Architect', 'Security Engineer', 'Network Engineer', 'DBA', 'System Admin', 'Technical Lead'],
        companies: ['HSBC', 'Barclays', 'Lloyds Banking Group', 'Royal Bank of Scotland', 'Standard Chartered', 'BP', 'Shell', 'Unilever', 'Diageo', 'Tesco', 'Sainsbury\'s', 'Marks & Spencer', 'BT', 'Vodafone', 'Sky', 'BBC', 'ITV', 'Channel 4', 'Bloomberg', 'Reuters']
    },
    'France': {
        firstNames: ['Gabriel', 'Léo', 'Louis', 'Hugo', 'Raphaël', 'Arthur', 'Jules', 'Adam', 'Enzo', 'Lucas', 'Emma', 'Jade', 'Léa', 'Chloé', 'Manon', 'Camille', 'Sarah', 'Lina', 'Jasmine', 'Zoé', 'Mia', 'Louise', 'Romane', 'Alice', 'Juliette', 'Clara', 'Chloé', 'Inès', 'Léa', 'Océane', 'Anaïs', 'Eva', 'Julie', 'Marie', 'Pauline', 'Lison', 'Adèle', 'Jeanne', 'Agathe'],
        lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'André', 'Gillet', 'Martinez', 'Leclerc', 'Mercier', 'Blanc', 'Guérin', 'Boyer', 'Thomas', 'Robert'],
        jobTitles: ['Développeur Logiciel', 'Analyste de Données', 'Chef de Projet', 'Analyste Business', 'Responsable Marketing', 'Commercial', 'Responsable RH', 'Analyste Financier', 'Responsable Opérations', 'Assurance Qualité', 'Ingénieur DevOps', 'Product Owner', 'Designer UX', 'Développeur Web', 'Développeur Mobile', 'Architecte Cloud', 'Ingénieur Sécurité', 'Administrateur Réseau', 'Administrateur Base de Données', 'Administrateur Système'],
        companies: ['TotalEnergies', 'BNP Paribas', 'Crédit Agricole', 'Société Générale', 'AXA', 'Engie', 'EDF', 'Orange', 'Vivendi', 'LVMH', 'Kering', 'L\'Oréal', 'Danone', 'Airbus', 'Safran', 'Thales', ' Dassault Systèmes', 'Capgemini', 'Accenture France', 'Atos']
    }
};

// Helper function to get random item from array
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate unique email
function generateEmail(firstName, lastName, index) {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com'];
    const domain = getRandomItem(domains);
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`;
}

// Helper function to generate password based on company name and job title
function generatePassword(companyName, jobTitle) {
    // Take first 6 chars of company name + first 4 chars of job title + special chars + numbers + uppercase + lowercase
    const companyPart = companyName.replace(/\s/g, '').substring(0, 6);
    const jobPart = jobTitle.replace(/\s/g, '').substring(0, 4);
    const specialChars = '!@#$%^&*';
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const randomUpper = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const randomLower = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
    
    return `${companyPart}${jobPart}${randomSpecial}${randomNum}${randomUpper}${randomLower}`;
}

async function generateUsers() {
    try {
        console.log('Starting user generation...');
        
        let totalGenerated = 0;
        
        for (const countryInfo of countryDistribution) {
            const { country, count } = countryInfo;
            const data = countryData[country];
            
            console.log(`Generating ${count} users for ${country}...`);
            
            for (let i = 0; i < count; i++) {
                const firstName = getRandomItem(data.firstNames);
                const lastName = getRandomItem(data.lastNames);
                const jobTitle = getRandomItem(data.jobTitles);
                const companyName = getRandomItem(data.companies);
                const email = generateEmail(firstName, lastName, i + 1);
                const password = generatePassword(companyName, jobTitle);
                const passwordHash = await hashPassword(password);
                
                const query = `
                    INSERT INTO users (first_name, last_name, email, job_title, company_name, country, password_hash, role, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 1, NOW())
                `;
                
                await pool.query(query, [firstName, lastName, email, jobTitle, companyName, country, passwordHash]);
                
                totalGenerated++;
                
                // Log password for each user
                console.log(`User ${totalGenerated}: ${firstName} ${lastName} (${country})`);
                console.log(`  Email: ${email}`);
                console.log(`  Password: ${password}`);
                console.log(`  Job Title: ${jobTitle}`);
                console.log(`  Company: ${companyName}`);
                console.log('---');
            }
            
            console.log(`✅ ${count} users generated for ${country}`);
        }
        
        console.log(`\n🎉 Total users generated: ${totalGenerated}`);
        console.log('✅ User generation completed successfully!');
        
    } catch (error) {
        console.error('Error generating users:', error);
    } finally {
        await pool.end();
    }
}

// Run the generation
generateUsers();
