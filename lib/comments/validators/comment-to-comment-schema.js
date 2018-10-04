const Joi = require('joi');

const CreateCommentToCommentSchema = Joi.object().keys({
  description:        Joi.string().required(),
  signed_transaction: Joi.string()
});

module.exports = {
  CreateCommentToCommentSchema
};