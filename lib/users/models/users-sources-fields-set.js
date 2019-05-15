"use strict";
const fieldsSet = {
    // Editable by a user request
    source_url: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    is_official: {
        type: 'boolean',
        request: {
            sanitizationType: 'boolean',
        },
    },
    source_type_id: {
        type: 'number',
        request: {
            sanitizationType: 'any',
        },
    },
    // Not editable by a user request
    id: {
        type: 'number',
    },
    user_id: {
        type: 'number',
    },
    created_at: {
        type: 'any',
    },
    updated_at: {
        type: 'any',
    },
};
class UsersSourcesFields {
    static getAllFieldsSet() {
        return fieldsSet;
    }
}
module.exports = UsersSourcesFields;
