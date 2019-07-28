"use strict";
const { BadRequestError } = require('../../../lib/api/errors');
const tagsRepository = require('../repository/tags-repository');
class TagApiMiddleware {
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Request} req
     * @param {Response} res
     * @param {Function} next
     * @param {string} incomingValue
     */
    static async tagIdentityParam(req, 
    // @ts-ignore
    res, next, incomingValue) {
        try {
            if (!incomingValue) {
                throw new BadRequestError({
                    tag_title: `Tag title must be a valid string. Provided value: ${incomingValue}`,
                });
            }
            const dbTag = await tagsRepository.findOneByTitle(incomingValue.toLowerCase());
            if (dbTag === null) {
                throw new BadRequestError({
                    tag_title: `There is no tag with title: ${incomingValue}`,
                }, 404);
            }
            req.tag_identity = incomingValue.toLowerCase();
            req.db_tag = dbTag;
            next();
        }
        catch (error) {
            next(error);
        }
    }
}
module.exports = TagApiMiddleware;
