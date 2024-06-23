const { GroceryItem } = require("../model/GroceryItem");
const { SearchResult } = require("../model/SearchResult");
const { runCluster } = require("./clusteredScraper");

async function updateSearch() {
    console.log("running every minute");

    const groceryItems = await GroceryItem.find().populate("searchResults");

    // to avoid duplicates im going to empty out the searhc result collection every time this update search occurs

    await SearchResult.deleteMany({});

    for (let item of groceryItems) {
        const itemName = item.name;
        console.log("Scraper started for " + itemName);
        let searchResults;
        // results is going to be an array that is either empty or has search results
        try {
            searchResults = await runCluster(itemName);
        } catch (error) {
            console.error(
                `Error while searching for ${itemName} ${error.message}`
            );
            searchResults = [];
        }
        if (searchResults.length <= 0) {
            console.log(`No results for ${itemName}`);
            item.searchResults = searchResults;
            await item.save();
            console.log(`Saved empty collection to results for ${itemName}`);
        } else {
            let resultsId = [];
            for (let result of searchResults) {
                const newResult = new SearchResult({
                    name: itemName,
                    productName: result.name,
                    textBadge: result.textBadge,
                    price: result.price,
                    unitPrice: result.unitPrice,
                    siteUrl: result.siteUrl,
                });
                await newResult.save();
                resultsId.push(newResult._id);
            }
            item.searchResults = resultsId;
            await item.save();
        }
        await new Promise((res) => setTimeout(res, 10000));

        // on successful completion of this operation a new collection of results will be saved for this particular grocery item
    }
}

module.exports = { updateSearch };
