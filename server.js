const express = require("express");
const app = express();
const path = require("path");
const { landingPage } = require("./routes/landingPage");
const { appRouter } = require("./routes/app");
require("dotenv").config();
const port = process.env.PORT || 3000;

app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(landingPage);

app.use(appRouter);

app.get("/", (req, res) => {
    res.redirect("/landing");
});

app.listen(port, () => {
    console.log("Listening ");
});
