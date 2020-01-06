"use strict";
const errors_1 = require("../../api/errors");
const organization_create_update_schema_1 = require("./organization-create-update-schema");
const UserInputSanitizer = require("../../api/sanitizers/user-input-sanitizer");
const OrganizationsModelProvider = require("../service/organizations-model-provider");
const OrganizationsRepository = require("../repository/organizations-repository");
const AuthValidator = require("../../auth/validators");
const joi = require('joi');
class OrganizationsInputProcessor {
    static process(body) {
        UserInputSanitizer.sanitizeInputWithModelProvider(body, OrganizationsModelProvider.getOrganizationsRelatedFieldsSet());
    }
    static processCreation(req, currentUser) {
        return this.processUserRequest(req, currentUser, organization_create_update_schema_1.createOrganizationSchema);
    }
    static processUpdating(req, currentUser) {
        return this.processUserRequest(req, currentUser, organization_create_update_schema_1.updateOrganizationSchema);
    }
    static async processUserRequest(req, currentUser, joiSchema) {
        const body = this.getRequestBodyWithFilenames(req);
        const { error, value } = joi.validate(body, joiSchema, {
            allowUnknown: true,
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            throw new errors_1.BadRequestError(AuthValidator.formatErrorMessages(error.details));
        }
        this.makeEmptyStringUniqueFieldsNull(value);
        await this.checkUniqueFields(value, req.organization_id);
        value.user_id = currentUser.id;
        return value;
    }
    /**
     *
     * @param   {Object} values
     * @param   {number|null} organizationId
     * @return  {Promise<void>}
     * @private
     */
    static async checkUniqueFields(values, organizationId = null) {
        const uniqueFields = OrganizationsRepository.getOrganizationModel().getUniqueFields();
        const toFind = {};
        uniqueFields.forEach((field) => {
            if (values[field]) {
                toFind[field] = values[field];
            }
        });
        const existed = await OrganizationsRepository.findWithUniqueFields(toFind);
        const errors = [];
        for (const current of existed) {
            if (organizationId && current.id === organizationId) {
                // this is model itself
                continue;
            }
            uniqueFields.forEach((field) => {
                if (current[field] === toFind[field]) {
                    errors.push({
                        field,
                        message: 'This value is already occupied. You should try another one.',
                    });
                }
            });
        }
        if (errors.length > 0) {
            throw new errors_1.BadRequestError(errors);
        }
    }
    /**
     *
     * @param {Object} body
     * @private
     */
    static makeEmptyStringUniqueFieldsNull(body) {
        const uniqueFields = OrganizationsRepository.getOrganizationModel().getUniqueFields();
        uniqueFields.forEach((field) => {
            if (body[field] === '') {
                body[field] = null;
            }
        });
    }
    /**
     *
     * @param {Object} req
     * @private
     * @return {Object}
     */
    static getRequestBodyWithFilenames(req) {
        const { body } = req;
        // Lets change file
        const { files } = req;
        this.parseSourceFiles(files);
        // // noinspection OverlyComplexBooleanExpressionJS
        // if (files && files.avatar_filename && files.avatar_filename[0] && files.avatar_filename[0].filename) {
        //   body.avatar_filename = files.avatar_filename[0].filename;
        // } else if (body.avatar_filename) {
        //   delete body.avatar_filename;
        // }
        files.forEach((file) => {
            if (file.fieldname !== 'avatar_filename') {
                this.addSourceAvatarFilenameToBody(file, body);
            }
            else {
                body.avatar_filename = file.filename;
                body.avatar_filename_from_file = true;
            }
        });
        if (body.avatar_filename_from_file !== true) {
            delete body.avatar_filename;
        }
        return body;
    }
    static addSourceAvatarFilenameToBody(file, body) {
        const bodySources = body[file.modelSourceKey];
        if (!bodySources) {
            return;
        }
        const bodySource = bodySources[file.modelSourcePosition];
        if (!bodySource) {
            return;
        }
        bodySource.avatar_filename = file.filename;
        bodySource.avatar_filename_from_file = true; // in order to avoid avatar filename changing by only name - without file
    }
    static parseSourceFiles(files) {
        files.forEach((file) => {
            if (file.fieldname !== 'avatar_filename') {
                const sourceKey = file.filename.substr(0, file.filename.indexOf('-'));
                const sourcePosition = +file.filename.substring(this.getPosition(file.filename, '-', 1) + 1, this.getPosition(file.filename, '-', 2));
                file.modelSourceKey = sourceKey;
                file.modelSourcePosition = sourcePosition;
            }
        });
    }
    static getPosition(string, subString, index) {
        return string.split(subString, index).join(subString).length;
    }
}
module.exports = OrganizationsInputProcessor;
