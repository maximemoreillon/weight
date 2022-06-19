const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const {
    IMPORT_URL
} = process.env

axios.get(IMPORT_URL)
.then( ({data}) => {
    data.forEach(item => {
        axios.post('http://localhost:7070/points', item)
            .then( () => {
                console.log(`Point imported: ${item.weight} [${item.time}]`)
            })
            .catch(console.error)
    })
})
.catch(console.error)
