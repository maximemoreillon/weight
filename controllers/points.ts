import createHttpError from "http-errors"
import { Request, Response, NextFunction } from "express"

import { Point } from "@influxdata/influxdb-client"
import { bucket, writeApi, influx_read, measurement } from "../db"

type WeightPoint = {
  weight: number
  time?: Date
}

export const writePoint = async ({ weight, time }: WeightPoint) => {
  // Create point
  const point = new Point(measurement)

  // Timestamp
  if (time) point.timestamp(new Date(time))
  else point.timestamp(new Date())

  // Add weight
  if (typeof weight === "number") point.floatField("weight", weight)
  else point.floatField("weight", parseFloat(weight))

  // write (flush is to actually perform the operation)
  writeApi.writePoint(point)
  await writeApi.flush()

  console.log(`Point created in measurement ${measurement}: ${weight}`)

  return point
}

export const create_point = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { weight, time } = req.body

    if (!weight) throw createHttpError(400, `Weight not provided`)

    const point = await writePoint({ weight, time })

    // Respond
    res.send(point)
  } catch (error) {
    next(error)
  }
}

export const read_points = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Filters
    // Using let because some variable types might change
    let {
      start = "0", // by default, query all points
      stop,
      tags = [],
      fields = [],
      limit = 500, // Limit point count by default, note: this is approximative
    } = req.query

    const stop_query = stop ? `stop: ${stop}` : ""

    // If only one tag provided, will be parsed as string so put it in an array
    if (typeof tags === "string") tags = [tags]
    if (typeof fields === "string") fields = [fields]

    // NOTE: check for risks of injection
    let query = `
            from(bucket:"${bucket}")
            |> range(start: ${start}, ${stop_query})
            |> filter(fn: (r) => r._measurement == "${measurement}")
            `

    // subsampling
    if (Number(limit)) {
      // Getting point count to compute the sampling from the limit
      const count_query = query + `|> count()`
      const record_count_query_result: any = await influx_read(count_query)
      const record_count = record_count_query_result[0]?._value // Dirty here
      if (record_count) {
        const sampling = Math.max(Math.round(record_count / Number(limit)), 1)
        // Apply subsampling
        query += `|> sample(n:${sampling}, pos: 0)`
      }
    }

    // Run the query
    const points = await influx_read(query)

    // Respond to client
    res.send(points)

    console.log(`Points of measurement ${measurement} queried`)
  } catch (error) {
    next(error)
  }
}
