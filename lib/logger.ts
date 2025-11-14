
import { query } from './db';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export async function log(level: LogLevel, message: string, meta?: object) {
  const sql = `
    INSERT INTO logs (timestamp, level, message, meta)
    VALUES ($1, $2, $3, $4)
  `;
  try {
    const timestamp = new Date().toISOString();
    const metaJson = meta ? JSON.stringify(meta) : null;
    await query(sql, [timestamp, level, message, metaJson]);
  } catch (error) {
    console.error('Failed to write log to database:', error);
  }
}
