export const graphqlUsersQueryPart = `
    many_users(filters: users_filtering, order_by: String!, page: Int!, per_page: Int!): users!
    
    one_user_airdrop(filters: one_user_airdrop_state_filtering): JSON
    one_user(filters: one_user_filtering): JSON
    one_user_trusted_by(filters: one_user_filtering, order_by: String!, page: Int!, per_page: Int!): users!
    one_user_referrals(filters: one_user_filtering, order_by: String!, page: Int!, per_page: Int!): users!
    
    one_user_activity(filters: one_user_activity_filtering, order_by: String!, page: Int!, per_page: Int!): users!

    one_user_follows_organizations(filters: one_user_filtering!, order_by: String!, page: Int!, per_page: Int!): organizations!
`;

export const graphqlUsersTypes = `
  type User {
    id: Int!
    account_name: String!
    first_name: String
    last_name: String
    nickname: String
    avatar_filename: String
    current_rate: Float!
    
    I_follow: JSON, 
    followed_by: JSON,
    myselfData: MyselfData,
    
    score: Float
    external_login: String
    
    posts_total_amount_delta: Int
    scaled_importance_delta: Float
    scaled_social_rate_delta: Float

    staked_balance: Float
    validity: Float
    importance: Float
    scaled_importance: Float

    stake_rate: Float
    scaled_stake_rate: Float

    social_rate: Float
    scaled_social_rate: Float

    transfer_rate: Float
    scaled_transfer_rate: Float

    previous_cumulative_emission: Float
    current_emission: Float
    current_cumulative_emission: Float
  }

  type users {
    data: [User!]!
    metadata: metadata!
  }
  
  type MyselfData {
    myselfVote: String
    join: Boolean
    organization_member: Boolean
    repost_available: Boolean

    follow: Boolean
    myFollower: Boolean

    editable: Boolean
    member:   Boolean
  }

  input one_user_airdrop_state_filtering {
    airdrop_id: Int!
  }
  
  input users_team_query {
    page: Int!
    per_page: Int!
    order_by: String!
    
    filters: users_filtering!
  }
  
  input users_filtering {
    overview_type: String
    entity_name: String
    post_type_id: Int
    
    airdrops: JSON
    
    users_identity_pattern: String
  }
  
  input one_user_activity_filtering {
    user_id: Int
    user_identity: String
    
    activity: String  
  }
  
  input one_user_filtering {
    user_id: Int
    user_identity: String
  }
`;
