"use strict";
const organisationsRepositories = require('../repository');
const { AppError, BadRequestError } = require('../../../lib/api/errors');
module.exports = (req, res, next, organizationId) => {
    const value = +organizationId;
    if (!value) {
        throw new BadRequestError({
            organization_id: 'Organization ID must be a valid integer',
        });
    }
    organisationsRepositories.Main.getOrganizationModel().count({
        where: {
            id: value,
        },
    }).then((count) => {
        if (count === 0) {
            throw new AppError(`There is no organization with ID ${value}`, 404);
        }
        req['organization_id'] = value;
        next();
    }).catch(next);
};
