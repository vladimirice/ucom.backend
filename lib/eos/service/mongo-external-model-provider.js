"use strict";
const ACTION_TRACES_COLLECTION_NAME = 'action_traces';
class MongoExternalModelProvider {
    static actionTracesCollection() {
        return ACTION_TRACES_COLLECTION_NAME;
    }
}
module.exports = MongoExternalModelProvider;
