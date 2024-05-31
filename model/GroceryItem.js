const mongoose = require("mongoose");
const seed = require("../utilities/seed.json");

// grocery Item Schema no longer has a best price.

const groceryItemScehma = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    pantryCategory: { type: String, required: true },
});

// This is an idea that i was trying out to try to connect a shopping list item

const shoppingListItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
});

shoppingListItemSchema.set("timestamps", true);

const GroceryItem = mongoose.model("GroceryItem", groceryItemScehma);

const ShoppingListItem = mongoose.model("ShoppingItem", shoppingListItemSchema);

// A user will have grocery items that they already have in their pantry and shopping list items
// products can be added to a shopping list after searching for them, identifying their prices
// groceries can be added or removed from their pantry items through that whole drama on the left side of the screen

// Seed data, comment out after the first deployment

// GroceryItem.insertMany(); <-- Insert seed here, see above for seed

module.exports = { GroceryItem, ShoppingListItem };
