const pantry = document.querySelector("#pantry");
const checkBoxes = pantry.querySelectorAll('input[type="checkbox"]');
const pantrySubmitBtn = document.querySelector("#btn-submit-pantry-selection");

pantry.addEventListener("click", (e) => {
    if (!e.target.matches("label.pantry-label input")) {
        return;
    }
    // console.log("clicked");
    const pantryLabel = e.target.closest("label.pantry-label");
    // console.log(pantryLabel);

    pantryLabel.classList.toggle("selected");
});

pantry.addEventListener("change", (e) => {
    if (e.target.closest("label.pantry-label")) {
        const hasSelectedAnOption = Array.from(checkBoxes).some(
            (checkbox) => checkbox.checked
        );
        if (hasSelectedAnOption) {
            pantrySubmitBtn.disabled = false;
        } else if (!hasSelectedAnOption) {
            pantrySubmitBtn.disabled = true;
        }
    }
});
