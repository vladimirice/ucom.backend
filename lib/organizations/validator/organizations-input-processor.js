"use strict";
const UserInputSanitizer = require("../../api/sanitizers/user-input-sanitizer");
const OrganizationsModelProvider = require("../service/organizations-model-provider");
class OrganizationsInputProcessor {
    static process(body) {
        UserInputSanitizer.sanitizeInputWithModelProvider(body, OrganizationsModelProvider.getOrganizationsRelatedFieldsSet());
    }
}
module.exports = OrganizationsInputProcessor;
