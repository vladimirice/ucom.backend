interface OneUserAirdropDto  {
  airdrop_id: number,
  user_id: number | null, // null only if airdrop_status = new
  github_score: number,
  airdrop_status: number,
  conditions: OneUserAirdropConditions,
  tokens: OneUserAirdropToken[],
}

interface OneUserAirdropConditions {
  auth_github: boolean;
  auth_myself: boolean;
  following_devExchange: boolean;
}

interface OneUserAirdropFilter {
  airdrop_id: number;
}

interface OneUserAirdropToken {
  amount_claim: number;
  symbol: string;
}

export {
  OneUserAirdropDto,
  OneUserAirdropFilter,
};
