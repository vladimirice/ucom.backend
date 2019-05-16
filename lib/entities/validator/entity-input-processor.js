"use strict";
const UserInputSanitizer = require("../../api/sanitizers/user-input-sanitizer");
const EntityModelProvider = require("../service/entity-model-provider");
class EntityInputProcessor {
    static processManyEntitySources(manyEntities) {
        for (const entity of manyEntities) {
            this.processEntitySources(entity);
        }
    }
    static processEntitySources(body) {
        UserInputSanitizer.sanitizeInputWithModelProvider(body, EntityModelProvider.getEntitySourcesFieldsSet());
    }
}
module.exports = EntityInputProcessor;
