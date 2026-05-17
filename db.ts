import pg from "pg";

export const {
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_USER = "postgres",
  DB_PASSWORD = "",
  DB_DATABASE = "weight",
  TIMESCALEDB_ENABLED,
} = process.env;

export const pool = new pg.Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_DATABASE,
  user: DB_USER,
  password: DB_PASSWORD,
});

export async function dbConnectionCheck() {
  const res = await pool.query("SELECT 1");
}
