const express = require('express')
const cors = require('cors')
const {version, author} = require('./package.json')
const authorization_middleware = require('@moreillon/authorization_middleware')
const dotenv = require('dotenv')

dotenv.config()

const {
  APP_PORT,
  AUTHENTIATION_API_URL,
} = process.env


const measurement_name = 'weight'
const DB_name = 'medical'

// Set timezone
process.env.TZ = 'Asia/Tokyo';

authorization_middleware.authentication_api_url = `${process.env.AUTHENTIATION_API_URL}/decode_jwt`






const app = express()
app.use(express.json())
app.use(cors())
//app.use(authorization_middleware.middleware);

app.get('/', (req,res) => {
  res.send({
    application_name: 'Weight',
    version,
    author,
  })
})



// start server
app.listen(APP_PORT, () => {
  console.log(`[Express] Weight listening on *:${APP_PORT}`)
})
