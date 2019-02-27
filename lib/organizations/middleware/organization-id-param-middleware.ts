import { Response } from 'express';
import { orgDbModel } from '../models/organizations-model';

const { BadRequestError } = require('../../../lib/api/errors');

class OrgApiMiddleware {
  public static async orgIdentityParam(
    req: any,
    // @ts-ignore
    res: Response,
    next: Function,
    incomingValue: string,
  ) {
    const value = +incomingValue;
    try {
      if (!value) {
        throw new BadRequestError({
          organization_id: `Organization ID must be a valid integer, provided value is: ${incomingValue}`,
        });
      }

      const model = await orgDbModel.where('id', value).fetch();
      if (model === null) {
        throw new BadRequestError({
          organization_id: `There is no organization with ID: ${value}`,
        });
      }

      req.organization_id     = value;
      req.organization_model  = model;

      next();
    } catch (err) {
      next(err);
    }
  }
}

export = OrgApiMiddleware.orgIdentityParam;
