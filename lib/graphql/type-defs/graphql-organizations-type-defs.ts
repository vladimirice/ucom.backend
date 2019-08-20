export const graphqlOrganizationsQueryPart = `
    organizations(filters: org_filtering, order_by: String!, page: Int!, per_page: Int!): organizations!
    many_organizations(filters: org_filtering, order_by: String!, page: Int!, per_page: Int!): organizations!
    one_organization_activity(filters: one_org_activity_filtering, order_by: String!, page: Int!, per_page: Int!): users!
`;

export const graphqlOrganizationsTypes = `
  type organizations {
    data: [Organization!]!
    metadata: metadata!
  }
  
  type Organization {
    id: Int!
    title: String!
    avatar_filename: String
    nickname: String!
    current_rate: Float!
    user_id: Int!
    about: String
    powered_by: String
    
    entity_images: JSON
    
    importance_delta: Float
    activity_index_delta: Float
    posts_total_amount_delta: Int
    number_of_followers: Int
    blockchain_id: String
  }

  input org_filtering {
    overview_type: String
    entity_name: String
    post_type_id: Int
    
    organizations_identity_pattern: String
  }
  
  input one_org_activity_filtering {
    organization_identity: String
    
    activity: String  
  }
`;
