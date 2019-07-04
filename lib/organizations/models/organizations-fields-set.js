"use strict";
const EntityImagesModelProvider = require("../../entity-images/service/entity-images-model-provider");
const fieldsSet = {
    // Editable by a user request
    avatar_filename: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    title: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    currency_to_show: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    powered_by: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    about: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    nickname: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    email: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    phone_number: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    country: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    city: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    address: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    personal_website_url: {
        type: 'string',
        request: {
            sanitizationType: 'text',
        },
    },
    [EntityImagesModelProvider.entityImagesColumn()]: {
        type: 'any',
        request: {
            sanitizationType: 'any',
        },
    },
    // not editable by user request
    id: {
        type: 'number',
    },
    user_id: {
        type: 'number',
    },
    blockchain_id: {
        type: 'string',
    },
    current_rate: {
        type: 'number',
    },
    created_at: {
        type: 'datetime',
    },
    updated_at: {
        type: 'datetime',
    },
};
class OrganizationsFieldsSet {
    static getAllFieldsSet() {
        return fieldsSet;
    }
}
module.exports = OrganizationsFieldsSet;
