const menuBtn = document.querySelector("#nav-menu-btn");

const menu = document.querySelector("#nav-menu");

menuBtn.addEventListener("click", (e) => {
    console.log(e.target);
    const target = e.target.closest("#nav-menu-btn");
    const menuShown = menu.getAttribute("data-menu-shown");
    console.log(menuShown);
    if (!menuShown || menuShown === "false") {
        console.log("Showing menu");
        target.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i>`;
        target.setAttribute("data-menu-state", "shown");
        menu.setAttribute("data-menu-shown", true);
    } else {
        target.innerHTML = `<i class="fa-solid fa-bars"></i>`;
        menu.removeAttribute("data-menu-shown");
        target.removeAttribute("data-menu-state");
    }
    // if (menuStatus === "false") {
    //     menuBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    //     menu.setAttribute("data-menu-shown", "true");
    //     return;
    // }
    // menuBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
    // menu.setAttribute("data-visible", "false");
});
