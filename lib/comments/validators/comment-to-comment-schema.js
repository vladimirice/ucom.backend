"use strict";
const joi = require('joi');
// tslint:disable-next-line:variable-name
const CreateCommentToCommentSchema = joi.object().keys({
    description: joi.string().required(),
    signed_transaction: joi.string(),
});
module.exports = {
    CreateCommentToCommentSchema,
};
