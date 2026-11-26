import 'dotenv/config';
import mysql from 'mysql2/promise';
// dateStrings keeps DATETIME values as plain 'YYYY-MM-DD HH:MM:SS' text (no timezone shifts)
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', port: +process.env.DB_PORT || 3306,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'smart_campus', dateStrings: true, connectionLimit: 10,
});
