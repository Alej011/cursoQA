import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import { getPool, closePool } from '../src/config/database';

let testPool: Pool;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  testPool = getPool(true);

  try {
    // Test connection
    const client = await testPool.connect();
    client.release();
    console.log('Connected to test database');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}, 15000);

afterAll(async () => {
  try {
    await closePool(testPool);
    console.log('🔌 Disconnected from test database');
  } catch (error) {
    console.warn('Warning during database cleanup:', error);
  }
}, 15000);

beforeEach(async () => {
  // Clean up before each test
  await cleanDatabase();
});

afterEach(async () => {
  // Clean up after each test
  await cleanDatabase();
});

async function cleanDatabase(): Promise<void> {
  try {
    // Get all table names except system tables
    const result = await testPool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `);

    if (result.rows.length > 0) {
      const tableNames = result.rows.map(row => row.tablename).join(', ');
      await testPool.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
    }
  } catch (error) {
    console.warn('Warning: Could not clean database:', error);
  }
}

export { testPool };