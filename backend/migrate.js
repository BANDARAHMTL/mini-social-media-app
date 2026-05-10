const pool = require('./config/db');

async function migrate() {
  try {
    console.log('Adding columns to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN birthday VARCHAR(255)');
    await pool.query('ALTER TABLE users ADD COLUMN address VARCHAR(255)');
    await pool.query('ALTER TABLE users ADD COLUMN contact_number VARCHAR(255)');
    await pool.query('ALTER TABLE users ADD COLUMN school VARCHAR(255)');
    console.log('Columns added successfully.');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
      process.exit(0);
    }
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
