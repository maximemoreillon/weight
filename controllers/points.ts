import { Request, Response } from "express";
import { pool } from "../db";
import { pointSchema } from "../validation";
import z from "zod";
import createHttpError from "http-errors";

export const writePoint = async (point: z.infer<typeof pointSchema>) => {
  const { weight, time } = point;
  const sql = `
    INSERT INTO weight (time, weight) 
    VALUES ($1, $2)
    RETURNING *`;

  const {
    rows: [newPoint],
  } = await pool.query(sql, [time, weight]);

  return newPoint;
};

export const create_point = async (req: Request, res: Response) => {
  const { error, data: point } = pointSchema.safeParse(req.body);
  if (error) throw createHttpError(400, error.message);

  const newPoint = await writePoint(point);

  res.send(newPoint);
};

export const read_points = async (req: Request, res: Response) => {
  const { from = new Date(0), to = new Date(), limit = "5000" } = req.query;

  const sql = `
    SELECT * FROM weight 
    WHERE time BETWEEN $1 AND $2
    ORDER BY time DESC
    LIMIT $3`;

  const { rows } = await pool.query(sql, [from, to, Number(limit)]);

  res.send({ from, to, limit: Number(limit), records: rows });
};
