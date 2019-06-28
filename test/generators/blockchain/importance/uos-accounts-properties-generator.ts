import {
  UosAccountPropertiesDto,
} from '../../../../lib/uos-accounts-properties/interfaces/model-interfaces';

class UosAccountsPropertiesGenerator {
  public static getProcessedSampleDataAsExpectedSet(userVlad, userJane, userPetr, userRokky) {
    const uosAccountsPropertiesSampleData = this.getProcessedSampleData(userVlad, userJane, userPetr, userRokky);

    const accountNameToUserId = {
      [userVlad.account_name]: userVlad.id,
      [userJane.account_name]: userJane.id,
      [userPetr.account_name]: userPetr.id,
      [userRokky.account_name]: userRokky.id,
    };

    const expectedSet: any = {};
    for (const item of uosAccountsPropertiesSampleData) {
      const key = accountNameToUserId[item.name];

      if (!key) {
        continue;
      }

      expectedSet[key] = item.values;
    }

    return expectedSet;
  }

  public static getProcessedSampleData(userVlad, userJane, userPetr, userRokky) {
    const sampleData = UosAccountsPropertiesGenerator.getSampleProperties(
      userVlad.account_name,
      userJane.account_name,
      userPetr.account_name,
      userRokky.account_name,
    );

    for (const sampleItem of sampleData) {
      for (const field in sampleItem.values) {
        if (!sampleItem.values.hasOwnProperty(field)) {
          continue;
        }

        sampleItem.values[field] = +sampleItem.values[field];
      }
    }

    return sampleData;
  }

  public static getSampleProperties(
    firstUserAccountName: string,
    secondUserAccountName: string,
    thirdUserAccountName: string,
    forthUserAccountName: string,
  ): UosAccountPropertiesDto[] {
    return  [
      {
        name: firstUserAccountName,
        values: {
          staked_balance: '20000',
          validity: '0.9817528347',

          importance: '0.0013104491',
          scaled_importance: '0.5058333526',

          stake_rate: '0.0000000098',
          scaled_stake_rate: '0.0000037828',

          social_rate: '0.0131044128',
          scaled_social_rate: '5.0583033408',

          transfer_rate: '0',
          scaled_transfer_rate: '0',

          previous_cumulative_emission: '46.641',
          current_emission: '0.124',
          current_cumulative_emission: '46.765',
        },
      },
      {
        name: secondUserAccountName,
        values: {
          staked_balance: '20620000',
          validity: '0.0002908737',
          social_rate: '0.014655688',
          stake_rate: '0.0000101219',
          importance: '0.0014736663',
          scaled_social_rate: '5.657095568',
          transfer_rate: '0',
          scaled_transfer_rate: '0',
          scaled_stake_rate: '0.0039070534',
          scaled_importance: '0.5688351918',
          previous_cumulative_emission: '47.6787',
          current_emission: '0.1395',
          current_cumulative_emission: '47.8182',
        },
      },
      {
        name: thirdUserAccountName,
        values: {
          staked_balance: '20000',
          validity: '0.0000000098',
          stake_rate: '0.0000000098',
          importance: '0.0000000078',
          social_rate: '0',
          scaled_social_rate: '0',
          transfer_rate: '0',
          scaled_transfer_rate: '0',
          scaled_stake_rate: '0.0000037828',
          scaled_importance: '0.0000030108',
          current_emission: '0',
          previous_cumulative_emission: '0',
          current_cumulative_emission: '0',
        },
      },
      {
        name: forthUserAccountName,
        values: {
          staked_balance: '20000',
          validity: '0.0000000098',
          stake_rate: '0.0000000098',
          importance: '0.0000000078',
          social_rate: '0',
          scaled_social_rate: '0',
          transfer_rate: '0',
          scaled_transfer_rate: '0',
          scaled_stake_rate: '0.0000037828',
          scaled_importance: '0.0000030108',
          current_emission: '0',
          previous_cumulative_emission: '0',
          current_cumulative_emission: '0',
        },
      },
      {
        name: 'notexistatall',
        values: {
          staked_balance: '20000',
          validity: '0.0000000098',
          stake_rate: '0.0000000098',
          importance: '0.0000000078',
          social_rate: '0',
          scaled_social_rate: '0',
          transfer_rate: '0',
          scaled_transfer_rate: '0',
          scaled_stake_rate: '0.0000037828',
          scaled_importance: '0.0000030108',
          current_emission: '0',
          previous_cumulative_emission: '0',
          current_cumulative_emission: '0',
        },
      },
    ];
  }
}

export = UosAccountsPropertiesGenerator;
