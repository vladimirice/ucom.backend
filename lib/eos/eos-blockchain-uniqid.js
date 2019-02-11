"use strict";
const TagsModelProvider = require("../tags/service/tags-model-provider");
const uniqid = require('uniqid');
const postsModelProvider = require('../posts/service/posts-model-provider');
const MEDIA_POST_PREFIX = postsModelProvider.getMediaPostBlockchainIdPrefix();
const POST_OFFER_PREFIX = postsModelProvider.getPostOfferBlockchainIdPrefix();
const prefixByScope = {
    organizations: 'org',
};
class BlockchainUniqId {
    static getTagFakeUniqId() {
        const prefix = TagsModelProvider.getBlockchainIdPrefix();
        return `fake_tag_blockchain_id_${this.getUniqIdWithoutId(prefix)}`;
    }
    /**
     *
     * @return {string}
     */
    static getUniqidForMediaPost() {
        return this.getUniqIdWithoutId(MEDIA_POST_PREFIX);
    }
    /**
     *
     * @return {string}
     */
    static getUniqidForPostOffer() {
        return this.getUniqIdWithoutId(POST_OFFER_PREFIX);
    }
    /**
     *
     * @return {string}
     */
    static getUniqidForDirectPost() {
        const prefix = postsModelProvider.getDirectPostBlockchainIdPrefix();
        return this.getUniqIdWithoutId(prefix);
    }
    /**
     *
     * @return {string}
     */
    static getUniqidForRepost() {
        const prefix = postsModelProvider.getRepostBlockchainIdPrefix();
        return this.getUniqIdWithoutId(prefix);
    }
    /**
     *
     * @param {string} scope
     * @return {string}
     */
    static getUniqidByScope(scope) {
        const prefix = prefixByScope[scope];
        if (!prefix) {
            throw new Error(`Scope ${scope} is not supported`);
        }
        return this.getUniqIdWithoutId(prefix);
    }
    /**
     *
     * @param {string} prefix
     * @return {*}
     */
    static getUniqIdWithoutId(prefix) {
        return uniqid(`${prefix}-`);
    }
}
module.exports = BlockchainUniqId;
