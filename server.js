const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");

const landingPage = require("./routes/landingPage");
const authRoute = require("./routes/auth");
const accountSetupRoute = require("./routes/accountSetup");
const recipesRoute = require("./routes/recipesRoute");
const groceriesRoute = require("./routes/groceriesRoute");
const expressSession = require("express-session");

const cookieParser = require("cookie-parser");

require("dotenv").config();
const port = process.env.PORT || 3700;

const MongoStore = require("connect-mongo");

app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    expressSession({
        secret: "3edr5tgfdcvfr456yhgfvbnmjkloiu76yhjmnbgf",
        cookie: {
            maxAge: 864000,
        },
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URL,
        }),
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(landingPage);
app.use(authRoute);
app.use(accountSetupRoute);
app.use(recipesRoute);
app.use(groceriesRoute);

app.get("/", (req, res) => {
    res.redirect("/landing");
});

mongoose
    .connect(process.env.MONGO_URL)
    .then(({ connection }) => {
        console.log(`Connected to ${connection.name}`);
        app.listen(port, () => {
            console.log("Listening ");
        });
    })
    .catch((error) => {
        console.log(error.message);
    });
