import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { CheckManyObjectsOptionsDto, ObjectInterfaceRulesDto } from '../../interfaces/options-interfaces';

import CommonChecker = require('../common/common-checker');
import UosAccountsModelProvider = require('../../../lib/uos-accounts-properties/service/uos-accounts-model-provider');

const uosAccountsPropertiesInterfaceRules: ObjectInterfaceRulesDto = {
  staked_balance: {
    type: 'number',
    length: 0,
  },
  validity: {
    type: 'number',
    length: 0,
  },
  importance: {
    type: 'number',
    length: 0,
  },
  scaled_importance: {
    type: 'number',
    length: 0,
  },
  stake_rate: {
    type: 'number',
    length: 0,
  },
  scaled_stake_rate: {
    type: 'number',
    length: 0,
  },
  social_rate: {
    type: 'number',
    length: 0,
  },
  scaled_social_rate: {
    type: 'number',
    length: 0,
  },
  transfer_rate: {
    type: 'number',
    length: 0,
  },
  scaled_transfer_rate: {
    type: 'number',
    length: 0,
  },
  previous_cumulative_emission: {
    type: 'number',
    length: 0,
  },
  current_emission: {
    type: 'number',
    length: 0,
  },
  current_cumulative_emission: {
    type: 'number',
    length: 0,
  },
};

const uosAccountsProperties: CheckManyObjectsOptionsDto = {
  exactKeysAmount: true,
};

class UsersChecker {
  public static checkUosAccountsPropertiesStructure(model: UserModel) {
    const obj: any = {};
    for (const item of UosAccountsModelProvider.getFieldsToSelect()) {
      obj[item] = model[item];
    }

    CommonChecker.checkOneObjectInterface(
      obj,
      uosAccountsPropertiesInterfaceRules,
      uosAccountsProperties,
    );
  }
}

export = UsersChecker;
