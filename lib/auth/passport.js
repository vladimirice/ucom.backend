const passport    = require('passport');
const passportJWT = require("passport-jwt");
const models = require('../../models');
const config = require('config');

const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy   = passportJWT.Strategy;

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey   : config.get('auth').jwt_secret_key
  },
  function (jwtPayload, cb) {
    return models.Users.findOne({ where: {id: jwtPayload.id}})
      .then(user => {
        return cb(null, user);
      })
      .catch(err => {
        return cb(err);
      });
  }
));