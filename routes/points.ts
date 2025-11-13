import { Router } from "express";
import { create_point, read_points } from "../controllers/points";
export const router = Router();

router.route("/").post(create_point).get(read_points);
