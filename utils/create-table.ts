import "dotenv/config";
import { pool, TIMESCALEDB_ENABLED } from "../db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS weight (
      time TIMESTAMPTZ NOT NULL,
      weight DOUBLE PRECISION NOT NULL
    );`);

  if (TIMESCALEDB_ENABLED)
    await pool.query(`SELECT create_hypertable('weight', by_range('time'));`);
  pool.end();
}

main();
