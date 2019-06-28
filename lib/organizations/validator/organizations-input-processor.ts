import UserInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');
import OrganizationsModelProvider = require('../service/organizations-model-provider');

class OrganizationsInputProcessor {
  public static process(body: any): void {
    UserInputSanitizer.sanitizeInputWithModelProvider(
      body,
      OrganizationsModelProvider.getOrganizationsRelatedFieldsSet(),
    );
  }
}

export = OrganizationsInputProcessor;
