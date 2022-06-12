const { Point } = require('@influxdata/influxdb-client')
const {
    org,
    bucket,
    writeApi,
    influx_read,
    deleteApi,
    measurement
} = require('../db.js')

exports.create_point = async (req, res, next) => {
    try {

        const data = req.body

        // Create point
        let point = new Point(measurement)

        // Deal with values
        for (const field in data) {
            const value = data[field]

            if (field === 'time') {
                // Add time if provided
                point.timestamp(new Date(value))
            }
            else if ((typeof value) === 'number') {
                // float value
                point.floatField(field, parseFloat(value))
            }
            else {
                // String value
                point.stringField(field, value)
            }
        }

        // write (flush is to actually perform the operation)
        writeApi.writePoint(point)
        await writeApi.flush()

        console.log(`Point created in measurement ${measurement}`)

        // Respond
        res.send(point)

    }
    catch (error) {
        next(error)
    }
}

exports.read_points = async (req, res, next) => {

    try {

        // Filters
        // Using let because some variable types might change
        let {
            start = '0', // by default, query all points
            stop,
            tags = [],
            fields = [],
            limit = 500, // Limit point count by default, note: this is approximative
        } = req.query

        const stop_query = stop ? (`stop: ${stop}`) : ''


        // If only one tag provided, will be parsed as string so put it in an array
        if (typeof tags === 'string') tags = [tags]
        if (typeof fields === 'string') fields = [fields]

        // NOTE: check for risks of injection
        let query = `
            from(bucket:"${bucket}")
            |> range(start: ${start}, ${stop_query})
            |> filter(fn: (r) => r._measurement == "${measurement}")
            `


        // subsampling
        // Getting point count to compute the sampling from the limit
        const count_query = query + `|> count()`
        const record_count_query_result = await influx_read(count_query)
        const record_count = record_count_query_result[0]._value // Dirty here
        const sampling = Math.max(Math.round(12 * record_count / (limit)), 1) // Not sure why 12

        // Apply subsampling
        query += `|> sample(n:${sampling})`

        // Run the query
        const points = await influx_read(query)

        // Respond to client
        res.send(points)

        console.log(`Measurements of ${measurement} queried`)
    }
    catch (error) {
        next(error)
    }
}

exports.read_point = async (req, res, next) => {
    res.status(501).send('Not implemented')
}

