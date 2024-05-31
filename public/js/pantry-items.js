const pantry = document.querySelector("#pantry");

pantry.addEventListener("click", (e) => {
    if (!e.target.matches("label.pantry-label input")) {
        return;
    }
    // console.log("clicked");
    const pantryLabel = e.target.closest("label.pantry-label");
    // console.log(pantryLabel);

    pantryLabel.classList.toggle("selected");
});
