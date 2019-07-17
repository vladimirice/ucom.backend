"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_users_type_defs_1 = require("./graphql-users-type-defs");
const graphql_posts_type_defs_1 = require("./graphql-posts-type-defs");
const graphql_organizations_type_defs_1 = require("./graphql-organizations-type-defs");
const { gql } = require('apollo-server-express');
exports.graphqlTypeDefs = gql `
  type Query {
    many_tags(filters: tag_filtering, order_by: String!, page: Int!, per_page: Int!): tags!

    feed_comments(commentable_id: Int!, page: Int!, per_page: Int!): comments!
    comments_on_comment(commentable_id: Int!, parent_id: Int!, parent_depth: Int!, page: Int!, per_page: Int!): comments!
    
    many_blockchain_nodes(filters: many_blockchain_nodes_filtering, order_by: String!, page: Int!, per_page: Int!): JSON
    
    ${graphql_users_type_defs_1.graphqlUsersQueryPart}
    ${graphql_posts_type_defs_1.graphqlPostsQueryPart}
    ${graphql_organizations_type_defs_1.graphqlOrganizationsQueryPart}
  }

  scalar JSON

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

  type comments {
    data: [Comment!]!
    metadata: metadata!
  }


  type tags {
    data: [Tag!]!
    metadata: metadata!
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
  
  input tag_filtering {
    overview_type: String
    entity_name: String
    post_type_id: Int
    
    tags_identity_pattern: String
  }

  input many_blockchain_nodes_filtering {
    myself_votes_only: Boolean!
    blockchain_nodes_type: Int!
    user_id: Int
    title_like: String
  }
  
  ${graphql_users_type_defs_1.graphqlUsersTypes}
  ${graphql_posts_type_defs_1.graphqlPostsTypes}
  ${graphql_organizations_type_defs_1.graphqlOrganizationsTypes}
`;
