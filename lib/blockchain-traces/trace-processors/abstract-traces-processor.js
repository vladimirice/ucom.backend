"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const inversify_1 = require("inversify");
require("reflect-metadata");
const processor_errors_1 = require("./processor-errors");
const CommonTracesProcessor = require("./common-traces-processor");
const joi = require('joi');
let AbstractTracesProcessor = class AbstractTracesProcessor {
    processTrace(trace) {
        this.allActNamesAllowedOrError(trace);
        const validatedActionsData = {};
        for (const actName in this.expectedActionsData) {
            if (!this.expectedActionsData.hasOwnProperty(actName)) {
                continue;
            }
            const { validationSchema, minNumberOfActions, maxNumberOfActions } = this.expectedActionsData[actName];
            validatedActionsData[actName] = this.findActionsDataByRules(actName, validationSchema, minNumberOfActions, maxNumberOfActions, trace);
        }
        const processedTrace = this.getTraceThumbnail(validatedActionsData);
        const { from, to, memo } = this.getFromToAndMemo(validatedActionsData);
        return CommonTracesProcessor.getTraceToInsertToDb(this.traceType, processedTrace, trace, from, to, memo);
    }
    throwMalformedError(message) {
        throw new processor_errors_1.MalformedProcessingError(`Trace type: ${this.traceType}. ${message}`);
    }
    allActNamesAllowedOrError(trace) {
        const allowedActNames = Object.keys(this.expectedActionsData);
        const notAllowed = trace.actions.filter(action => !allowedActNames.includes(action.act.name));
        if (notAllowed.length > 0) {
            throw new processor_errors_1.UnableToProcessError();
        }
    }
    findActionsDataByRules(actName, validationSchema, minNumberOfActions, maxNumberOfActions, trace) {
        const targetActions = trace.actions.filter(action => action.act.name === actName);
        if (targetActions.length < minNumberOfActions || targetActions.length > maxNumberOfActions) {
            throw new processor_errors_1.UnableToProcessError();
        }
        for (const action of targetActions) {
            this.validateActionByActData(action, validationSchema);
        }
        return targetActions;
    }
    validateActionByActData(action, validationSchema) {
        const actData = action.act_data;
        const { error } = joi.validate(actData, validationSchema, {
            abortEarly: false,
            allowUnknown: false,
        });
        if (error) {
            this.throwMalformedError('Action name is ok but there are validation errors');
        }
        return action;
    }
};
AbstractTracesProcessor = __decorate([
    inversify_1.injectable()
], AbstractTracesProcessor);
module.exports = AbstractTracesProcessor;
