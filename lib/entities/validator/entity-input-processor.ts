import UserInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');
import EntityModelProvider = require('../service/entity-model-provider');

class EntityInputProcessor {
  public static processEntitySources(body: any): void {
    UserInputSanitizer.sanitizeInputWithModelProvider(
      body,
      EntityModelProvider.getEntitySourcesFieldsSet(),
    );
  }
}

export = EntityInputProcessor;
