const { OpenAI } = require("openai");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
});

async function spoonacularResponse(query) {
    const url = `https://api.spoonacular.com/recipes/complexSearch?${new URLSearchParams(
        {
            number: 1,
            maxServings: 1,
            addRecipeInformation: true,
            addRecipeInstructions: true,
            addRecipeNutrition: true,
            ...query,
        }
    )}`;

    const response = await fetch(url, {
        headers: {
            "x-api-key": process.env.SPOONACULAR_API_KEY,
        },
    });

    const data = await response.json();
    return data;
    // if no meal type using selected pantry items were found. A few suggestions have been presented instead//
}

const recipeListFormat = [
    {
        ingredientList: ["List of ingredients used in preparing the recipe"],
        pantryIngredientsUsed: [
            "List of names of all pantry items from the the prompt that are being used in this particular recipe",
        ],
        unlistedIngredients: [
            "List of names of all pantry items not included in the prompt but are being used in this particular recipe",
        ],
        preparationInstructions: [
            "List of instructions ordered by steps with no numbering in front of the instruction",
        ],
        recipeName: "name of recipe",
        macronutrientInfo: {
            calories: "Number in kcals",
            protein: "Amount in grams",
            fat: "Amount in grams",
            carbohydrate: "Amount in grams",
        },
        preparationTime: "Amount in minutes",
        promptToGenerateImage:
            "The best possible prompt to generate the exact image for this recipe using dall-e",
    },
];

async function completions(prompt) {
    console.log(prompt);
    try {
        const completions = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Generate 3 healthy recipes based on the pantry items and calorie allowance given and display the nutritional information afterwards. Take dietary preferences into account. If the nutritional information is a range present the upper limit of the range. Include specific ingredient quantities for example 2 slices of bread. All numeric values should always be presented as a number. For example 270 instead of 270kcal, 35 instead of 35 minutes. Use as many of the pantry items in the recipes as possible. It is absolutely mandatory that the output shall always be in this exact shape ${JSON.stringify(
                        recipeListFormat
                    )} where each recipe is an object that has the properties included. It is absolutely mandatory that there is no additional text above or below the json object presented. This object is going to be directly parsed and fed into another source, and so the response should be a stringified javascript object in the provided shape`,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "gpt-3.5-turbo",
        });

        const response = completions.choices[0].message.content;

        const recipeList = JSON.parse(response);

        console.log(typeof recipeList);

        if (typeof recipeList !== "object" || !Array.isArray(recipeList)) {
            throw new Error(
                "There has been an error generating recipes. Please try again in a few minutes"
            );
        }

        const prompts = recipeList.map(
            (recipe) => recipe.promptToGenerateImage
        );

        const images = await Promise.all(
            prompts.map((text) => {
                return createImage(text);
            })
        );

        const finalRecipeList = recipeList.map((recipe, index) => {
            delete recipe.promptToGenerateImage;
            const b64Image = images[index].data[0].b64_json;
            const imageStrBuffer = Buffer.from(
                images[index].data[0].b64_json,
                "base64"
            );

            return {
                ...recipe,
                imageData: b64Image,
                imageStrBuffer,
                macronutrientInfo: {
                    ...recipe.macronutrientInfo,
                    calories: parseInt(recipe.macronutrientInfo.calories),
                    protein: parseFloat(recipe.macronutrientInfo.protein),
                    carbohydrate: parseFloat(
                        recipe.macronutrientInfo.carbohydrate
                    ),
                    fat: parseFloat(recipe.macronutrientInfo.fat),
                },
            };
        });

        return finalRecipeList;
    } catch (error) {
        return Promise.reject(
            "There has been an error generating recipes. Please try again in a few minutes"
        );
    }
}

// testCompletions

function createImage(prompt) {
    return openai.images.generate({
        n: 1,
        model: "dall-e-3",
        quality: "standard",
        size: "1024x1024",
        response_format: "b64_json",
        prompt,
    });
}

module.exports = { spoonacularResponse, completions };
