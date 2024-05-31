console.log("I see you recipe config");
window.addEventListener("DOMContentLoaded", async () => {
    await recipeCategoryRender();
});

function showNotification(text, className) {
    return Toastify({
        text,
        duration: 30000,
        destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
        className,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover

        onClick: function () {}, // Callback after click
    }).showToast();
}

// This is for the modal
const recipeModal = new bootstrap.Modal("#recipe-modal");

const recipeModalElement = document.querySelector("#recipe-modal");

const recipeContainer = document.querySelector("#recipe-modal .modal-body");

// The large orange button on the recipe page
const fetchButton = document.querySelector("#btn-get-recipe");

const recipeCategoryContainer = document.querySelector(
    "#recipe-category-container"
);

// the generate button will make a post request to app/fetch-recipe and display it in the modal

fetchButton.addEventListener("click", async (e) => {
    recipeModal.show();
    recipeContainer.innerHTML = `<img class="spinner-image" src='../../../images/loader.gif' />`;
    try {
        const response = await fetch("/app/fetch-recipe");

        // This is a test
        // const json = await response.json();

        // console.log(json);

        const html = await response.text();
        recipeContainer.innerHTML = html;
    } catch (error) {}
});

// This uses event delegation to save a recipe to a users collection of recipes whenever they click on the save button from recent recipe and when they click on the save button from generated recipes

// recipecontainer is the modal body

recipeContainer.addEventListener("click", async (e) => {
    if (e.target.closest("button[data-button-role='save']")) {
        const target = e.target.closest("button[data-button-role='save']");
        const saved = target.getAttribute("data-saved") === "true";
        if (saved) {
            console.log("clicked");
            return;
        }
        const recipeId = target.getAttribute("data-recipe-id");
        //
        try {
            console.log("Will only save once, future clicks do nothing");
            const saveData = await saveRecipe(recipeId);
            showNotification(saveData.message, "success-toast");
            console.log(saveData);
            target.setAttribute("data-saved", "true");
            target.innerHTML = `<i class="fa-solid fa-bookmark"></i>`;
            await recipeCategoryRender();
        } catch (error) {
            showNotification(error.message, "warn-toast");
        }
        // the purpose of the recipe id is to use it to locate the recipe and add it to the users saved recipes

        return;
    }

    // Add a grocery item using the ingredient name this will send a post request to /app/groceries
    // this os from any of the recipes that show up. Featured and saved.
    if (e.target.closest(`button[data-add-ingredient]`)) {
        console.log("Clicked");
        const target = e.target.closest(`button[data-add-ingredient]`);
        const ingredientName = target.getAttribute("data-add-ingredient");

        const response = await fetch(`/app/groceries`, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ingredientName }),
        });
        const data = await response.json();
        console.log(data);

        return;
    }
});

// This is to show the recipe in the modal when you click on the show more button on the recipes page

recipeCategoryContainer.addEventListener("click", (e) => {
    if (e.target.matches("button[data-show-recipe]")) {
        const target = e.target.closest("button[data-show-recipe]");
        const recipeId = target.getAttribute("data-recipe-id");
        const category = target.getAttribute("data-show-recipe");
        console.log(category);

        recipeContainer.innerHTML = "";
        recipeModal.show();
        recipeContainer.innerHTML = `<img class="spinner-image" src='../../../images/loader.gif' />`;

        getRecipe(recipeId, category).then((html) => {
            recipeContainer.innerHTML = html;
        });
    }
});

async function getRecipe(id, category) {
    const response = await fetch(`/app/recipe/${id}?category=${category}`);
    const html = await response.text();
    return html;
}

async function saveRecipe(id) {
    try {
        const response = await fetch(`/app/recipe-save/${id}`, {
            method: "post",
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        return Promise.reject(error);
    }
}

// Recipe Category render sets up the scroll listeners

async function recipeCategoryRender() {
    const response = await fetch("/app/recipe-categories");
    // const data = await response.json();
    // console.log(data);
    // send fetch request to end point and render the shown recipe's section once the html string is received
    // there will be a html string for error and success

    const html = await response.text();
    recipeCategoryContainer.innerHTML = html;
    const scrollerControls = document.querySelector(
        "#recipe-scroller-controls"
    );

    const scrollableList = document.querySelector("#recipe-category-list");

    const prevBtn = scrollerControls.querySelector("#recipe-scroll-previous");
    const nextBtn = scrollerControls.querySelector("#recipe-scroll-next");

    scrollableList.addEventListener("scroll", () => {
        console.log("scrolled");
    });

    nextBtn.addEventListener("click", () => {
        console.log("Goes forward");
        const element = scrollableList.querySelector(".recipe-card");
        const width = element.getBoundingClientRect().width;
        scrollableList.scrollBy({ top: 0, left: width, behavior: "smooth" });
    });

    prevBtn.addEventListener("click", () => {
        const element = scrollableList.querySelector(".recipe-card");
        const width = element.getBoundingClientRect().width;
        scrollableList.scrollBy({ top: 0, left: -width, behavior: "smooth" });
    });
}

recipeModalElement.addEventListener("hidden.bs.modal", (e) => {
    console.log("hidden");
});
