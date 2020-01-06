"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require('passport');
const passportJWT = require('passport-jwt');
const config = require('config');
const models = require('../../models');
const extractJWT = passportJWT.ExtractJwt;
const jWTStrategy = passportJWT.Strategy;
// eslint-disable-next-line new-cap
passport.use(new jWTStrategy({
    jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.get('auth').jwt_secret_key,
}, (jwtPayload, cb) => models.Users.findOne({ where: { id: jwtPayload.id } })
    .then(user => cb(null, user))
    .catch(error => cb(error))));
