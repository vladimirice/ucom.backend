exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    CREATE INDEX comments_user_id_idx ON comments(user_id);
    CREATE INDEX comments_parent_id_idx ON comments(parent_id);
    
    CREATE INDEX organizations_user_id_idx ON organizations(user_id);
    CREATE INDEX organizations_current_params_organization_id_idx ON organizations_current_params(organization_id);    

    CREATE INDEX post_offer_post_id_idx ON post_offer(post_id);
    
    CREATE INDEX post_stats_post_id_idx ON post_stats(post_id);
    
    CREATE INDEX post_users_team_post_id_idx ON post_users_team(post_id);
    CREATE INDEX post_users_team_user_id_idx ON post_users_team(user_id);
    
    CREATE INDEX posts_user_id_idx ON posts(user_id);
    CREATE INDEX posts_parent_id_idx ON posts(parent_id);
    
    CREATE INDEX posts_current_params_post_id_idx ON posts_current_params(post_id);
    
    CREATE INDEX tags_current_params_tag_id_idx ON tags_current_params(tag_id);
    
    CREATE INDEX users_education_user_id_idx ON users_education(user_id);
    CREATE INDEX users_jobs_user_id_idx ON users_jobs(user_id);
    CREATE INDEX users_sources_user_id_idx ON users_sources(user_id);
    CREATE INDEX users_team_user_id_idx ON users_team(user_id);
`;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
