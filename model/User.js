const mongoose = require("mongoose");

const { model, Schema } = mongoose;

const userSchema = new Schema({
    accountHolderName: { type: String, required: true },
    emailAddress: { type: String, required: true },
    password: { type: String, required: true },
    filledEntrySurvey: { type: Boolean, default: false },
    hasSelectedRecipeIngredients: { type: Boolean, default: false },

    TDEE: { type: Number },
    calorieAllowance: { type: Number },

    preselectedIngredients: [
        { type: mongoose.Schema.Types.ObjectId, ref: "GroceryItem" },
    ],
    pantryItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroceryItem" }],
    shoppingList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ShoppingItem",
        },
    ],
    goal: { type: String },
    preferredDiets: [{ type: String }],
    intolerances: [{ type: String }],
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
});

const User = model("users", userSchema);

module.exports = User;
