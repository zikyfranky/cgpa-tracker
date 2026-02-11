import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local if it exists (local dev), otherwise rely on system env (cPanel)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: envPath });
}

async function seed() {
  const dbName = process.env.DB_NAME || 'cgpa_tracker';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
  });

  console.log(`Connected to MySQL (database: ${dbName})`);

  // Read and execute schema (tables only — database created via cPanel)
  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await connection.query(schemaSQL);
  console.log('Schema created');

  // Clear existing data
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('TRUNCATE TABLE courses');
  await connection.query('TRUNCATE TABLE semesters');
  await connection.query('TRUNCATE TABLE levels');
  await connection.query('TRUNCATE TABLE settings');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  // Read courses.json
  const coursesPath = path.join(__dirname, '..', 'public', 'courses.json');
  const config = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));

  // Insert global settings
  await connection.query(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?), (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',
    ['globalMaxUnits', String(config.globalMaxUnits || 24), 'globalMinUnits', String(config.globalMinUnits || 16)]
  );
  console.log('Settings seeded');

  // Insert levels, semesters, courses
  let sortOrder = 0;
  for (const [levelNum, levelData] of Object.entries(config.levels)) {
    sortOrder++;
    const [levelResult] = await connection.query(
      'INSERT INTO levels (level_number, session_name, sort_order) VALUES (?, ?, ?)',
      [parseInt(levelNum), levelData.session, sortOrder]
    );
    const levelId = levelResult.insertId;

    for (const [semName, semData] of Object.entries(levelData.semesters)) {
      const [semResult] = await connection.query(
        'INSERT INTO semesters (level_id, semester_name, max_units) VALUES (?, ?, ?)',
        [levelId, semName, semData.maxUnits || config.globalMaxUnits || 24]
      );
      const semId = semResult.insertId;

      let courseSortOrder = 0;
      for (const course of semData.courses) {
        courseSortOrder++;
        await connection.query(
          'INSERT INTO courses (semester_id, code, title, units, sort_order) VALUES (?, ?, ?, ?, ?)',
          [semId, course.code, course.title, course.units, courseSortOrder]
        );
      }
    }
  }
  console.log('Course data seeded');

  // Create admin user (matric: 00000000, password: masteruser)
  const adminHash = await bcrypt.hash('masteruser', 10);
  await connection.query(
    'INSERT INTO users (matric_number, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role=VALUES(role)',
    ['00000000', adminHash, 'admin']
  );
  console.log('Admin user created (matric: 00000000, password: masteruser)');

  await connection.end();
  console.log('Seed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
