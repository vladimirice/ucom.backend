const joi = require('joi');

// tslint:disable-next-line:variable-name
const CreateEntitySourceSchema = joi.object().keys({
  source_url:     joi.string().allow(''),
  source_type_id: joi.string(),
  is_official:    joi.boolean(),
});

// tslint:disable-next-line
const UpdateEntitySourceSchema = joi.object().keys({
  id:             joi.number().required(),
  source_url:     joi.string().allow(''),
  source_type_id: joi.string(),
  is_official:    joi.boolean(),
});

export {
  CreateEntitySourceSchema,
  UpdateEntitySourceSchema,
};
