export {};

const passport    = require('passport');
const passportJWT = require('passport-jwt');
const models = require('../../models');
const config = require('config');

const extractJWT = passportJWT.ExtractJwt;
const jWTStrategy   = passportJWT.Strategy;

passport.use(new jWTStrategy({
  jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey   : config.get('auth').jwt_secret_key,
},
                             (jwtPayload, cb) => {
                               return models.Users.findOne({ where: { id: jwtPayload.id } })
      .then((user) => {
        return cb(null, user);
      })
      .catch((err) => {
        return cb(err);
      });
                             },
));
