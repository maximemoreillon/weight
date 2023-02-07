import dotenv from "dotenv"
import { InfluxDB, WritePrecisionType } from "@influxdata/influxdb-client"
import { DeleteAPI } from "@influxdata/influxdb-client-apis"
import { Agent } from "http"

dotenv.config()

const agent = new Agent({
  keepAlive: true,
  keepAliveMsecs: 20 * 1000, // 20 seconds keep alive
})

const {
  INFLUXDB_URL = "localhost",
  INFLUXDB_TOKEN,
  INFLUXDB_ORG = "myOrganization",
  INFLUXDB_BUCKET = "health",
  INFLUXDB_MEASUREMENT = "weight",
  PRECISION = "ns",
} = process.env

const influxDb = new InfluxDB({
  url: INFLUXDB_URL,
  token: INFLUXDB_TOKEN,
  transportOptions: { agent },
})

export const writeApi = influxDb.getWriteApi(
  INFLUXDB_ORG,
  INFLUXDB_BUCKET,
  PRECISION as WritePrecisionType
)
export const queryApi = influxDb.getQueryApi(INFLUXDB_ORG)
export const deleteApi = new DeleteAPI(influxDb)

export const influx_read = (query: string) =>
  new Promise((resolve, reject) => {
    // helper function for Influx queries

    const results: any = []
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        // TODO: Find way to convert directly to an array
        const result = tableMeta.toObject(row)
        results.push(result)
      },
      error(error) {
        reject(error)
      },
      complete() {
        resolve(results)
      },
    })
  })

export const url = INFLUXDB_URL
export const org = INFLUXDB_ORG
export const bucket = INFLUXDB_BUCKET
export const token = INFLUXDB_TOKEN
export const measurement = INFLUXDB_MEASUREMENT
// export const queryApi = queryApi
// export const writeApi = writeApi
// export const deleteApi = deleteApi
// export const influx_read = influx_read
