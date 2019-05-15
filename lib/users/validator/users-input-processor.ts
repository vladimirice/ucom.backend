import { UsersUpdatingSchema } from '../../validator/users-validator';
import { JoiBadRequestError } from '../../api/errors';

import UserInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');
import UsersModelProvider = require('../users-model-provider');

const joi = require('joi');

class UsersInputProcessor {
  public static processWithValidation(body: any): any {
    this.process(body);

    return this.getValidated(body);
  }

  private static getValidated(body: any): any {
    const { error, value:requestData } = joi.validate(body, UsersUpdatingSchema, {
      allowUnknown: true,
      stripUnknown: true,
      abortEarly:   false,
    });

    if (error) {
      throw new JoiBadRequestError(error);
    }

    return requestData;
  }

  private static process(body: any): void {
    UserInputSanitizer.sanitizeInputWithModelProvider(body, UsersModelProvider.getUsersRelatedFieldsSet());
  }
}

export = UsersInputProcessor;
