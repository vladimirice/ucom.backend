"use strict";
const organizations_model_1 = require("../models/organizations-model");
const { BadRequestError } = require('../../../lib/api/errors');
class OrgApiMiddleware {
    static async orgIdentityParam(req, 
    // @ts-ignore
    res, next, incomingValue) {
        const value = +incomingValue;
        try {
            if (!value) {
                throw new BadRequestError({
                    organization_id: `Organization ID must be a valid integer, provided value is: ${incomingValue}`,
                });
            }
            const model = await organizations_model_1.orgDbModel.where('id', value).fetch();
            if (model === null) {
                throw new BadRequestError({
                    organization_id: `There is no organization with ID: ${value}`,
                }, 404);
            }
            req.organization_id = value;
            req.organization_model = model;
            next();
        }
        catch (error) {
            next(error);
        }
    }
}
module.exports = OrgApiMiddleware.orgIdentityParam;
