console.log("I see you form scroll");

const surveyForm = document.querySelector("#form-entry-survey");
// const submitButton =

const questionGroups = surveyForm.querySelectorAll(".question-group");

const attributeMap = Array.from(questionGroups).map((elem) => {
    return elem.getAttribute("data-group");
});

console.log(attributeMap);

const nextGroupBtn = surveyForm.querySelector("#next-group");
const previousGroupBtn = surveyForm.querySelector("#previous-group");
const submitBtn = surveyForm.querySelector("#survey-submit-btn");

// the only group that has client side validation is the group with input fields
// Only checking for the existence of empty input fields

const bioGroup = surveyForm.querySelector(`.question-group[data-group="bio"]`);
const bioInpElements = bioGroup.querySelectorAll("input");
const bioGender = bioGroup.querySelector("select");

let currentIndex = 0;

nextGroupBtn.addEventListener("click", (e) => {
    // This will only go forward
    if (!validateGroup(currentIndex)) return;

    previousGroupBtn.disabled = false;

    hideGroup(currentIndex);

    if (currentIndex + 1 >= attributeMap.length - 1) {
        currentIndex++;
        showGroup(currentIndex);
        submitBtn.disabled = false;
        nextGroupBtn.disabled = true;
    } else {
        currentIndex++;
        showGroup(currentIndex);
    }
    // currentIndex++

    // currentIndex++;
});

function validateGroup(index) {
    const shown = attributeMap[index];

    // For this current version, only the input fields need to be run through the validator

    if (shown === "bio") {
        const emptyFields = Array.from(bioInpElements).filter(
            (input) => !input.value.trim()
        );

        if (emptyFields.length) {
            bioGroup.setAttribute("data-error-shown", "");
            for (let input of emptyFields) {
                input.setAttribute("data-error", true);
            }
            console.log(bioGender.value);
            console.log("Has unfilled inputs");
            return false;
        }
        bioGroup.removeAttribute("data-error-shown");
        bioInpElements.forEach((input) =>
            input.setAttribute("data-error", false)
        );
    }

    return true;

    // console.log(`Validating ${shown}`);
}

function hideGroup(index) {
    const element = selectElement(index);
    element.setAttribute("data-currently-shown", false);
}

function showGroup(index) {
    const element = selectElement(index);

    element.setAttribute("data-currently-shown", true);
}

function selectElement(index) {
    const element = surveyForm.querySelector(
        `.question-group[data-group="${attributeMap[index]}"]`
    );
    return element;
}

previousGroupBtn.addEventListener("click", (e) => {
    // currentIndex--;
    nextGroupBtn.disabled = false;
    submitBtn.disabled = true;
    hideGroup(currentIndex);

    if (currentIndex - 1 <= 0) {
        currentIndex--;
        showGroup(currentIndex);
        previousGroupBtn.disabled = true;
    } else {
        currentIndex--;
        showGroup(currentIndex);
    }
});

surveyForm.addEventListener("focusin", (e) => {
    // This is to remove the focus styles whenever you want to correct any errors that you might have made
    if (e.target.matches("input")) {
        e.target.setAttribute("data-error", false);
        return;
    }
});
