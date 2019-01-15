"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex = require('../../config/knex');
(async () => {
    const entityName = process.env.ENTITY === '1' ? 'posts     ' : 'comments  ';
    const tableName = process.env.ENTITY === '1' ? 'posts' : 'comments';
    console.log(`entityName: ${entityName} and tableName: ${tableName}`);
    const sql = `
  SELECT COUNT(1), activity_type_id, entity_id_to, entity_name FROM users_activity
    WHERE activity_type_id IN (2, 4) AND activity_group_id = 2
     AND blockchain_status = 1
    AND entity_name = '${entityName}'
  GROUP BY entity_id_to, entity_name, activity_type_id
  ORDER BY entity_id_to, entity_name DESC;
  `;
    const data = await knex.raw(sql);
    const entities = {};
    for (const row of data.rows) {
        processEntity(entities, row);
    }
    await updateCurrentVote(entities, tableName);
    console.log('updateCurrentVote is finished');
    await setZeroCurrentVoteForInvalidOnlyTransactions(tableName, entityName);
    console.log('setZeroCurrentVoteForInvalidOnlyTransactions is finished');
})();
function processEntity(entities, row) {
    if (!entities[row.entity_id_to]) {
        entities[row.entity_id_to] = {
            entity_id: row.entity_id_to,
            entity_name: row.entity_name,
            upvote: 0,
            downvote: 0,
            current_vote: 0,
        };
    }
    if (row.activity_type_id === 2) {
        entities[row.entity_id_to].upvote = +row.count;
    }
    else {
        entities[row.entity_id_to].downvote = +row.count;
    }
}
async function updateCurrentVote(entities, tableName) {
    let promises = [];
    const batchSize = 200;
    for (const entityId in entities) {
        const entity = entities[entityId];
        entity.current_vote = entity.upvote - entity.downvote;
        const sql = `UPDATE ${tableName} SET current_vote = ${+entity.current_vote} WHERE id = ${+entityId}`;
        promises.push(knex.raw(sql));
        if (promises.length === batchSize) {
            console.log(`Lets process promises. Amount of updates are: ${promises.length}`);
            await Promise.all(promises);
            console.log('processed');
            promises = [];
        }
    }
    if (promises.length > 0) {
        console.log(`Lets process remained promises. Amount of updates are: ${promises.length}`);
        await Promise.all(promises);
        console.log('processed');
    }
}
async function setZeroCurrentVoteForInvalidOnlyTransactions(tableName, entityName) {
    const sql = `
    UPDATE ${tableName} set current_vote = 0 WHERE id IN (
      SELECT ${tableName}.id
      FROM ${tableName}
             LEFT JOIN users_activity
                       ON ${tableName}.id = users_activity.entity_id_to
                         AND users_activity.entity_name = '${entityName}'
                         AND users_activity.blockchain_status = 1
                         AND activity_type_id IN (2, 4)
                         AND activity_group_id = 2
      WHERE
        users_activity.id IS NULL
        AND ${tableName}.current_vote != 0
    );
  `;
    await knex.raw(sql);
}
