const passport = require("passport");

function allowJwt(req, res, next) {
    passport.authenticate("jwt-strategy", (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            console.log(req.isAuthenticated());

            return res.status(401).json({
                message: "Access token expired or unathuorised access",
            });
        }
        req.id = user.id;
        return next();
    })(req, res);
}

module.exports = {
    protect(req, res, next) {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return next();
        }

        return res.redirect(
            `/app/login?message=${encodeURI("Please log in to continue")}`
        );
    },

    allowJwt,

    restrictID(req, res, next) {
        const loggedInId = req.user.id;
        const requestId = req.params.id;

        if (requestId !== loggedInId) {
            req.logOut((err) => {
                if (err) {
                    return next(err);
                }
                return res.redirect(
                    `/app/login?message=${encodeURI(
                        "Please log in as a registered user to continue"
                    )}`
                );
            });
        } else {
            next();
        }
    },
};
