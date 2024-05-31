const puppeteer = require("puppeteer");
// const puppeteer = require("puppeteer-extra");
// const Stealth = require("puppeteer-extra-plugin-stealth");
// puppeteer.use(Stealth());
const cheerio = require("cheerio");

// Scraper Function for no frills.ca

async function scraperNoFrills(sq, location = false) {
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: false,
        });
        const page = await browser.newPage();
        await page.setViewport({
            width: 1024,
            height: 1024,
        });

        await page.goto("https://www.nofrills.ca/", {
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
            const trackingArray = productTracking.attr(
                "data-track-products-array"
            );
            const array = JSON.parse(trackingArray);
            productsArray.push(array[0]);
        });
        // I also want each product image
        // I should also include an option for if they decide to provide a location.
        console.log(productsArray);
        // console.log("I have the html of the results");
    } catch (error) {
        console.log(error);
    } finally {
        await browser.close();
    }
}

async function scrapeLoblaws(sq) {
    let browser;

    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
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
            products.push({ ...productDetailArray[0], imageUrl: image });
        });

        const finalProducts = products
            .filter((product) => {
                return product.textBadge !== "low-stock";
            })
            .sort((a, b) => {
                return Number(b.productPrice) - Number(a.productPrice);
            })
            .slice(0, 19);

        console.log(finalProducts);
    } catch (error) {
        console.log(error.message);
    } finally {
        browser.close();
    }
}

scrapeLoblaws("chicken");

// scraperNoFrills("peanut butter");
