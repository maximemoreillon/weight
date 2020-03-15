const axios = require('axios')
const jwt = require('jsonwebtoken')
const secrets = require('./secrets')
const Influx = require('influx')
var MongoClient = require('mongodb').MongoClient;

const DB_name = 'medical'


const influx = new Influx.InfluxDB({
  host: secrets.influx_url,
  database: DB_name,
})


influx.dropDatabase(DB_name)
.then( () => {
  influx.getDatabaseNames()
  .then(names => {
    if (!names.includes(DB_name)) {
      influx.createDatabase(DB_name)
      .then(() => {
        console.log('Creation OK')


        jwt.sign({ app: 'medical_migration' }, secrets.jwt_secret, (err, token) => {
          if(err) throw err

          MongoClient.connect("mongodb://localhost:27017/", (err, db) => {
          if (err) throw(err)
          console.log('Connection to DB OK')
          db.db("medical")
          .collection("weight")
          .find({}).toArray( (err, result) => {
            db.close();
            if (err) throw(err)

            let points = []


            result.forEach(entry => {
              points.push({
                measurement: "weight",
                tags: {
                  unit: "kg",
                },
                fields: {
                  weight: entry.weight
                },
                timestamp: new Date(entry.date),
              })
            })

            console.log(points)


            influx.writePoints(points, {
              database: DB_name,
              precision: 's',
            })
            .then( () => console.log("OK"))
            .catch(error =>  console.log(`Error saving data to InfluxDB! ${error}`));
          });
        });


          /*

          axios.post('https://weight.maximemoreillon.com/history',{}, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token,
            }
          })
          .then(response => {




          })
          .catch(error => {console.log(error)})

          */



        });

      })
      .catch( error =>  console.log(error) );
    }
  })
  .catch(error => console.log(error));
})
.catch(error => console.log(error));
