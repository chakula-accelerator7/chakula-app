const express = require("express");
const passport = require("passport");

const router = express.Router();

const { GroceryItem, ShoppingListItem } = require("../model/GroceryItem");
const { protect, restrictID, allowJwt } = require("../utilities/middleware");
const User = require("../model/User");
const { scraperFunction } = require("../utilities/clusteredScraper");

const JWTStrategy = require("passport-jwt").Strategy;
require("dotenv").config();

//

router.get("/app/:id/groceries", protect, restrictID, async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate("preselectedIngredients")
        .exec();

    if (!user.filledEntrySurvey) {
        return res.redirect("/app/entry");
    }

    if (!user.hasSelectedRecipeIngredients) {
        return res.redirect("/app/setup-pantry");
    }
    // attributes go through renders into include files

    res.render("./app/groceriesPage", {
        user: req.user,
        title: `Chakula - Groceries Page for ${req.user.name}`,
    });
});

router.get("/app/groceries", allowJwt, async (req, res) => {
    const { category } = req.query;
    const appGroceries = await GroceryItem.find({ pantryCategory: category });
    const user = await User.findById(req.id)
        .populate("preselectedIngredients")
        .exec();

    const userGroceries = user.preselectedIngredients.filter((grocery) => {
        return grocery.pantryCategory === category;
    });

    // console.log(category);
    // res.send({ message: "I see you" });
    res.render("./templates/grocery-category-template", {
        userGroceries,
        appGroceries,
    });
});

router.post("/app/groceries", allowJwt, async (req, res) => {
    // this route is used to add grocery items from the recipes page to a users pantry ingredients
    console.log(req.body);

    const user = await User.findById(req.id)
        .populate("preselectedIngredients")
        .exec();

    const dbGrocery = await GroceryItem.findById(req.body.groceryItemId);

    const duplicateItem = user.preselectedIngredients.find((ingredient) => {
        return ingredient._id.equals(dbGrocery._id);
    });

    if (duplicateItem) {
        return res.status(409).send({ message: "Duplicate" });
    }

    user.preselectedIngredients.push(dbGrocery._id);
    await user.save();

    res.send({ message: `Added to Pantry` });
});

router.delete("/app/groceries", allowJwt, async (req, res, next) => {
    console.log(req.body);
    const { groceryItemId } = req.body;
    const dbGrocery = await GroceryItem.findById(groceryItemId);
    const user = await User.findById(req.id)
        .populate("preselectedIngredients")
        .exec();
    // console.log(`initial ${user.preselectedIngredients.length}`);
    const updatedIngredientList = user.preselectedIngredients.filter(
        (ingredient) => {
            return !ingredient._id.equals(dbGrocery._id);
        }
    );
    await user.updateOne({ preselectedIngredients: updatedIngredientList });
    // console.log(`final ${updatedIngredientList.length}`);

    res.send({ message: "Deleted" });
});

router.get("/app/shopping-list", allowJwt, async (req, res) => {
    const user = await User.findById(req.id).populate("shoppingList").exec();

    const shoppingList = user.shoppingList;
    // res.send({ message: "Shopping list...LOL" });
    res.render("./templates/shoppingListTemplate", { shoppingList });
});

router.get("/app/scrape-price", allowJwt, async (req, res) => {
    const { groceryId } = req.query;

    const grocery = await GroceryItem.findById(groceryId).populate(
        "searchResults"
    );
    const scrapedData = grocery.searchResults;

    // const scrapedData = await scraperFunction(searchQuery);

    // const dummyData = require("../utilities/dummyResponse.json");

    // console.log(req.query);
    res.render("./templates/searchResultTemplate", {
        scrapedData,
    });
});

router.post("/app/shopping-list", allowJwt, async (req, res) => {
    const { from } = req.query;

    const user = await User.findById(req.id).populate("shoppingList").exec();
    let duplicate;
    let itemName, itemPrice;
    if (from === "pantry") {
        const { groceryItemId } = req.body;
        const dbGrocery = await GroceryItem.findById(groceryItemId);
        duplicate = user.shoppingList.find((grocery) => {
            return grocery.name === dbGrocery.name;
        });
        itemName = dbGrocery.name;
        itemPrice = null;
    } else if (from === "search") {
        console.log(req.body);
        const { productName, productPrice } = req.body;
        duplicate = user.shoppingList.find((grocery) => {
            return grocery.name.toLowerCase() === productName.toLowerCase();
        });
        itemName = productName;
        itemPrice = Number(productPrice);
    }

    if (duplicate) {
        return res.status(409).send({ message: "Duplicate" });
    }

    const shoppingListItem = new ShoppingListItem({
        name: itemName,
        price: itemPrice,
        owner: user._id,
    });

    await shoppingListItem.save();
    user.shoppingList.push(shoppingListItem._id);
    await user.save();
    return res.send({ message: "Added to shopping list" });
});

module.exports = router;
