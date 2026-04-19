import { Router } from "express";
import { generateRecipe } from "../controllers/recipeController.js";

const router = Router();

router.post("/generate-recipe", generateRecipe);

export default router;
