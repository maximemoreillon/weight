import "dotenv/config";
import { pool } from "../db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS weight (
      time TIMESTAMPTZ NOT NULL,
      weight DOUBLE PRECISION NOT NULL
    );`);

  await pool.query(`SELECT create_hypertable('weight', by_range('time'));`);
  pool.end();
}

main();
