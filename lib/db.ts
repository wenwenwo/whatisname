// lib/db.ts
import { Pool } from 'pg';

let pool: Pool;

if (process.env.POSTGRES_URL) {
  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });
} else {
  console.error('POSTGRES_URL environment variable is not set.');
  // Create a dummy pool to avoid crashing the app
  pool = new Pool();
}

export const query = (text: string, params: any[]) => pool.query(text, params);
