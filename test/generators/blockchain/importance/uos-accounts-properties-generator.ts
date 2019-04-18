import {
  UosAccountPropertiesDto,
} from '../../../../lib/uos-accounts-properties/interfaces/model-interfaces';

class UosAccountsPropertiesGenerator {
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
