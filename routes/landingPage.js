const express = require("express");

const router = express.Router();

router.get("/landing", (req, res) => {
    res.render("./landing/home", { title: "Chakula - Home Page" });
});

router.get("/landing/about", (req, res) => {
    res.render("./landing/about", { title: "Welcome to Chakula - About Page" });
});

module.exports = { landingPage: router };
