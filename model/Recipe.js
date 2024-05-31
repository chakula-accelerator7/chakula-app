const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
    recipeName: { type: String, required: true },
    ingredientList: [{ type: String }],
    pantryIngredientsUsed: [{ type: String }],
    unlistedIngredients: [{ type: String }],
    preparationInstructions: [{ type: String }],
    macronutrientInfo: {
        calories: { type: Number },
        protein: { type: Number },
        fat: { type: Number },
        carbohydrate: { type: Number },
    },
    preparationTime: { type: Number },
    image: { type: Buffer },
});

recipeSchema.set("timestamps", true);

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = { Recipe };
