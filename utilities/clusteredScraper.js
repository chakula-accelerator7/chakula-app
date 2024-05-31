const { Cluster } = require("puppeteer-cluster");

const cheerio = require("cheerio");

async function scraperNoFrills({ page, data: sq }) {
    await page.setViewport({
        width: 1024,
        height: 1024,
    });

    const siteUrl = "https://www.nofrills.ca/";
    await page.goto(siteUrl, {
        waitUntil: "domcontentloaded",
    });

    const input = await page.waitForSelector(
        ".site-header .desktop-site-header__search-form input[type='text']"
    );

    await input.type(sq, { delay: 100 });

    await Promise.all([
        page.click(
            ".site-header .desktop-site-header__search-form button[data-testid='submit-search']"
        ),
        page.waitForNavigation(),
    ]);

    await page.waitForSelector(`.product-grid__results`);
    const results = await page.evaluate(() => {
        const resultProductGrid = document.querySelector(
            `.product-grid__results`
        );
        const html = resultProductGrid.innerHTML;
        return html;
    });

    const $ = cheerio.load(results);
    const products = $("ul.product-tile-group__list");
    const lis = products.find("li.product-tile-group__list__item");

    let productsArray = [];

    lis.each((index, element) => {
        const li = $(element);
        const productTracking = li.find(".product-tracking");
        const trackingArray = productTracking.attr("data-track-products-array");
        const image = productTracking.find("img").prop("src");
        const array = JSON.parse(trackingArray);
        productsArray.push({ ...array[0], imageUrl: image, storeUrl: siteUrl });
    });

    const finalArray = productsArray
        .filter((elem) => {
            return elem.textBadge !== "low-stock";
        })
        .map(
            ({
                productName,
                productBrand,
                productPrice,
                imageUrl,
                storeUrl,
            }) => {
                return {
                    productName,
                    productBrand,
                    productPrice,
                    imageUrl,
                    storeUrl,
                };
            }
        )
        .sort((a, b) => {
            return Number(b.productPrice) - Number(a.productPrice);
        })
        .slice(0, 20);

    // I also want each product image
    // I should also include an option for if they decide to provide a location.
    return finalArray;
}

async function scrapeLoblawsData({ page, data: sq }) {
    await page.setViewport({
        width: 1024,
        height: 1024,
    });

    // await page.setUserAgent(
    //     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    // );

    const baseUrl = `https://www.loblaws.ca/`;

    await page.goto(baseUrl);

    const inputField = await page.waitForSelector(
        ".site-header .desktop-site-header__search-form input[type='text']"
    );

    await inputField.type(sq, { delay: 100 });

    await Promise.all([
        page.click(
            `.site-header .desktop-site-header__search-form button[type='submit']`
        ),
        page.waitForNavigation(),
    ]);

    await page.waitForSelector(
        "#site-content > div > div > div > div.product-grid.product-grid--cross-category-active > div.product-grid__results > div.product-grid__results__products"
    );

    console.log("Found Selector");

    const html = await page.evaluate(() => {
        const products = document.querySelector(
            "#site-content > div > div > div > div.product-grid.product-grid--cross-category-active > div.product-grid__results > div.product-grid__results__products"
        );
        const html = products.innerHTML;
        return html;
    });

    // console.log(html);

    const $ = cheerio.load(html);

    const productsUl = $("div > ul");
    console.log(productsUl.length);
    const lis = productsUl.find(".product-tile-group__list__item");
    console.log(lis.length);
    const products = [];
    lis.each((index, element) => {
        const trackingDiv = $(element).find("div.product-tracking");
        const productDetail = trackingDiv.attr("data-track-products-array");

        const image = trackingDiv.find("img.responsive-image").prop("src");

        const productDetailArray = JSON.parse(productDetail);
        products.push({
            ...productDetailArray[0],
            imageUrl: image,
            storeUrl: baseUrl,
        });
    });

    const finalProducts = products
        .filter((product) => {
            return product.textBadge !== "low-stock";
        })
        .map(
            ({
                productName,
                productBrand,
                productPrice,
                imageUrl,
                storeUrl,
            }) => {
                return {
                    productName,
                    productBrand,
                    productPrice,
                    imageUrl,
                    storeUrl,
                };
            }
        )
        .sort((a, b) => {
            return Number(b.productPrice) - Number(a.productPrice);
        })
        .slice(0, 20);

    console.log(finalProducts[0], "From loblaws");

    return finalProducts;
}

async function scraperFunction(searchQuery) {
    console.log(`Search started`);
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
        puppeteerOptions: {
            headless: true,
        },
    });

    let noFrillsData, loblawsData;

    try {
        noFrillsData = await cluster.execute(searchQuery, scraperNoFrills);
    } catch (error) {
        console.log(error.message);
    }

    try {
        loblawsData = await cluster.execute(searchQuery, scrapeLoblawsData);
    } catch (error) {
        console.log(error.message);
    }

    let scrapedData = [];
    if (noFrillsData) {
        scrapedData = scrapedData.concat(noFrillsData);
    }

    if (loblawsData) {
        scrapedData = scrapedData.concat(loblawsData);
    }

    scrapedData = scrapedData.sort((a, b) => {
        return Number(b.productPrice) - Number(a.productPrice);
    });

    // console.log();
    await cluster.idle();
    await cluster.close();
    return scrapedData;
}

// scrape("chicken");

module.exports = {
    scraperFunction,
};
