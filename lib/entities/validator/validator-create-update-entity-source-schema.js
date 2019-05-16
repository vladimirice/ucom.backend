"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const joi = require('joi');
// tslint:disable-next-line:variable-name
const CreateEntitySourceSchema = joi.object().keys({
    source_url: joi.string().allow(''),
    source_type_id: joi.number(),
    is_official: joi.boolean(),
});
exports.CreateEntitySourceSchema = CreateEntitySourceSchema;
// tslint:disable-next-line
const UpdateEntitySourceSchema = joi.object().keys({
    id: joi.number().required(),
    source_url: joi.string().allow(''),
    source_type_id: joi.number(),
    is_official: joi.boolean(),
});
exports.UpdateEntitySourceSchema = UpdateEntitySourceSchema;
