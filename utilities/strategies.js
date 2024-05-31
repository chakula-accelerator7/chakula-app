const User = require("../model/User");

const JWTStrategy = require("passport-jwt").Strategy;

require("dotenv").config();

const jwtStrategy = new JWTStrategy(
    {
        jwtFromRequest: (req) => {
            if (req && req.cookies) {
                const jwtToken = req.cookies["jwt"];
                return jwtToken;
            }
            return false;
        },
        secretOrKey: process.env.ACCESS_TOKEN_SECRET,
    },
    async function (payload, cb) {
        try {
            const user = await User.findById(payload.id);
            // this is likely where you want to set up the access token logic
            if (user) {
                return cb(null, user);
            } else {
                return cb(null, false);
            }
        } catch (error) {
            return cb(error);
        }
    }
);

module.exports = { jwtStrategy };
