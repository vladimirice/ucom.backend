"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const queryFilterService = require('../../api/filters/query-filter-service');
const organizationsRepository = require('../repository/organizations-repository.js');
const orgPostProcessor = require('./organization-post-processor');
class OrganizationsFetchService {
    /**
     * @param {string} tagTitle
     * @param {Object} query
     */
    static findAndProcessAllByTagTitle(tagTitle, query) {
        return __awaiter(this, void 0, void 0, function* () {
            queryFilterService.checkLastIdExistence(query);
            const params = queryFilterService.getQueryParameters(query);
            const promises = [
                organizationsRepository.findAllByTagTitle(tagTitle, params),
                organizationsRepository.countAllByTagTitle(tagTitle),
            ];
            return this.findAndProcessAllByParams(promises, query, params);
        });
    }
    /**
     *
     * @param {Object} query
     * @returns {Promise<Object>}
     */
    static findAndProcessAll(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = queryFilterService.getQueryParameters(query);
            const data = yield organizationsRepository.findAllOrgForList(params);
            orgPostProcessor.processManyOrganizations(data);
            const totalAmount = yield organizationsRepository.countAllOrganizations();
            const metadata = queryFilterService.getMetadata(totalAmount, query, params);
            return {
                data,
                metadata,
            };
        });
    }
    static findAndProcessAllByParams(promises, query, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const [data, totalAmount] = yield Promise.all(promises);
            orgPostProcessor.processManyOrganizations(data);
            const metadata = queryFilterService.getMetadata(totalAmount, query, params);
            return {
                data,
                metadata,
            };
        });
    }
}
module.exports = OrganizationsFetchService;
