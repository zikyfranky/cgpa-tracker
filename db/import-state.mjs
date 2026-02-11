import mysql from 'mysql2/promise';
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

const MATRIC = '2023/1/94364PH';

const grades = {
  "100-Second Semester-CHM102":{"grade":"C","ca":17,"exam":38},
  "100-Second Semester-GEY102":{"grade":"C","ca":17,"exam":38},
  "100-Second Semester-PHY108":{"grade":"A","ca":26,"exam":59},
  "100-Second Semester-GST112":{"grade":"B","ca":20,"exam":45},
  "100-Second Semester-PHY102":{"grade":"A","ca":26,"exam":59},
  "100-Second Semester-GPH103":{"grade":"B"},
  "100-Second Semester-GPH101":{"grade":"B"},
  "100-Second Semester-FUTM-GPH101":{"grade":"B","ca":20,"exam":45},
  "100-Second Semester-FUTM-GPH103":{"grade":"B","ca":20,"exam":45},
  "100-Second Semester-MTH102":{"grade":"A","ca":26,"exam":59},
  "200-Second Semester-GST212":{"grade":"B","ca":20,"exam":45},
  "200-Second Semester-PHY208":{"grade":"A","ca":26,"exam":59},
  "200-Second Semester-GEY210":{"grade":"E","ca":13,"exam":29},
  "200-Second Semester-FUTM-GPH223":{"grade":"D","ca":14,"exam":33},
  "200-Second Semester-FUTM-GPH221":{"grade":"B","ca":20,"exam":45},
  "200-Second Semester-GEY212":{"grade":"C","ca":17,"exam":38},
  "200-Second Semester-PHY204":{"grade":"D","ca":14,"exam":33},
  "200-First Semester-FUTM-GPH203":{"grade":"F","ca":6,"exam":14},
  "100-First Semester-GEY101":{"grade":"D","ca":14,"exam":33},
  "100-First Semester-CHM101":{"grade":"C","ca":17,"exam":38},
  "100-First Semester-FUTM-GPH112":{"grade":"B","ca":20,"exam":45},
  "100-First Semester-COS101":{"grade":"A","ca":26,"exam":59},
  "100-First Semester-PHY101":{"grade":"B","ca":20,"exam":45},
  "100-First Semester-MTH101":{"grade":"D","ca":14,"exam":33},
  "100-First Semester-PHY107":{"grade":"B","ca":20,"exam":45},
  "100-First Semester-CHM107":{"grade":"C","ca":17,"exam":38},
  "200-First Semester-FUTM-GPH213":{"grade":"A","ca":26,"exam":59},
  "200-First Semester-GPH211":{"grade":"E","ca":13,"exam":29},
  "200-First Semester-PHY205":{"grade":"C","ca":17,"exam":38},
  "200-First Semester-FUTM-GEY211":{"grade":"C","ca":17,"exam":38},
  "200-First Semester-GPH201":{"grade":"C","ca":17,"exam":38},
  "200-First Semester-ENT211":{"grade":"B","ca":20,"exam":45},
  "200-First Semester-PHY207":{"grade":"C","ca":17,"exam":38},
};

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cgpa_tracker',
  });

  // Find user
  const [users] = await connection.execute(
    'SELECT id FROM users WHERE matric_number = ?',
    [MATRIC]
  );

  if (!users.length) {
    console.error(`User with matric ${MATRIC} not found. Register them first.`);
    await connection.end();
    process.exit(1);
  }

  const userId = users[0].id;

  await connection.execute(
    `INSERT INTO user_state (user_id, active_tab, input_mode, current_level, current_semester, upcoming_filter, grades, carryovers)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       active_tab = VALUES(active_tab),
       input_mode = VALUES(input_mode),
       current_level = VALUES(current_level),
       current_semester = VALUES(current_semester),
       upcoming_filter = VALUES(upcoming_filter),
       grades = VALUES(grades),
       carryovers = VALUES(carryovers)`,
    [
      userId,
      '100',
      'grade',
      '300',
      'First Semester',
      '300|First Semester',
      JSON.stringify(grades),
      '{}',
    ]
  );

  console.log(`State imported for ${MATRIC} (user_id: ${userId})`);
  await connection.end();
}

run().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
