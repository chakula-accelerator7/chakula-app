console.log("I see you form scroll");

const surveyForm = document.querySelector("#form-entry-survey");

const questionGroups = surveyForm.querySelectorAll(".question-group");

const attributeMap = Array.from(questionGroups).map((elem) => {
    return elem.getAttribute("data-group");
});

console.log(attributeMap);

const nextGroupBtn = surveyForm.querySelector("#next-group");
const previousGroupBtn = surveyForm.querySelector("#previous-group");

let currentIndex = 0;

nextGroupBtn.addEventListener("click", (e) => {
    currentIndex++;
});

previousGroupBtn.addEventListener("click", (e) => {
    currentIndex--;
});

surveyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.submit();
});
