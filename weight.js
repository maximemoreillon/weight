const mongodb = require('mongodb')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const authorization_middleware = require('@moreillon/authorization_middleware')
const Influx = require('influx')

const secrets = require('./secrets');

const port = 8633;

const DB_config = {
  DB_URL : secrets.mongodb_url,
  DB_name : secrets.db_name,
  weight_collection_name : secrets.collection_name,
  constructor_options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
}

// Set timezone
process.env.TZ = 'Asia/Tokyo';

authorization_middleware.secret = secrets.jwt_secret

function get_token(authorization_header){
  return authorization_header.split(" ")[1]
}

// Instanciate objects
var MongoClient = mongodb.MongoClient;

const influx = new Influx.InfluxDB({
  host: secrets.influx_url,
  database: 'medical',
})

const measurement_name = 'weight'


var app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.use(bodyParser.json());
app.use(cors());
app.use(authorization_middleware.middleware);



// Express routes
app.post('/upload', (req,res) => {

  if( !('weight' in req.body) ) return res.status(400).send('weight is not present in request body')

  influx.writePoints(
    [
      {
        measurement: measurement_name,
        tags: {
          unit: 'kg',
        },
        fields: {
          weight: req.body.weight
        },
        timestamp: new Date(),
      }
    ], {
      database: DB_name,
      precision: 's',
    })
    .then( () => res.send("Weight registered successfully"))
    .catch(error => res.status(500).send(`Error saving data to InfluxDB! ${error}`));

})

app.post('/history', (req,res) => {
  influx.query(`select * from ${measurement_name}`)
  .then( result => res.send(result) )
  .catch( error => res.status(500).send(`Error getting weight from Influx: ${error}`) );
})

app.post('/current_weight', (req,res) => {
  influx.query(`select * from ${measurement_name} GROUP BY * ORDER BY DESC LIMIT 1`)
  .then( result => res.send(result[0].balance) )
  .catch( error => res.status(500).send(`Error getting weight from Influx: ${error}`) );
})

//////////// LEGACY CODE USING MONGODB ///////////////
app.post('/upload_mongo',authorization_middleware.middleware, (req, res) => {

  // Check input
  if( !('weight' in req.body) ) return res.status(400).send('weight is not present in request body')

  MongoClient.connect(DB_config.DB_URL, DB_config.constructor_options, (err, db) => {
    if (err) { return res.status(500).send('Error connecting to the DB') }
    db.db(DB_config.DB_name)
    .collection(DB_config.weight_collection_name)
    .insertOne({
      date: new Date(),
      weight: Number(req.body.weight)
    },
    (err, result) => {
      if (err) throw err;
      console.log(`Inserted ${req.body.weight}kg`)
      db.close();
      res.send("OK");
    });
  });

})

app.post('/history_mongo',authorization_middleware.middleware,  (req, res) => {
  MongoClient.connect(DB_config.DB_URL, DB_config.constructor_options, (err, db) => {
    if (err) { return res.status(500).send('Error connecting to the DB') }
    db.db(DB_config.DB_name)
    .collection(DB_config.weight_collection_name)
    .find({})
    .sort({date: -1})
    .toArray((err, result) =>{
      if (err) throw err;
      db.close();
      res.send(result);
    });
  });
})

app.post('/current_weight_mongo',authorization_middleware.middleware,  (req, res) => {
  MongoClient.connect(DB_config.DB_URL, DB_config.constructor_options, (err, db) => {
    if (err) { return res.status(500).send('Error connecting to the DB') }
    db.db(DB_config.DB_name)
    .collection(DB_config.weight_collection_name)
    .find({})
    .sort({date: -1}).limit(1)
    .toArray((err, result) => {
      if (err) throw err;
      db.close();
      res.send(result);
    });
  });
})

// start server
app.listen(port, () => {
  console.log(`[Express] Weight listening on *:${port}`)
})
