const { Cluster } = require("puppeteer-cluster");
const cheerio = require("cheerio");

async function genericLoblawsScraper({ page, data }) {
    const { searchTerm, url } = data;
    const timeout = 120000;
    await page.setViewport({
        width: 1200,
        height: 1200,
        deviceScaleFactor: 1,
    });
    await page.goto(url, {
        waitUntil: "domcontentloaded",
    });

    // wait for input selector
    await page.waitForSelector(
        `.desktop-site-header__search-form input[type="text"]`,
        { timeout }
    );
    await page.type(
        `.desktop-site-header__search-form input[type="text"]`,
        searchTerm,
        { delay: 100 }
    );

    await Promise.all([
        page.waitForNavigation({ timeout }),
        page.click(`.desktop-site-header__search-form button[type="submit"]`),
    ]);

    await page.waitForSelector(`.product-grid__results__products`, {
        timeout,
    });

    const htmlString = await page.evaluate(() => {
        const productGrid = document.querySelector(
            ".product-grid__results__products"
        );
        const html = productGrid.innerHTML;
        return html;
    });

    const $ = cheerio.load(htmlString);
    const lis = $(".product-tile-group__list__item");

    let resultsArray = [];

    lis.each((index, li) => {
        const listItem = $(li);
        const productTracking = listItem.find(".product-tracking");
        const dataTrackProductsArray = productTracking.attr(
            `data-track-products-array`
        );
        const productInfo = JSON.parse(dataTrackProductsArray)[0];

        // console.log(resultArray);

        const unitPriceElem = productTracking.find(
            ".price__value.comparison-price-list__item__price__value"
        );

        const unitWeightElem = productTracking.find(
            ".price__unit.comparison-price-list__item__price__unit"
        );

        const imageUrl = productTracking
            .find("img.responsive-image.responsive-image--product-tile-image")
            .prop("src");

        const unitPrice = `${unitPriceElem.text()}${unitWeightElem.text()}`;
        // resultsArray.push(unitPrice);

        const result = {
            name: productInfo.productName,
            textBadge: productInfo.textBadge,
            price: productInfo.productPrice,
            unitPrice,
            siteUrl: url,
        };
        resultsArray.push(result);
    });
    // console.log(resultsArray[0]);
    return resultsArray;
}

async function runCluster(searchTerm) {
    const timeout = 120000;
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 2,
        timeout,
    });

    let noFrillsData, loblawsData;

    try {
        noFrillsData = await cluster.execute(
            { searchTerm, url: "https://www.nofrills.ca/" },
            genericLoblawsScraper
        );
        loblawsData = await cluster.execute(
            { searchTerm, url: "https://www.loblaws.ca/" },
            genericLoblawsScraper
        );
        if (noFrillsData.length <= 0) {
            throw new Error(
                `Search for ${searchTerm} at no frills was unsuccessful`
            );
        }
        if (loblawsData.length <= 0) {
            throw new Error(
                `Search for ${searchTerm} at no frills was unsuccessful`
            );
        }
    } catch (error) {
        console.log(error.message);
        noFrillsData = [];
        loblawsData = [];
    }

    const results = [...noFrillsData, ...loblawsData]
        .filter((result) => {
            return result.textBadge !== "low-stock";
        })
        .sort((a, b) => {
            return b.price - a.price;
        })
        .slice(0, 21);

    console.log(results[0]);

    await cluster.idle();
    await cluster.close();

    return results;
}

// runCluster("Eggs");

module.exports = { runCluster };
