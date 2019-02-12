const TABLE_NAME = 'tags';

exports.up = (knex) => {
  const sql = `
      ALTER TABLE "${TABLE_NAME}" ADD COLUMN current_media_posts_amount BIGINT NOT NULL DEFAULT 0;
      ALTER TABLE "${TABLE_NAME}" ADD COLUMN current_direct_posts_amount BIGINT NOT NULL DEFAULT 0;
     `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
