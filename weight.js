const mongodb = require('mongodb');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors')
const authorization_middleware = require('@moreillon/authorization_middleware');
const jwt = require('jsonwebtoken')

const credentials = require('../common/credentials');

const port = 8633;

const DB_config = {
  DB_URL : "mongodb://localhost:27017/",
  DB_name : "medical",
  weight_collection_name : "weight",
}

// Set timezone
process.env.TZ = 'Asia/Tokyo';

authorization_middleware.secret = credentials.jwt.secret

function get_token(authorization_header){
  return authorization_header.split(" ")[1]
}
// Instanciate objects
var MongoClient = mongodb.MongoClient;
var app = express();
app.use(express.static(path.join(__dirname, 'dist')));

app.use(bodyParser.json());

app.use(cors({
  //origin: misc.cors_origins,

  // Hack to allow all origins
  origin: (origin, callback) => {
    callback(null, true)
  },

  credentials: true,
}));


// Express routes
app.post('/upload',authorization_middleware.middleware, (req, res) => {

  if('weight' in req.body){


    MongoClient.connect(DB_config.DB_URL, { useNewUrlParser: true }, (err, db) => {
      if (err) throw err;

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


  }
  else {
    // Invalid
    res.status(400)
  }
})

app.post('/history',authorization_middleware.middleware,  (req, res) => {
  MongoClient.connect(DB_config.DB_URL, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
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

app.post('/current_weight',authorization_middleware.middleware,  (req, res) => {
  MongoClient.connect(DB_config.DB_URL, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
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
