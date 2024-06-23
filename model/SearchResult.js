const mongoose = require("mongoose");

const searchResultSchema = new mongoose.Schema({
    name: { type: String },
    productName: { type: String },
    price: { type: Number },
    unitPrice: { type: String },
    siteUrl: { type: String },
    textBadge: { type: String },
});

const SearchResult = mongoose.model("SearchResult", searchResultSchema);

module.exports = { SearchResult };
