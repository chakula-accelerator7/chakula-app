const express = require("express");
const { protect, restrictID, allowJwt } = require("../utilities/middleware");

const User = require("../model/User");
const passport = require("passport");
const { completions } = require("../utilities/request");

const { Recipe } = require("../model/Recipe");
const { GroceryItem } = require("../model/GroceryItem");
const { jwtStrategy } = require("../utilities/strategies");

// const JWTStrategy = require("passport-jwt").Strategy;

passport.use("jwt-strategy", jwtStrategy);

const router = express.Router();

router.get("/app/:id/recipes", protect, restrictID, async (req, res) => {
    //
    // first plan.
    // get users current pantry items from DB
    const user = await User.findById(req.user.id)
        .populate("preselectedIngredients")
        .exec();

    if (!user.filledEntrySurvey) {
        return res.redirect("/app/entry");
    }

    if (!user.hasSelectedRecipeIngredients) {
        return res.redirect("/app/setup-pantry");
    }

    // if (user.preselectedIngredients.length <= 0) {
    //     const allItems = await GroceryItem.find();
    //     const allItemIds = allItems.map((item) => {
    //         return item._id;
    //     });
    //     await user.updateOne({ preselectedIngredients: allItemIds });
    // }

    // console.log(user.preselectedIngredients[0]);

    // const selectedIngredientListString = user.preselectedIngredients
    //     .map((ing) => ing.name)
    //     .join(", ");
    // const calorieAllowance = user.calorieAllowance;

    // If you decide that you want to skip this portion then we will include all of the grocery items to your list of preselected ongredients

    res.render("./app/recipesPage", {
        user: req.user,
    });
});

// to make a post request for a recipe, jwt authentication implemented to protect the route and refresh token usage as well.

// Refresh token possibly

// function refreshIfAuthenticated(req, res, next){
//     console.log("this is for access to a jwt route to refresh the jwt token if req is still authenticated")
//     req.cookies["jwt"] = null
//     console.log('This might work')
//     next()
// }

router.get("/app/fetch-recipe", allowJwt, async (req, res) => {
    console.log("Started recipe generator");
    // Main controller logic

    const user = await User.findById(req.id)
        .populate("preselectedIngredients")
        .exec();
    const preselected = user.preselectedIngredients
        .map((ing) => ing.name)
        .join(", ");
    // console.log(preselected);
    const preferred =
        user.preferredDiets.length > 0 ? user.preferredDiets.join(", ") : null;
    const intolerances =
        user.intolerances.length > 0 ? user.intolerances.join(", ") : null;
    const recipePrompt = `I have ${preselected} in my pantry. My calorie allowance is ${
        user.calorieAllowance
    }kcal. ${preferred ? `My meal preferences include ${preferred}` : ""}. ${
        intolerances ? `I am allergic to ${intolerances}.` : ""
    }`;
    // console.log(recipePrompt);

    let recipeList = await completions(recipePrompt);

    // when recipe is generated it gets saved to database

    let recentRecipes = [];
    for (const recipe of recipeList) {
        const newRecipe = new Recipe({
            recipeName: recipe.recipeName,
            ingredientList: recipe.ingredientList,
            pantryIngredientsUsed: recipe.pantryIngredientsUsed,
            unlistedIngredients: recipe.unlistedIngredients,
            preparationInstructions: recipe.preparationInstructions,
            preparationTime: recipe.preparationTime,
            macronutrientInfo: recipe.macronutrientInfo,
            image: recipe.imageStrBuffer,
        });
        await newRecipe.save();
        recentRecipes.push(newRecipe.id);
    }

    const sentRecipes = recipeList.map((recipe, index) => {
        return {
            ...recipe,
            _id: recentRecipes[index],
        };
    });

    res.render("./templates/recipes_AI", { recipeList: sentRecipes });
    console.log("recipe sent");
    recentRecipes = [];
    console.log("temp cache cleared", recentRecipes);

    // res.send(recipeList);
});

router.post("/app/recipe-save/:recipeId", allowJwt, async (req, res) => {
    try {
        console.log(req.params.recipeId);
        const foundRecipe = await Recipe.findById(req.params.recipeId);
        const loggedInUser = await User.findById(req.id)
            .populate("recipes")
            .exec();

        const duplicateRecipe = loggedInUser.recipes.find((recipe) =>
            recipe._id.equals(foundRecipe._id)
        );

        if (duplicateRecipe) {
            console.log("Found Duplicate");
            return res.status(409).send({
                message: `The Recipe ${duplicateRecipe.recipeName} already exists in your collection`,
            });
        }

        loggedInUser.recipes.push(foundRecipe._id);
        await loggedInUser.save();

        res.send({
            message: "Saved " + foundRecipe.recipeName + " to collection",
        });
    } catch (error) {
        console.log(error.message);
        res.send({ message: "There was an error" });
    }
});

router.get("/app/recipe/:id", allowJwt, async (req, res) => {
    const recipeId = req.params.id;
    const category = req.query.category;
    try {
        const recipe = await Recipe.findById(recipeId);
        let foundRecipe = false;
        if (recipe) {
            foundRecipe = recipe;
        }

        // console.log(foundRecipe._id);

        foundRecipe.imageData = recipe.image.toString("base64");
        if (category === "featured") {
            return res.render("./templates/featured-recipe", {
                recipe: foundRecipe,
            });
        }
        // console.log(foundRecipe.macronutrientinfo);
        if (category === "recent") {
            return res.render("./templates/saved-recipe", {
                recipe: foundRecipe,
            });
        }
    } catch (error) {
        // console.log(error.message);
        // res.send({ message: "Application Error" });
    }
});

// router.post("/app/recipe-favorite/:id", allowJwt, async (req, res, next) => {
//     try {
//         const loggedInUser = await User.findById(req.id);
//         const recipeId = req.params.id;

//         const favoritedRecipe = await Recipe.findById(recipeId);
//         loggedInUser.favoriteRecipes.push(favoritedRecipe._id);
//         await loggedInUser.save();
//         res.send({
//             message: `Added ${favoritedRecipe.recipeName} to favorites`,
//         });
//     } catch (error) {
//         res.send({ message: error.message });
//     }
// });

router.get("/app/recipe-categories", allowJwt, async (req, res, next) => {
    try {
        const loggedInUser = await User.findById(req.id)
            .populate("recipes")
            .exec();

        const recipes = await Recipe.find();

        // pick a recipe at random and make it featured
        let featuredDoc = null;
        if (recipes.length > 0) {
            let randInd = Math.floor(Math.random() * recipes.length);
            featuredDoc = recipes[randInd];
        }

        // console.log(featuredDoc?._id);

        // Sort recipes in order of creation and convert the base64 buffer from the database into  abase64 string
        const sortedRecipes = [...loggedInUser.recipes]
            .sort((a, b) => {
                return b?.createdAt - a?.createdAt;
            })
            .map((recipe) => {
                recipe.image = recipe.image.toString("base64");
                return recipe;
            });

        // let recent = false,
        //     featured = false;
        // if (sortedRecipes.length) {
        //     recent = sortedRecipes[0];
        //     recent.image = recent.image.toString("base64");
        // }

        let featured = false;

        if (featuredDoc) {
            featured = featuredDoc;
            featured.image = featured.image.toString("base64");
        }

        res.render("./templates/recipeCategoryTemplate", {
            featured,
            sortedRecipes,
        });

        // res.json({ recipes: loggedInUser.recipes });
    } catch (error) {
        console.log(error.message);
        res.send({ message: "likely a database error" });
    }
});

module.exports = router;
