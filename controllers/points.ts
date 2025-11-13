import createHttpError from "http-errors";
import { Request, Response } from "express";
import { pool } from "../db";

type WeightPoint = {
  weight: number;
  time?: Date;
};

export const writePoint = async ({
  weight,
  time = new Date(),
}: WeightPoint) => {
  const sql = `
    INSERT INTO points (time, weight) 
    VALUES ($1, $2)
    RETURNING *`;

  const {
    rows: [newPoint],
  } = await pool.query(sql, [time, weight]);

  return newPoint;
};

export const create_point = async (req: Request, res: Response) => {
  const { weight, time } = req.body;
  // Problem: time is not a date object!

  if (!weight) throw createHttpError(400, `Weight not provided`);

  const point = await writePoint({ weight, time });

  res.send(point);
};

export const read_points = async (req: Request, res: Response) => {
  const { from = new Date(0), to = new Date(), limit = "5000" } = req.query;

  const sql = `
    SELECT * FROM points 
    WHERE time BETWEEN $1 AND $2
    ORDER BY time DESC
    LIMIT $3`;

  const { rows } = await pool.query(sql, [from, to, Number(limit)]);

  res.send({ from, to, limit: Number(limit), records: rows });
};
