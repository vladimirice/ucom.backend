interface UosAccountsResponseDto {
  readonly limit:       number;
  readonly lower_bound: number;
  readonly total:       number;
  readonly accounts:    UosAccountPropertiesDto[];
}

interface UosAccountPropertiesDto {
  readonly name: string;
  readonly values: {
    readonly staked_balance:                string;
    readonly validity:                      string;

    readonly importance:                    string;
    readonly scaled_importance:             string;

    readonly stake_rate:                    string;
    readonly scaled_stake_rate:             string;

    readonly social_rate:                   string;
    readonly scaled_social_rate:            string;

    readonly transfer_rate:                 string;
    readonly scaled_transfer_rate:          string;

    readonly previous_cumulative_emission:  string;
    readonly current_emission:              string;
    readonly current_cumulative_emission:   string;
    // previous_cumulative_emission + current_emission = current_cumulative_emission
  };
}

export {
  UosAccountsResponseDto,
  UosAccountPropertiesDto,
};
