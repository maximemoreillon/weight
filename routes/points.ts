import { Router } from "express"
import { create_point, read_points } from "../controllers/points"
const router = Router()

router.route("/").post(create_point).get(read_points)

module.exports = router
