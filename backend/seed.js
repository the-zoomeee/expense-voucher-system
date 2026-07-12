// run: npm run seed (after schema.sql). skips existing users
const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');
require('dotenv').config();

const demoUsers = [
  {
    name: 'Priya Employee',
    email: 'employee@demo.com',
    password: 'Password@123',
    role: 'employee',
    department_name: 'Engineering',
    employee_code: 'EMP001',
  },
  {
    name: 'Arjun Director',
    email: 'director@demo.com',
    password: 'Password@123',
    role: 'director',
    department_name: null,
    employee_code: null,
  },
  {
    name: 'Neha Accounts',
    email: 'accounts@demo.com',
    password: 'Password@123',
    role: 'accounts',
    department_name: null,
    employee_code: null,
  },
];

async function seed() {
  for (const u of demoUsers) {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing.length) {
      console.log(`Skipping ${u.email} — already exists.`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, employee_code, department_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [u.name, u.email, hash, u.role, u.employee_code, u.department_name]
    );
    console.log(`Created ${u.role}: ${u.email} / ${u.password}`);
  }
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
