import EntityImagesModelProvider = require('../../entity-images/service/entity-images-model-provider');

const joi = require('joi');

// tslint:disable-next-line:variable-name
const CreateOrUpdateOrganizationSchema = joi.object().keys({
  title: joi.string().min(2).max(255).required(),
  nickname: joi.string().min(2).max(255).required(),

  avatar_filename:      joi.string().min(2).max(255).allow(''),
  currency_to_show:     joi.string().min(2).max(255).allow(''),
  powered_by:           joi.string().max(255).allow(''),
  about:                joi.string().max(10240).allow(''),
  email:                joi.string().email().allow(''),
  phone_number:         joi.string().max(255).allow(''),

  country:              joi.string().max(255).allow(''),
  city:                 joi.string().max(255).allow(''),
  address:              joi.string().max(255).allow(''),
  personal_website_url: joi.string().uri().allow(''),

  users_team:           joi.array(),

  social_networks:      joi.array(),
  community_sources:    joi.array(),
  partnership_sources:  joi.array(),

  [EntityImagesModelProvider.entityImagesColumn()]:        joi.any(),
});

export {
  CreateOrUpdateOrganizationSchema,
};
