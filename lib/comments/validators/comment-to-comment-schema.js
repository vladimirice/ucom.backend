const Joi = require('joi');

const CreateCommentToCommentSchema = Joi.object().keys({
  description: Joi.string().required(),
});

module.exports = {
  CreateCommentToCommentSchema
};