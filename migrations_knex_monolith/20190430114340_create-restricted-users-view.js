exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE OR REPLACE VIEW persons AS
      SELECT 
        id,
        account_name,
        nickname,
        first_name,
        last_name,
        email,
        phone_number,
        birthday,
        about,
        country,
        city,
        address,
        mood_message,
        created_at,
        updated_at,
        public_key,
        currency_to_show,
        first_currency,
        first_currency_year,
        personal_website_url,
        achievements_filename,
        current_rate,
        blockchain_registration_status,
        is_tracking_allowed
      FROM "Users";
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars,func-names
exports.down = function (knex, Promise) {
};
