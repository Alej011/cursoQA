import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const getDatabaseConfig = (isTest: boolean = false): DatabaseConfig => {
  const prefix = isTest ? 'TEST_' : '';

  return {
    host: process.env[`${prefix}DB_HOST`] || 'localhost',
    port: parseInt(process.env[`${prefix}DB_PORT`] || '5432'),
    database: process.env[`${prefix}DB_NAME`] || 'curso_qa',
    user: process.env[`${prefix}DB_USER`] || 'postgres',
    password: process.env[`${prefix}DB_PASSWORD`] || 'password'
  };
};

let pool: Pool | null = null;

export const getPool = (isTest: boolean = false): Pool => {
  if (pool && !isTest) {
    return pool;
  }

  const config = getDatabaseConfig(isTest);

  const newPool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  if (!isTest) {
    pool = newPool;
  }

  return newPool;
};

export const closePool = async (poolToClose?: Pool): Promise<void> => {
  if (poolToClose) {
    await poolToClose.end();
  } else if (pool) {
    await pool.end();
    pool = null;
  }
};

export type { DatabaseConfig };