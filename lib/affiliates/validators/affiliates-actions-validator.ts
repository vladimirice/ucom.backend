const joi = require('joi');
const { Interactions } = require('ucom-libs-wallet').Dictionary;

const allowedActions = [
  Interactions.referral(),
];

class AffiliatesActionsValidator {
  public static validateRegistrationReferral(req) {
    const schema = {
      offer_id:             joi.number().integer().min(1).required().label('Offer ID'),
      account_name_source:  joi.string().length(12).required().label('account_name_source'),
      action:               joi.string().min(1).max(255).allow(allowedActions).required().label('action'),
      signed_transaction:   joi.string().min(1).required().label('signed_transaction'),
    };

    return joi.validate(req, schema, {
      abortEarly: false,
    });
  }
}

export = AffiliatesActionsValidator;
