const menuBtn = document.querySelector("#nav-menu-btn");

const menu = document.querySelector("#nav-menu");

menuBtn.addEventListener("click", (e) => {
    const menuStatus = menu.getAttribute("data-visible");
    if (menuStatus === "false") {
        menuBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        menu.setAttribute("data-visible", "true");
        return;
    }
    menuBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
    menu.setAttribute("data-visible", "false");
});
