interface UosAccountsResponseDto {
  readonly limit: number;
  readonly lower_bound: number;
  readonly total: number;
  readonly accounts: UosAccountPropertiesDto[];
}

interface UosAccountPropertiesDto {
  readonly name: string;
  readonly values: {
    readonly importance:                  number;

    readonly staked_balance:              number;
    readonly validity:                    number;
    readonly social_rate:                 number;
    readonly stake_rate:                  number;
    readonly scaled_social_rate:          number;
    readonly scaled_transfer_rate:        number;
    readonly scaled_stake_rate:           number;
    readonly scaled_importance:           number;
    readonly prev_cumulative_emission:    number;
    readonly current_emission:            number;
    readonly current_cumulative_emission: number;
  };
}

export {
  UosAccountsResponseDto,
  UosAccountPropertiesDto,
};
