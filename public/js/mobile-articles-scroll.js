const navButtons = document.querySelector(".nav-buttons");

const article = document.getElementById("article-about");

let highlighted = navButtons.querySelector(".highlighted");

navButtons.addEventListener("click", (e) => {
    if (!e.target.matches("button[data-scroll-into]")) {
        return;
    }

    if (!highlighted) {
        highlighted = e.target;
        highlighted.classList.add("highlighted");
    } else {
        highlighted.classList.remove("highlighted");
        highlighted = e.target;
        highlighted.classList.add("highlighted");
    }

    const sectionId = e.target.dataset.scrollInto;
    const section = article.querySelector(`#${sectionId}`);
    section.scrollIntoView({
        behavior: "smooth",
    });
});
