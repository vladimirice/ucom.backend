"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const inversify_1 = require("inversify");
require("reflect-metadata");
const winston_1 = require("../../../config/winston");
const CommonTracesProcessor = require("./common-traces-processor");
const UnableToProcessError = require("./processor-errors");
const joi = require('joi');
let AbstractTracesProcessor = class AbstractTracesProcessor {
    processTrace(trace) {
        this.allActNamesAllowedOrError(trace);
        const validatedActionsData = {};
        for (const actName in this.expectedActionsData) {
            if (!this.expectedActionsData.hasOwnProperty(actName)) {
                continue;
            }
            const { validationSchema, numberOfActions } = this.expectedActionsData[actName];
            validatedActionsData[actName] =
                this.findActionsDataByRules(actName, validationSchema, numberOfActions, trace);
        }
        const processedTrace = this.getTraceThumbnail(validatedActionsData);
        const { from, to, memo } = this.getFromToAndMemo(validatedActionsData);
        return CommonTracesProcessor.getTraceToInsertToDb(this.traceType, processedTrace, trace, from, to, memo);
    }
    allActNamesAllowedOrError(trace) {
        const allowedActNames = Object.keys(this.expectedActionsData);
        const notAllowed = trace.actions.filter(action => allowedActNames.includes(action.act.name));
        if (notAllowed.length > 0) {
            throw new UnableToProcessError();
        }
    }
    findActionsDataByRules(actName, validationSchema, numberOfActions, trace) {
        const actionsData = [];
        const targetActions = trace.actions.filter(action => action.act.name === actName);
        if (targetActions.length !== numberOfActions) {
            throw new UnableToProcessError();
        }
        for (const action of targetActions) {
            const validated = this.getActDataFromAction(action, validationSchema, trace);
            // Always push or trace is not processed by the processor
            actionsData.push(validated);
        }
        return actionsData;
    }
    getActDataFromAction(action, validationSchema, trace) {
        const actionData = action.act_data;
        const { error } = joi.validate(actionData, validationSchema, {
            abortEarly: false,
            allowUnknown: false,
        });
        if (error) {
            winston_1.WorkerLogger.warn('Action name is ok but there are validation errors', {
                service: this.serviceName,
                error,
                trace,
            });
            throw new UnableToProcessError();
        }
        return actionData;
    }
};
AbstractTracesProcessor = __decorate([
    inversify_1.injectable()
], AbstractTracesProcessor);
module.exports = AbstractTracesProcessor;
