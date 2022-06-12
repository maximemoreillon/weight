const { Router } = require('express')
const { create_point, read_points } = require('../controllers/points')
const router = Router()

router.route('/')
    .post(create_point)
    .get(read_points)
module.exports = router