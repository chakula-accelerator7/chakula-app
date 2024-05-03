const express = require("express");

const router = express.Router();

router.get("/app/register", (req, res) => {
    res.render("./app/register");
});

router.get("/app/login", (req, res) => {
    res.send("Sign in to your account");
});

module.exports = { appRouter: router };
