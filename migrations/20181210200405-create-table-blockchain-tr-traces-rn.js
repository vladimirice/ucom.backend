const TABLE_NAME = 'blockchain_tr_traces_rn';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      create table ${TABLE_NAME}
      (
        id bigserial not null
          constraint blockchain_tr_traces_rn_pkey
            primary key,
        tr_type smallint not null,
        tr_processed_data jsonb not null,
        memo varchar(2048) default ''::character varying not null,
        tr_id varchar(1024) not null
          constraint blockchain_tr_traces_rn_tr_id_key
            unique,
        external_id varchar(1024) not null
          constraint blockchain_tr_traces_rn_external_id_key
            unique,
        account_name_from varchar(255) default NULL::character varying,
        account_name_to varchar(255) default NULL::character varying,
        raw_tr_data jsonb not null,
        tr_executed_at timestamp with time zone not null,
        mongodb_created_at timestamp with time zone not null,
        created_at timestamp with time zone default now() not null,
        updated_at timestamp with time zone default now() not null
      );
      
        alter table blockchain_tr_traces_rn owner to uos;
      
        create index tr_type_rn
        on blockchain_tr_traces_rn (account_name_from);
      
        create index account_name_from_rn_idx
        on blockchain_tr_traces_rn (account_name_from);
      
        create index account_name_to_rn_idx
        on blockchain_tr_traces_rn (account_name_to);
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
