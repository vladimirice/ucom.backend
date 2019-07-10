const joi = require('joi');

// tslint:disable-next-line:variable-name
const UsersUpdatingSchema = joi.object().keys({
  first_name:           joi.string().min(2).max(255).allow(''),
  last_name:            joi.string().min(2).max(255).allow(''),

  email:                joi.string().min(2).max(255).allow(''),

  phone_number:         joi.string().min(2).max(255).allow(''),

  birthday:             joi.string().min(2).max(255).allow(''),
  about:                joi.string().min(2).max(1024).allow(''),
  country:              joi.string().min(2).max(255).allow(''),
  city:                 joi.string().min(2).max(255).allow(''),
  address:              joi.string().min(2).max(255).allow(''),
  mood_message:         joi.string().min(2).max(255).allow(''),

  currency_to_show:     joi.string().min(2).max(255).allow(''),
  first_currency:       joi.string().min(2).max(255).allow(''),

  first_currency_year:  joi.string().min(2).max(255).allow(''),
  personal_website_url: joi.string().min(2).max(255).allow(''),
  is_tracking_allowed:  joi.boolean().default(true),
  signed_transaction:   joi.any(),

  users_education:      joi.array(),
  users_jobs:           joi.array(),
  users_sources:        joi.array(),
  entity_images:        joi.any(),
});

export {
  UsersUpdatingSchema,
};
