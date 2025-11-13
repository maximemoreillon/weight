import "dotenv/config";
import { parse } from "csv-parse/sync";
import fs from "fs";
import { pool } from "../db";

async function main() {
  const file = fs.readFileSync("data.csv");
  const records = parse(file, {
    skip_empty_lines: true,
    columns: true,
    from_line: 4,
  });

  for (const record of records) {
    const { _value, _time }: any = record;
    const sql = `
      INSERT INTO weight (time, weight) 
      VALUES ($1, $2)
      RETURNING *`;

    const {
      rows: [newPoint],
    } = await pool.query(sql, [_time, _value]);

    console.log(newPoint);
  }

  pool.end();
}

main();
