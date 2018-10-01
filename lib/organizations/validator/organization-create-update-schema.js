const Joi = require('joi');

const CreateOrUpdateOrganizationSchema = Joi.object().keys({
  title: Joi.string().min(2).max(255).required(),
  nickname: Joi.string().min(2).max(255).required(),

  avatar_filename: Joi.string().min(2).max(255).allow(''),
  currency_to_show: Joi.string().min(2).max(255).allow(''),
  powered_by: Joi.string().max(255).allow(''),
  about: Joi.string().max(10240).allow(''),
  email: Joi.string().email().allow(''),
  phone_number: Joi.string().max(255).allow(''),

  country: Joi.string().max(255).allow(''),
  city: Joi.string().max(255).allow(''),
  address: Joi.string().max(255).allow(''),
  personal_website_url: Joi.string().uri().allow(''),
  users_team: Joi.array(),
  entity_sources: Joi.array(),
});


module.exports = {
  CreateOrUpdateOrganizationSchema
};