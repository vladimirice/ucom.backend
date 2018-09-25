const UsersActivityRepository = require('../../users/repository').Activity;

class OrganizationActivity {
  static async processNewOrganization(data, transaction) {
    // TODO create new activity record
    // Push to queue

    await UsersActivityRepository.createNewActivity(data, transaction);
  }
}

module.exports = OrganizationActivity;