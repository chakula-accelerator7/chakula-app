// The routes here are for authentication and logging in the user

const express = require("express");

const { body, matchedData, validationResult } = require("express-validator");

const router = express.Router();

const passport = require("passport");
const jwt = require("jsonwebtoken");
const LocalStrategy = require("passport-local").Strategy;

const crypto = require("crypto");

const { promisify } = require("util");

const pbkdf2Promise = promisify(crypto.pbkdf2);

const User = require("../model/User");

//

// new User -- Email, password, or password less

router.get("/app/register", (req, res) => {
    const message = req.query.message;
    const validationError = req.query.errors;
    if (validationError) {
        const decoded = Buffer.from(validationError, "base64");

        return res.render("./app/register", {
            validationError: JSON.parse(decoded.toString()),
            message: false,
            selected: "register",
        });
    }

    if (message) {
        return res.render("./app/register", {
            validationError: false,
            message,
            selected: "register",
        });
    }
    res.render("./app/register", {
        validationError: false,
        message: false,
        selected: "register",
    });
});

router.get("/app/login", (req, res) => {
    const message = req.query.message;
    const validationError = req.query.errors;
    if (validationError) {
        const decoded = Buffer.from(validationError, "base64");

        return res.render("./app/signIn", {
            validationError: JSON.parse(decoded.toString()),
            message: false,
            selected: false,
        });
    }

    if (message) {
        return res.render("./app/signIn", {
            validationError: false,
            message,
            selected: false,
        });
    }

    res.render("./app/signIn", {
        validationError: false,
        message: false,
        selected: false,
    });
});

function validateAcctHolderName() {
    return body("accountHolderName")
        .trim()
        .escape()
        .isLength({ min: 4 })
        .withMessage(
            "The name that has been entered might be too short. Ensure that the name entered is more than 4 characters long"
        );
}

function validateEmailAddress() {
    return body("emailAddress")
        .trim()
        .escape()
        .isEmail()
        .normalizeEmail()
        .withMessage("The email address might not be a valid email address");
}

function validatePassword() {
    return body("password")
        .trim()
        .isLength({ min: 4 })
        .withMessage(
            "The password that has been entered is too short. Your password should be at least 8 characters long"
        );
}

function validationMiddleware(url) {
    return (req, res, next) => {
        const results = validationResult(req);
        if (results.isEmpty()) {
            req.validated = matchedData(req);

            return next();
        }
        const validationErrors = Buffer.from(
            JSON.stringify(results.mapped())
        ).toString("base64");

        return res.redirect(`${url}?errors=${validationErrors}`);
    };
}

const registerValidators = [
    validateAcctHolderName(),
    validateEmailAddress(),
    validatePassword(),
    validationMiddleware("/app/register"),
];

const loginValidators = [
    validateEmailAddress(),
    validatePassword(),
    validationMiddleware("/app/login"),
];

router.post(
    "/app/register-local",
    registerValidators,
    async function (req, res, next) {
        const { accountHolderName, emailAddress, password } = req.validated;

        try {
            const foundUser = await User.findOne({ emailAddress });
            console.log(emailAddress);
            if (foundUser) {
                return res.redirect(
                    `/app/register?message=${encodeURIComponent(
                        "There is already a user associated with this account"
                    )}`
                );
            }
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = await pbkdf2Promise(
                password,
                salt,
                100000,
                64,
                "sha512"
            );

            const protectedPassword = `${salt}:${hashedPassword.toString(
                "hex"
            )}`;
            const user = new User({
                accountHolderName,
                emailAddress,
                password: protectedPassword,
            });
            await user.save();
            res.redirect(
                `/app/login?message=${encodeURI(
                    "Account Created. Please enter your login details to continue"
                )}`
            );
        } catch (error) {
            next(error);
        }
    }
);

passport.use(
    "login-local",
    new LocalStrategy(
        { usernameField: "emailAddress", passwordField: "password" },
        async function (email, password, done) {
            try {
                const foundUser = await User.findOne({ emailAddress: email });
                if (!foundUser) {
                    return done(null, false, {
                        message: `No user associated with this account: ${email}`,
                    });
                }
                const [salt, hashedPassword] = foundUser.password.split(":");
                const enteredHashedPassword = await pbkdf2Promise(
                    password,
                    salt,
                    100000,
                    64,
                    "sha512"
                );
                console.log(
                    hashedPassword === enteredHashedPassword.toString("hex")
                );
                if (hashedPassword !== enteredHashedPassword.toString("hex")) {
                    return done(null, false, { message: `Incorrect password` });
                }
                return done(null, foundUser);
            } catch (error) {
                done(error);
            }
        }
    )
);

passport.serializeUser((user, cb) => {
    process.nextTick(function () {
        cb(null, {
            id: user._id,
            emailAddress: user.emailAddress,
            name: user.accountHolderName,
        });
    });
});

passport.deserializeUser((user, cb) => {
    process.nextTick(() => {
        return cb(null, user);
    });
});

router.post("/app/login-local", loginValidators, async (req, res, next) => {
    passport.authenticate("login-local", function (err, user, info) {
        if (err) {
            // This is an internal server error and there should ideally be a way to display a page for server side errors
            return next(err);
        }
        if (!user) {
            const { message } = info;
            return res.redirect(`/app/login?message=${message}`);
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            const jwtToken = jwt.sign(
                { id: user.id },
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: 864000,
                }
            );
            // this is where you store the token in the cookie
            res.cookie("jwt", jwtToken, { maxAge: 864000, httpOnly: true });
            return res.redirect("/app/entry");
        });
    })(req, res, next);
});

module.exports = router;
