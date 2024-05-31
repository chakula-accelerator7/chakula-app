const express = require("express");
const { protect } = require("../utilities/middleware");
const url = require("url");
const {} = require("crypto");
const {} = require("querystring");

const User = require("../model/User");
const { GroceryItem } = require("../model/GroceryItem");

const router = express.Router();

router.get("/app", protect, (req, res) => {
    res.redirect("/app/entry");
});

router.get("/app/entry", protect, async (req, res) => {
    // console.log(req.user);

    // find user from database
    // check if user has already set up their account info

    const user = await User.findById(req.user.id);
    if (user.filledEntrySurvey) {
        return res.redirect("/app/setup-pantry");
    }

    res.render("./app/entryForm", { user: req.user });
});

async function calculateTdee(data) {
    const apiURL = "https://fitness-api.p.rapidapi.com/fitness";
    try {
        const response = await fetch(apiURL, {
            method: "post",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "X-RapidAPI-Key": process.env.RAPID_API_KEY,
                "X-RapidAPI-Host": "fitness-api.p.rapidapi.com",
            },
            body: new url.URLSearchParams(data),
        });
        if (!response.ok) {
            const error = new Error(
                "Could not retrieve TDEE data from RAPID API"
            );
            throw error;
        }
        const result = await response.json();
        return result;
    } catch (error) {
        return Promise.reject(error);
    }
}

router.post("/app/entry", protect, async (req, res) => {
    console.log(req.body);
    const { age, height, weight, gender, exercise, goal, diet, intolerances } =
        req.body;
    console.log(goal);

    // goals -- fatloss_moderate, maintenance, bulking_normal

    const fitnessData = await calculateTdee({
        age,
        height,
        weight,
        gender,
        exercise,
        goal,
    });

    const TDEE = fitnessData.totalDailyEnergyExpenditure.bmi.calories.value;
    const user = await User.findById(req.user.id);
    user.TDEE = TDEE;
    const calorieAllowance =
        goal === "fatloss_moderate"
            ? Math.floor(TDEE - 300)
            : goal === "maintenance"
            ? TDEE
            : Math.floor(TDEE + 300);

    user.calorieAllowance = calorieAllowance;
    user.goal = goal;
    user.filledEntrySurvey = true;

    await user
        .updateOne({
            preferredDiets: diet || diet?.length > 0 ? [].concat(diet) : [],
            intolerances:
                intolerances || intolerances?.length > 0
                    ? [].concat(intolerances)
                    : [],
        })
        .exec();
    await user.save();
    console.log(user.preferredDiets);
    res.redirect("/app/setup-pantry");
});

router.get("/app/setup-pantry", protect, async (req, res) => {
    // res.send("Under construction");
    const user = await User.findById(req.user.id);

    if (!user.filledEntrySurvey) {
        return res.redirect("/app/entry");
    }

    if (user.hasSelectedRecipeIngredients) {
        return res.redirect(`/app/${req.user.id}/recipes`);
    }

    // Categories
    // produce this includes all fruits vegetables and most root carbohydrates
    // dairy: animal milk from any source
    // plant-protein
    // bread-grain-cereal
    // seasoning
    // beans-and-legumes
    // meat-seafood-eggs
    // seeds-nuts-oils

    const produce = await GroceryItem.find({ pantryCategory: "produce" });

    const dairy = await GroceryItem.find({
        pantryCategory: "dairy",
    });

    const plantProtein = await GroceryItem.find({
        pantryCategory: "plant-protein",
    });

    const breadGrainCereal = await GroceryItem.find({
        pantryCategory: "bread-grain-cereal",
    });
    const seasoning = await GroceryItem.find({ pantryCategory: "seasoning" });

    const beansAndLegumes = await GroceryItem.find({
        pantryCategory: "beans-and-legumes",
    });

    const meatSeafoodEggs = await GroceryItem.find({
        pantryCategory: "meat-seafood-eggs",
    });

    const nutSeedsOil = await GroceryItem.find({
        pantryCategory: "seeds-nuts-oils",
    });

    res.render("./app/setup-pantry", {
        user: req.user,
        produce,
        dairy,
        plantProtein,
        breadGrainCereal,
        seasoning,
        beansAndLegumes,
        meatSeafoodEggs,
        nutSeedsOil,
    });
});

router.post("/app/setup-pantry", protect, async (req, res) => {
    // console.log(req.body);
    const { ingredients } = req.body;

    console.log(typeof ingredients);
    const user = await User.findById(req.user.id);

    const groceryItemsId = (await GroceryItem.find()).map((item) => item._id);

    let selectedIngredientsId = null;

    if (typeof ingredients === "string") {
        selectedIngredientsId = groceryItemsId.filter((ingredientIdObj) => {
            return ingredientIdObj.toString() === ingredients;
        });
    } else {
        selectedIngredientsId = groceryItemsId.filter((ingredient) => {
            return ingredients.includes(ingredient.toString());
        });
    }

    if (!selectedIngredientsId) {
        return res.send("This is a weird problem");
    }

    await user
        .updateOne({
            preselectedIngredients: selectedIngredientsId,
            hasSelectedRecipeIngredients: true,
        })
        .exec();

    res.redirect(`/app/${req.user.id}/recipes`);
});

module.exports = router;
