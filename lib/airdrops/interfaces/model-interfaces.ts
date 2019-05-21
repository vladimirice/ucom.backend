interface AirdropsUsersGithubRawItem {
  readonly id: number;
  readonly score: number;
  readonly amount: number;
}

interface IAirdrop {
  readonly id: number;
  readonly title: string;
  readonly status: number;
  readonly post_id: number;
  readonly conditions: IAirdropConditions;

  readonly started_at: any;
  readonly finished_at: any;

  readonly created_at: any;
  readonly updated_at: any;
}

interface IAirdropConditions {
  readonly auth_github: boolean,
  readonly auth_myself: boolean,
  readonly community_id_to_follow: number,
  readonly zero_score_incentive_tokens_amount: number,
  readonly source_table_name: string,
}

export  {
  AirdropsUsersGithubRawItem,
  IAirdrop,
  IAirdropConditions,
};
