"use strict";
const fieldsSet = {
    // Editable by a user request
    description: {
        type: 'string',
        request: {
            sanitizationType: 'html',
        },
    },
    commentable_id: {
        type: 'number',
        request: {
            sanitizationType: 'number',
        },
    },
    depth: {
        type: 'number',
        request: {
            sanitizationType: 'number',
        },
    },
    organization_id: {
        type: 'number',
        request: {
            sanitizationType: 'number',
        },
    },
    entity_images: {
        type: 'any',
        request: {
            sanitizationType: 'any',
        },
    },
    // Not editable by a user request
    id: {
        type: 'number',
    },
    current_vote: {
        type: 'number',
    },
    path: {
        type: 'string',
    },
    blockchain_status: {
        type: 'number',
    },
    blockchain_id: {
        type: 'string',
    },
    created_at: {
        type: 'datetime',
    },
    updated_at: {
        type: 'datetime',
    },
    parent_id: {
        type: 'number',
    },
    user_id: {
        type: 'number',
    },
};
class CommentsFieldsSet {
    static getAllFieldsSet() {
        return fieldsSet;
    }
}
module.exports = CommentsFieldsSet;
