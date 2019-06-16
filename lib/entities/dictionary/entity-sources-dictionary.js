"use strict";
const errors_1 = require("../../api/errors");
const SOURCE_GROUP__SOCIAL_NETWORKS = 1;
const SOURCE_GROUP__COMMUNITY = 2;
const SOURCE_GROUP__PARTNERSHIP = 3;
const SOURCE_TYPE__INTERNAL = 'internal';
const SOURCE_TYPE__EXTERNAL = 'external';
class EntitySourcesDictionary {
    static sourceGroupToStringKeySet() {
        return {
            [this.socialNetworksGroup()]: 'social_networks',
            [this.communityGroup()]: 'community_sources',
            [this.partnershipGroup()]: 'partnership_sources',
        };
    }
    static socialNetworksGroup() {
        return SOURCE_GROUP__SOCIAL_NETWORKS;
    }
    static communityGroup() {
        return SOURCE_GROUP__COMMUNITY;
    }
    static partnershipGroup() {
        return SOURCE_GROUP__PARTNERSHIP;
    }
    static internalType() {
        return SOURCE_TYPE__INTERNAL;
    }
    static externalType() {
        return SOURCE_TYPE__EXTERNAL;
    }
    static sourceGroupIdToStringKey(groupId) {
        const result = this.sourceGroupToStringKeySet()[groupId];
        if (!result) {
            throw new errors_1.AppError(`Unsupported groupId: ${groupId}`);
        }
        return result;
    }
}
module.exports = EntitySourcesDictionary;
