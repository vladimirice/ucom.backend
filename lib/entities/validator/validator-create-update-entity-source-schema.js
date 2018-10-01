const Joi = require('joi');

const CreateOrUpdateEntitySourceSchema = Joi.object().keys({
  source_url:     Joi.string().min(2).max(255).required(),
  source_type_id: Joi.number().required(),
  is_official:    Joi.boolean(),
});


module.exports = {
  CreateOrUpdateEntitySourceSchema
};