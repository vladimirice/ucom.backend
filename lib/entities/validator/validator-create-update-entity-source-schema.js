const Joi = require('joi');

const CreateEntitySourceSchema = Joi.object().keys({
  source_url:     Joi.string(),
  source_type_id: Joi.string(),
  is_official:    Joi.boolean(),
});

const UpdateEntitySourceSchema = Joi.object().keys({
  id:             Joi.number().required(),
  source_url:     Joi.string(),
  source_type_id: Joi.string(),
  is_official:    Joi.boolean(),
});

module.exports = {
  CreateEntitySourceSchema: CreateEntitySourceSchema,
  UpdateEntitySourceSchema: UpdateEntitySourceSchema
};