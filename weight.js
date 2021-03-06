const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const Influx = require('influx')
const authorization_middleware = require('@moreillon/authorization_middleware')
const dotenv = require('dotenv');

dotenv.config();

const port = process.env.APP_PORT || 80

const measurement_name = 'weight'
const DB_name = 'medical'

// Set timezone
process.env.TZ = 'Asia/Tokyo';

authorization_middleware.authentication_api_url = `${process.env.AUTHENTIATION_API_URL}/decode_jwt`

const influx = new Influx.InfluxDB({
  host: process.env.INFLUXDB_URL,
  database: DB_name,
})

// Create DB if not exists
influx.getDatabaseNames()
.then(names => {
  if (!names.includes(DB_name)) return influx.createDatabase(DB_name)
})
.catch(err => { console.error(`Error creating Influx database! ${err}`) })


var app = express();
app.use(bodyParser.json());
app.use(cors());
//app.use(authorization_middleware.middleware);

app.get('/', (req,res) => {
  res.send(`Weight API, Maxime MOREILLON`)
})

// Express routes
app.post('/upload', (req,res) => {
  console.log('[Express] request arrived on /upload')

  if( !('weight' in req.body) ) return res.status(400).send('weight is not present in request body')

  influx.writePoints(
    [
      {
        measurement: measurement_name,
        tags: {
          unit: 'kg',
        },
        fields: {
          weight: Number(req.body.weight)
        },
        timestamp: new Date(),
      }
    ], {
      database: DB_name,
      precision: 's',
    })
    .then( () => res.send("Weight registered successfully"))
    .catch(error => {
      console.log(error)
      res.status(500).send(`Error saving data to InfluxDB! ${error}`)
    });

})

app.get('/history', (req,res) => {
  influx.query(`select * from ${measurement_name}`)
  .then( result => res.send(result) )
  .catch( error => res.status(500).send(`Error getting weight from Influx: ${error}`) );
})

app.get('/current_weight', (req,res) => {
  influx.query(`select * from ${measurement_name} GROUP BY * ORDER BY DESC LIMIT 1`)
  .then( result => { res.send(result[0]) } )
  .catch( error => res.status(500).send(`Error getting weight from Influx: ${error}`) );
})


// start server
app.listen(port, () => {
  console.log(`[Express] Weight listening on *:${port}`)
})
