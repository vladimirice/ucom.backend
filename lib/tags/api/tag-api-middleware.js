"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    static tagIdentityParam(req, 
    // @ts-ignore
    res, next, incomingValue) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!incomingValue) {
                    throw new BadRequestError({
                        tag_title: `Tag title must be a valid string. Provided value: ${incomingValue}`,
                    });
                }
                const dbTag = yield tagsRepository.findOneByTitle(incomingValue.toLowerCase());
                if (dbTag === null) {
                    throw new BadRequestError({
                        tag_title: `There is no tag with title: ${incomingValue}`,
                    }, 404);
                }
                req.tag_identity = incomingValue.toLowerCase();
                req.db_tag = dbTag;
                next();
            }
            catch (err) {
                next(err);
            }
        });
    }
}
module.exports = TagApiMiddleware;
