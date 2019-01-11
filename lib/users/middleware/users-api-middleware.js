"use strict";
const usersRepository = require('../users-repository');
const { BadRequestError } = require('../../../lib/api/errors');
class UsersApiMiddleware {
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Request} req
     * @param {Response} res
     * @param {Function} next
     * @param {string} incomingValue
     */
    static async userIdentityParam(req, 
    // @ts-ignore
    res, next, incomingValue) {
        try {
            if (!incomingValue) {
                throw new BadRequestError({
                    user_param: 'User ID or account name must be provided',
                });
            }
            let user = null;
            if (incomingValue[0] !== '0' && +incomingValue) {
                user = await usersRepository.findOneByIdAsObject(+incomingValue);
                req.user_id = +incomingValue;
                req.user_object = user;
            }
            else {
                user = await usersRepository.findOneByAccountNameAsObject(incomingValue);
                req.user_id = user ? user.id : null;
                req.user_account_name = incomingValue;
                req.user_object = user;
            }
            if (user === null) {
                const msg = req.user_id ? `There is no user with such ID: ${req.user_id}`
                    : `There is no user with such account_name: ${req.user_account_name}`;
                throw new BadRequestError({ user_param: msg }, 404);
            }
            next();
        }
        catch (err) {
            next(err);
        }
    }
}
module.exports = UsersApiMiddleware;
