"use strict";
const SCHEMA_NAME = 'affiliates';
const OFFERS_TABLE_NAME = `${SCHEMA_NAME}.offers`;
const STREAMS_TABLE_NAME = `${SCHEMA_NAME}.streams`;
const CLICKS_TABLE_NAME = `${SCHEMA_NAME}.clicks`;
const CONVERSIONS_TABLE_NAME = `${SCHEMA_NAME}.conversions`;
class AffiliatesModelProvider {
    static getSchemaName() {
        return SCHEMA_NAME;
    }
    static getOffersTableName() {
        return OFFERS_TABLE_NAME;
    }
    static getStreamsTableName() {
        return STREAMS_TABLE_NAME;
    }
    static getClicksTableName() {
        return CLICKS_TABLE_NAME;
    }
    static getConversionsTableName() {
        return CONVERSIONS_TABLE_NAME;
    }
}
module.exports = AffiliatesModelProvider;
