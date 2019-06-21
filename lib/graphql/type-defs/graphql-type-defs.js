"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_users_type_defs_1 = require("./graphql-users-type-defs");
const { gql } = require('apollo-server-express');
exports.graphqlTypeDefs = gql `
  type Query {
    user_wall_feed(filters: one_user_filtering, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    org_wall_feed(organization_id: Int!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    tag_wall_feed(tag_identity: String!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    
    posts(filters: post_filtering, order_by: String!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    many_posts(filters: post_filtering, order_by: String!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    posts_feed(filters: posts_feed_filters, order_by: String!, page: Int!, per_page: Int!, include: JSON): posts!
    
    organizations(filters: org_filtering, order_by: String!, page: Int!, per_page: Int!): organizations!
    many_organizations(filters: org_filtering, order_by: String!, page: Int!, per_page: Int!): organizations!
    many_tags(filters: tag_filtering, order_by: String!, page: Int!, per_page: Int!): tags!

    user_news_feed(page: Int!, per_page: Int!, comments_query: comments_query!): posts!

    feed_comments(commentable_id: Int!, page: Int!, per_page: Int!): comments!
    comments_on_comment(commentable_id: Int!, parent_id: Int!, parent_depth: Int!, page: Int!, per_page: Int!): comments!
    one_post(id: Int!, comments_query: comments_query!): Post
    one_post_offer(id: Int!, comments_query: comments_query!, users_team_query: users_team_query!): PostOffer!
    
    many_blockchain_nodes(filters: many_blockchain_nodes_filtering, order_by: String!, page: Int!, per_page: Int!): JSON
    
    ${graphql_users_type_defs_1.graphqlUsersQueryPart}
  }

  scalar JSON

  type Post {
    id: Int!
    title: String
    description: String
    leading_text: String

    current_vote: Float!
    current_rate: Float!
    comments_count: Int!

    entity_images: JSON
    
    entity_tags: JSON

    user_id: Int!
    post_type_id: Int!
    blockchain_id: String!
    organization_id: Int
    
    organization: Organization
    
    created_at: String!
    updated_at: String!

    entity_id_for: Int
    entity_name_for: String
    entity_for_card: JSON

    User: User!

    myselfData: MyselfData

    comments: comments
    
    post: Post
  }
  
  type PostOffer {
    id: Int!
    title: String!
    description: String!
    leading_text: String!

    current_vote: Float!
    current_rate: Float!
    comments_count: Int!

    entity_images: JSON
    
    entity_tags: JSON

    user_id: Int!
    post_type_id: Int!
    blockchain_id: String!
    organization_id: Int
    
    organization: Organization
    
    created_at: String!
    updated_at: String!

    entity_id_for: Int
    entity_name_for: String
    entity_for_card: JSON

    User: User!

    myselfData: MyselfData

    comments: comments!
    
    post: Post
    
    started_at: String!
    finished_at: String!
    
    post_offer_type_id: Int!
    
    users_team: JSON!
    offer_data: JSON!
  }

  type Comment {
    id: Int!,
    description: String!
    current_vote: Float!

    User: User!
    blockchain_id: String!
    commentable_id: Int!
    created_at: String!

    activity_user_comment: JSON
    organization: Organization

    depth: Int!
    myselfData: MyselfData
    organization_id: Int
    parent_id: Int
    path: JSON
    updated_at: String!
    user_id: Int!
    entity_images: JSON

    metadata: comment_metadata!
  }

  type posts {
    data: [Post!]!
    metadata: metadata!
  }

  type comments {
    data: [Comment!]!
    metadata: metadata!
  }

  type organizations {
    data: [Organization!]!
    metadata: metadata!
  }

  type tags {
    data: [Tag!]!
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
    
    importance_delta: Float
    activity_index_delta: Float
    posts_total_amount_delta: Int
    number_of_followers: Int
  }
  
  type Tag {
    id: Int!
    title: String!
    current_rate: Float!
    current_posts_amount: Int!
    current_media_posts_amount: Int!
    current_direct_posts_amount: Int!

    first_entity_id: Int!
    
    entity_name: String!
    
    created_at: String!
    updated_at: String!
  }

  type metadata {
    page: Int!,
    per_page: Int!,
    has_more: Boolean!
    total_amount: Int!
  }

  type comment_metadata {
    next_depth_total_amount: Int!
  }
  
  input comments_query {
    page: Int!
    per_page: Int!
  }
  
  input posts_feed_filters {
    post_type_ids: [Int!]!
    entity_names_from:  [String!]
    entity_names_for:   [String!]    
  }

  input post_filtering {
    overview_type: String
    post_type_id: Int!
    created_at: String
    entity_names_from:  [String!]
    entity_names_for:   [String!]
  }
  
  input org_filtering {
    overview_type: String
    entity_name: String
    post_type_id: Int
  }
  
  input tag_filtering {
    overview_type: String
    entity_name: String
    post_type_id: Int
  }

  input many_blockchain_nodes_filtering {
    myself_votes_only: Boolean!
    blockchain_nodes_type: Int!
    user_id: Int
    title_like: String
  }
  
  ${graphql_users_type_defs_1.graphqlUsersTypes}
`;
