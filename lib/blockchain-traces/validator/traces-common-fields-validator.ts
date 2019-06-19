/* eslint-disable newline-per-chained-call */
import { injectable } from 'inversify';
import 'reflect-metadata';

const joi = require('joi');

@injectable()
class TracesCommonFieldsValidator {
  // TODO - common validator
  private schema = {
    account_name:         joi.string().min(1).max(255).required().label('Account name'),
    public_key:           joi.string().min(1).max(255).required().label('Public key'),
    sign:                 joi.string().min(1).max(255).required().label('Sign'),
    brainkey:             joi.string().min(1).max(255).required().label('Brainkey'),
    is_tracking_allowed:  joi.boolean().label('is_tracking_allowed').default(false),
  };

  public validateOneTrace(transaction: any) {
    return joi.validate(transaction, this.schema, {
      abortEarly: false,
    });
  }
}

export  = TracesCommonFieldsValidator;
