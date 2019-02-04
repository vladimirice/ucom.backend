"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { bookshelf } = require('../../../config/knex');
const orgDbModel = bookshelf.Model.extend({
    tableName: 'organizations',
});
exports.orgDbModel = orgDbModel;
