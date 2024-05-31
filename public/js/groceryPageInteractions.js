console.log("I see you groceries page");

// Grocery Categories

const categoryContainer = document.querySelector("#grocery-categories-list");

const pantryItemsCard = document.querySelector("#pantry-items-card");

// Shopping list
const shoppingListToggler = document.querySelector("#shopping-list-toggle");
const shoppingListTogglerSearch = document.querySelector(
    "#shopping-list-toggle-search"
);
const shoppingList = document.querySelector("#shopping-list");
const shoppingListWrapper = document.querySelector("#shopping-list-wrapper");

// Grocery Search offcanvas
const grocerySearchCanvas = document.querySelector("#grocery-search-offcanvas");

const grocerySearchCanvasInstance = new bootstrap.Offcanvas(
    grocerySearchCanvas
);

const grocerySearchResultsWrapper = document.querySelector(
    "#grocery-search-result-wrapper"
);

// Shows the pantry items in the database and from the preselected pantry items by the user

const pantryItemListWrapper = pantryItemsCard.querySelector(
    "#pantry-items-list-wrapper"
);

let cardShown = false;

let shoppingListShown = false;

// shown Catrgory is the category currently in view
let shownCategory = null;

// Category target is the button that is clicked on
let categoryTarget = null;

// user products or db products

let productsShown = "user";

// what menu is revealed when you click on the reveal button

let revealedMenu = null;

// the button that is shown when you are switching between the pantry and the catalog

let shownButton = null;
let hiddenButton = null;
let shownList = null;
let hiddenList = null;

// this controls the menu switch between the pantry products and the database products

// There is a serious bug with this menu that I cant fix yet. I will get to it at some point later on but there is more work to be done on the application for now

pantryItemsCard.addEventListener("click", (e) => {
    if (e.target.matches("button[data-show-products]")) {
        console.log("clicked");
        const target = e.target.closest("button[data-show-products]");
        const listToShow = target.getAttribute("data-show-products");

        if (listToShow === "db") {
            const listItemToShow = pantryItemsCard.querySelector(
                "#db-grocery-list-wrapper"
            );
            const listToHide = pantryItemsCard.querySelector(
                "#user-grocery-list-wrapper"
            );
            const buttonToShow = pantryItemsCard.querySelector(
                "button[data-show-products='user']"
            );
            const removableText = pantryItemsCard.querySelector(
                "#pantry-category-heading .removable-text"
            );
            removableText.removeAttribute("data-hidden", "");

            listItemToShow.removeAttribute("data-hidden");
            listToHide.setAttribute("data-hidden", "");
            buttonToShow.removeAttribute("data-button-hidden");
            target.setAttribute("data-button-hidden", "");
            productsShown = "db";
            shownList = listItemToShow;
            hiddenList = listToHide;
            shownButton = buttonToShow;
            hiddenButton = target;
            console.log(productsShown);
            return;
        }

        if (listToShow === "user") {
            const listItemToShow = pantryItemsCard.querySelector(
                "#user-grocery-list-wrapper"
            );
            const listToHide = pantryItemsCard.querySelector(
                "#db-grocery-list-wrapper"
            );
            const buttonToShow = pantryItemsCard.querySelector(
                "button[data-show-products='db']"
            );
            const removableText = pantryItemsCard.querySelector(
                "#pantry-category-heading .removable-text"
            );
            removableText.setAttribute("data-hidden", "");
            listItemToShow.removeAttribute("data-hidden");
            listToHide.setAttribute("data-hidden", "");
            buttonToShow.removeAttribute("data-button-hidden");
            target.setAttribute("data-button-hidden", "");
            productsShown = "user";
            shownList = listItemToShow;
            hiddenList = listToHide;
            shownButton = buttonToShow;
            hiddenButton = target;
            console.log(productsShown);
            return;
        }
    }
});

// this to hide the pantry card on outside click

document.addEventListener("click", (e) => {
    const clickedParent = e.target.closest(`#pantry-items-card`);
    if (cardShown && clickedParent) {
        return;
    }
    if (cardShown && !clickedParent) {
        hideElement(pantryItemsCard);
        cardShown = false;
        shownCategory = null;
        productsShown = "user";
        categoryTarget.removeAttribute("data-current-selected-category");
        categoryTarget = null;
        // I think in this case for the grocery item menu i only need to set the revealed menu value to null
        revealedMenu = null;
        // hide the shown button if it exists, show the hidden button if it exists
        // if (shownList) {
        //     if (productsShown === "user") {
        //         shownList = hiddenList = shownButton = hiddenButton = null;
        //         return;
        //     }
        //     shownList.setAttribute("data-hidden", "");
        //     hiddenList.removeAttribute("data-hidden", "");
        //     shownButton.setAttribute("data-button-hidden", "");
        //     hiddenButton.removeAttribute("data-button-hidden");
        //     shownList = hiddenList = shownButton = hiddenButton = null;
        //     return;
        // }
    }
});

// This is to show and hide a pantry card whenever you click on either produce, dairy, etc...

categoryContainer.addEventListener("click", async (e) => {
    if (e.target.matches("button[data-category]")) {
        const target = e.target.closest("button[data-category]");
        const category = target.dataset.category;

        if (cardShown) {
            if (shownCategory && shownCategory !== category) {
                return;
            }
            hideElement(pantryItemsCard);
            cardShown = false;
            shownCategory = null;
            categoryTarget.removeAttribute("data-current-selected-category");
            categoryTarget = null;

            // if (shownList) {
            //     if (productsShown === "user") {
            //         shownList = hiddenList = shownButton = hiddenButton = null;
            //         return;
            //     }
            //     shownList.setAttribute("data-hidden", "");
            //     hiddenList.removeAttribute("data-hidden", "");
            //     shownButton.setAttribute("data-button-hidden", "");
            //     hiddenButton.removeAttribute("data-button-hidden");
            //     shownList = hiddenList = shownButton = hiddenButton = null;
            //     return;
            // }

            // productsShown = "user";
            return;
        }
        await pantryItemsRender(category);
        cardShown = true;
        shownCategory = category;
        categoryTarget = target;
        categoryTarget.setAttribute("data-current-selected-category", "");
        showElement(pantryItemsCard);
    }
});

async function pantryItemsRender(category) {
    const response = await fetch(`/app/groceries?category=${category}`);
    const data = await response.text();
    const heading = pantryItemsCard.querySelector("#pantry-category-heading");
    const allProductsButton = pantryItemsCard.querySelector(
        'button[data-show-products="db"]'
    );
    const categoryButton = categoryContainer.querySelector(
        `.btn-categories.${category}`
    );
    pantryItemListWrapper.innerHTML = data;
    heading.innerHTML = `${categoryButton.innerText} <span class="removable-text" data-hidden="" >CATALOGUE<span>`;
    allProductsButton.textContent = `All ${category}`;
}

pantryItemListWrapper.addEventListener("click", async (e) => {
    // Thsis is to show the menu on the pantry card when you click on any of the reveal buttons
    if (e.target.closest("button[data-menu-reveal]")) {
        console.log("Button reveals menu");

        const target = e.target.closest("button[data-menu-reveal]");
        const menuId = target.dataset.menuReveal;
        if (revealedMenu) {
            // if (revealedMenu === menuId) return;
            setGroceryItemMenuHidden();
            return;
        }
        const li = pantryItemListWrapper.querySelector(`#${menuId}`);
        const ul = li.querySelector(`.grocery-item-menu`);
        ul.setAttribute("data-category-menu-visible", "");
        revealedMenu = menuId;
        return;
    }

    if (revealedMenu && e.target.id === revealedMenu) {
        console.log("clicked outside while it was open");
        setGroceryItemMenuHidden();
    }

    // This handles searching for a grocery item

    if (e.target.closest("button[data-search-grocery-id]")) {
        const target = e.target.closest("button[data-search-grocery-id]");
        const groceryId = target.getAttribute("data-search-grocery-id");

        grocerySearchCanvasInstance.show();
        grocerySearchResultsWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><linearGradient id="a11"><stop offset="0" stop-color="#FF5123" stop-opacity="0"></stop><stop offset="1" stop-color="#FF5123"></stop></linearGradient><circle fill="none" stroke="url(#a11)" stroke-width="15" stroke-linecap="round" stroke-dasharray="0 44 0 44 0 44 0 44 0 360" cx="100" cy="100" r="70" transform-origin="center"><animateTransform type="rotate" attributeName="transform" calcMode="discrete" dur="2" values="360;324;288;252;216;180;144;108;72;36" repeatCount="indefinite"></animateTransform></circle></svg>`;
        try {
            const response = await fetch(
                `/app/scrape-price?groceryId=${groceryId}`
            );
            const html = await response.text();

            grocerySearchResultsWrapper.innerHTML = html;
        } catch (error) {
            console.log(error.message);
        } finally {
            setGroceryItemMenuHidden();
        }

        return;
    }

    // This is to add an item from the users pantry to the shopping list

    if (e.target.closest("button[data-pantry-add]")) {
        console.log("clicked");
        const target = e.target.closest("button[data-pantry-add]");
        const groceryItemId = target.getAttribute("data-pantry-add");
        const parentLi = target.closest(".grocery-item");
        parentLi.setAttribute("data-saving-item", "");
        const notification = parentLi.querySelector(".notification-text");
        try {
            const response = await fetch("/app/groceries", {
                method: "post",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ groceryItemId }),
            });
            const data = await response.json();

            // This is temporary, will do proper error handling pn second rev

            if (response.ok) {
                notification.innerHTML = `${data.message} <i class="fa-solid fa-check"></i>`;
            } else if (!response.ok) {
                notification.innerHTML = `${data.message}  <i class="fa-solid fa-circle-xmark"></i>`;
            }
        } catch (error) {
        } finally {
            await new Promise((res) => setTimeout(res, 1200));
            await pantryItemsRender(shownCategory);
            if (shownList) {
                if (productsShown === "user") {
                    shownList = hiddenList = shownButton = hiddenButton = null;
                    return;
                }
                shownList.setAttribute("data-hidden", "");
                hiddenList.removeAttribute("data-hidden", "");
                shownButton.setAttribute("data-button-hidden", "");
                hiddenButton.removeAttribute("data-button-hidden");
                shownList = hiddenList = shownButton = hiddenButton = null;
                return;
            }
        }
    }

    // This is to add items to shopping list from the users pantry

    if (e.target.closest("button[data-shopping-list-add]")) {
        const target = e.target.closest(`button[data-shopping-list-add]`);
        const groceryItemId = target.getAttribute("data-shopping-list-add");
        const parentLi = target.closest(".grocery-item");
        const notification = parentLi.querySelector(".notification-text");
        parentLi.setAttribute("data-saving-item", "");

        try {
            const response = await fetch("/app/shopping-list?from=pantry", {
                method: "post",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ groceryItemId }),
            });
            const { message } = await response.json();
            if (response.ok) {
                notification.innerHTML = `${message} <i class="fa-solid fa-check"></i>`;
                notification.setAttribute("data-notification", "success");
            } else if (!response.ok) {
                notification.innerHTML = `${message}  <i class="fa-solid fa-circle-xmark"></i>`;
                notification.setAttribute("data-notification", "error");
            }
        } catch (e) {
        } finally {
            await new Promise((res) => setTimeout(res, 1200));
            await pantryItemsRender(shownCategory);
            setGroceryItemMenuHidden();
            if (shownList) {
                if (productsShown === "user") {
                    shownList = hiddenList = shownButton = hiddenButton = null;
                    return;
                }
                shownList.setAttribute("data-hidden", "");
                hiddenList.removeAttribute("data-hidden", "");
                shownButton.setAttribute("data-button-hidden", "");
                hiddenButton.removeAttribute("data-button-hidden");
                shownList = hiddenList = shownButton = hiddenButton = null;
                return;
            }
        }
    }

    // This is to delete an item from the users pantry items

    if (e.target.closest("button[data-delete-pantry-item]")) {
        console.log("click to delete");
        setGroceryItemMenuHidden();
        const target = e.target.closest("button[data-delete-pantry-item]");
        const groceryItemId = target.getAttribute("data-delete-pantry-item");
        const parentLi = target.closest(".grocery-item");
        const notification = parentLi.querySelector(".notification-text");
        parentLi.setAttribute("data-deleting-item", "");

        try {
            const response = await fetch("/app/groceries", {
                method: "DELETE",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ groceryItemId }),
            });

            const { message } = await response.json();

            if (response.ok) {
                notification.innerHTML = `${message} <i class="fa-solid fa-check"></i>`;
                notification.setAttribute("data-notification", "success");
            } else if (!response.ok) {
                notification.innerHTML = `${message} <i class="fa-solid fa-check"></i>`;
                notification.setAttribute("data-notification", "error");
            }
        } catch (e) {
        } finally {
            await new Promise((res) => setTimeout(res, 1200));
            await pantryItemsRender(shownCategory);
            if (shownList) {
                if (productsShown === "user") {
                    shownList = hiddenList = shownButton = hiddenButton = null;
                    return;
                }
                shownList.setAttribute("data-hidden", "");
                hiddenList.removeAttribute("data-hidden", "");
                shownButton.setAttribute("data-button-hidden", "");
                hiddenButton.removeAttribute("data-button-hidden");
                shownList = hiddenList = shownButton = hiddenButton = null;
                return;
            }
        }
    }
});

let addingProductToList = false;

grocerySearchResultsWrapper.addEventListener("click", async (e) => {
    if (e.target.closest("button[data-add-shopping-list-from-search]")) {
        console.log("clicked");
        const target = e.target.closest(
            "button[data-add-shopping-list-from-search]"
        );
        const [productName, productPrice] = target
            .getAttribute("data-add-shopping-list-from-search")
            .split(":");
        const shoppingItemProps = {
            productName,
            productPrice,
        };
        if (addingProductToList) {
            return;
        }
        try {
            addingProductToList = true;
            const response = await fetch("/app/shopping-list?from=search", {
                method: "post",
                body: JSON.stringify(shoppingItemProps),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            // Manually updating the shopping list after adding an item to it
            const html = await shoppingListRender();
            shoppingList.innerHTML = html;
            console.log(data);
        } catch (error) {
            console.log(error);
        } finally {
            addingProductToList = false;
        }
        return;
    }
});

shoppingListToggler.addEventListener("click", toggleShoppingList);
shoppingListTogglerSearch.addEventListener("click", toggleShoppingList);

async function toggleShoppingList(e) {
    // if the shopping list is visible ignore any click events
    if (shoppingListShown) return;
    const html = await shoppingListRender();
    shoppingList.innerHTML = html;
    showElement(shoppingListWrapper);
    shoppingListShown = true;
}

shoppingListWrapper.addEventListener("click", (e) => {
    if (e.target.closest("button#shopping-list-close-button")) {
        console.log("Closing shopping list");
        hideElement(shoppingListWrapper);
        shoppingListShown = false;
    }
});

async function shoppingListRender() {
    const response = await fetch("/app/shopping-list");
    const html = await response.text();
    return html;
}

// Case 1 -- no card shown
// In all cases run the fetch call first.
// if a card is not shown then insert elements first and then animate in.
// if a card is shown then animate away, remove elements and then animate back in.

function setGroceryItemMenuHidden() {
    const li = pantryItemListWrapper.querySelector(`#${revealedMenu}`);
    const ul = li.querySelector(`.grocery-item-menu`);
    ul.removeAttribute("data-category-menu-visible", "");
    revealedMenu = null;
    return;
}

function showElement(element) {
    element.removeAttribute("data-hidden");
    element.removeAttribute("data-hiding");

    element.setAttribute("data-shown", "");
    element.setAttribute("data-showing", "");
}

function hideElement(element) {
    element.removeAttribute("data-showing");
    element.setAttribute("data-hiding", "");
    element.addEventListener(
        "animationend",
        () => {
            element.removeAttribute("data-shown");
            element.setAttribute("data-hidden", "");
        },
        { once: true }
    );
}
