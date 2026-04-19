import { Router } from "express";
import { generateRecipe } from "../controllers/recipeController.js";

export const recipeRouter = Router();

recipeRouter.post("/generate-recipe", generateRecipe);
