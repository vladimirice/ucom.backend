"use strict";
const fieldsSet = {
    // Editable by a user request
    title: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    speciality: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    degree: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    start_date: {
        type: 'any',
        request: {
            sanitizationType: 'any',
        },
    },
    end_date: {
        type: 'any',
        request: {
            sanitizationType: 'any',
        },
    },
    is_current: {
        type: 'boolean',
        request: {
            sanitizationType: 'boolean',
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
class UsersEducationFieldsSet {
    static getAllFieldsSet() {
        return fieldsSet;
    }
}
module.exports = UsersEducationFieldsSet;
