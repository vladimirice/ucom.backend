const Joi = require('joi');

const CreateOrUpdateOrganizationSchema = Joi.object().keys({
  title: Joi.string().min(2).max(255).required(),
  nickname: Joi.string().min(2).max(255).required(),

  avatar_filename: Joi.string().min(2).max(255),
  currency_to_show: Joi.string().min(2).max(255),
  powered_by: Joi.string().max(255),
  about: Joi.string().max(10240),
  email: Joi.string().email(),
  phone_number: Joi.string().max(255),

  country: Joi.string().max(255),
  city: Joi.string().max(255),
  address: Joi.string().max(255),
  personal_website_url: Joi.string().uri(),
});


module.exports = {
  CreateOrUpdateOrganizationSchema
};