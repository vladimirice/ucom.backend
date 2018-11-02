const Joi = require('joi');

const UsersUpdatingSchema = Joi.object().keys({
  first_name:           Joi.string().min(2).max(255).allow(''),
  last_name:            Joi.string().min(2).max(255).allow(''),

  email:                Joi.string().min(2).max(255).allow(''),

  phone_number:         Joi.string().min(2).max(255).allow(''),

  birthday:             Joi.string().min(2).max(255).allow(''),
  about:                Joi.string().min(2).max(1024).allow(''),
  country:              Joi.string().min(2).max(255).allow(''),
  city:                 Joi.string().min(2).max(255).allow(''),
  address:              Joi.string().min(2).max(255).allow(''),
  mood_message:         Joi.string().min(2).max(255).allow(''),

  currency_to_show:     Joi.string().min(2).max(255).allow(''),
  first_currency:       Joi.string().min(2).max(255).allow(''),

  first_currency_year:  Joi.string().min(2).max(255).allow(''),
  personal_website_url: Joi.string().min(2).max(255).allow(''),
  is_tracking_allowed:  Joi.boolean().default(true),

  users_education:      Joi.array(),
  users_jobs:           Joi.array(),
  users_sources:        Joi.array(),
});

module.exports = {
  UsersUpdatingSchema
};
