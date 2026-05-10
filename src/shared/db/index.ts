import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT), // Port must be a number
  database: process.env.DB_NAME,
});

export default pool;
