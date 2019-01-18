const passport = require('passport');

export = passport.authenticate('jwt', { session: false });
