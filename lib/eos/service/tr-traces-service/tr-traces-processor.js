"use strict";
/* tslint:disable:max-line-length */
const moment = require('moment');
const { TrTracesProcessorError } = require('../../errors/errors');
const blockchainTrTracesDictionary = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;
const CURRENCY__UOS = 'UOS';
class TrTracesProcessor {
    /**
     *
     * @param {Object} doc
     * @param {number} trType
     */
    static processOneTrByType(doc, trType) {
        // Temp solution for the situation = there is a transaction trace but no block yet
        // #task - filter such transactions on mongoDb level ("transactions" collection)
        if (!doc.block_data || Object.keys(doc.block_data).length === 0) {
            console.log(`There is no block yet for transaction. Skipped. Doc _id: ${doc._id}`);
            return null;
        }
        this.checkDocCommonFields(doc);
        const processor = TrTracesProcessor.getProcessor(trType);
        return processor(doc);
    }
    /**
     *
     * @param {number} trType
     * @returns {*}
     * @private
     */
    static getProcessor(trType) {
        const trToProc = {
            [blockchainTrTracesDictionary.getTypeTransfer()]: this.processTrTransfer,
            [blockchainTrTracesDictionary.getTypeStakeResources()]: this.processTrStake,
            [blockchainTrTracesDictionary.getTypeUnstakingRequest()]: this.processTrUnstakingRequest,
            [blockchainTrTracesDictionary.getTypeStakeWithUnstake()]: this.processStakeWithUnstake,
            [blockchainTrTracesDictionary.getTypeVoteForBp()]: this.processTrVoteForBp,
            [blockchainTrTracesDictionary.getTypeBuyRamBytes()]: this.processTrBuyRamBytes,
            [blockchainTrTracesDictionary.getTypeSellRam()]: this.processTrSellRamBytes,
            [blockchainTrTracesDictionary.getTypeMyselfRegistration()]: this.processNewAccount,
            [blockchainTrTracesDictionary.getTypeClaimEmission()]: this.processTrClaimEmission,
        };
        if (trToProc[trType]) {
            return trToProc[trType];
        }
        throw new Error(`There is no processor for trType: ${trType}`);
    }
    /**
     *
     * @param {Object} doc
     * @private
     */
    static processTrTransfer(doc) {
        const tracedDataRequiredFields = [
            'from',
            'to',
            'memo',
            'quantity',
        ];
        const actionTraces = doc.action_traces;
        if (actionTraces.length !== 1 || !actionTraces[0]) {
            throw new TrTracesProcessorError('Action traces should has only one element', actionTraces);
        }
        const act = actionTraces[0].act;
        if (!act) {
            throw new TrTracesProcessorError('Action must contain act field', actionTraces[0]);
        }
        const traceData = act.data;
        if (!traceData) {
            throw new TrTracesProcessorError('There is no data inside act', actionTraces[0]);
        }
        TrTracesProcessor.checkRequiredFields(tracedDataRequiredFields, traceData);
        const trProcessedData = {
            tokens: {
                active: TrTracesProcessor.getTokensAmountFromString(traceData.quantity),
                currency: CURRENCY__UOS,
            },
        };
        return TrTracesProcessor.getProcessedObj(blockchainTrTracesDictionary.getTypeTransfer(), trProcessedData, doc, traceData.from, traceData.to, traceData.memo);
    }
    /**
     *
     * @param {Object} doc
     * @returns {*}
     * @private
     */
    static processTrStake(doc) {
        const cpuQuantityField = 'stake_cpu_quantity';
        const netQuantityField = 'stake_net_quantity';
        const skipWord = 'undelegatebw';
        const trProcessedField = 'tokens';
        const trProcessedQuantityField = 'self_delegated';
        const trType = blockchainTrTracesDictionary.getTypeStakeResources();
        return TrTracesProcessor.processTrStakingOrUnstakingRequest(doc, trType, cpuQuantityField, netQuantityField, skipWord, trProcessedField, trProcessedQuantityField);
    }
    /**
     *
     * @param {Object} doc
     * @returns {*}
     * @private
     */
    static processTrUnstakingRequest(doc) {
        const cpuQuantityField = 'unstake_cpu_quantity';
        const netQuantityField = 'unstake_net_quantity';
        const skipWord = 'delegatebw';
        const trProcessedField = 'unstaking_request';
        const trProcessedQuantityField = 'amount';
        const trType = blockchainTrTracesDictionary.getTypeUnstakingRequest();
        return TrTracesProcessor.processTrStakingOrUnstakingRequest(doc, trType, cpuQuantityField, netQuantityField, skipWord, trProcessedField, trProcessedQuantityField);
    }
    /**
     *
     * @param {Object} doc
     * @param {number} trType
     * @param {string} cpuQuantityField
     * @param {string} netQuantityField
     * @param {string} skipWord
     * @param {string} trProcessedField
     * @param {string} trProcessedQuantityField
     * @private
     */
    static processTrStakingOrUnstakingRequest(doc, trType, cpuQuantityField, netQuantityField, skipWord, trProcessedField, trProcessedQuantityField) {
        const tracedDataRequiredFields = [
            'from',
            'receiver',
            cpuQuantityField,
            netQuantityField,
        ];
        const actionTraces = doc.action_traces;
        if (!actionTraces || actionTraces.length > 2 || actionTraces.length === 0) {
            throw new TrTracesProcessorError('Action traces are not correct', actionTraces);
        }
        const actOne = actionTraces[0].act;
        const actTwo = actionTraces[1] ? actionTraces[1].act : null;
        // It is possible not to have actTwo
        if (!actOne) {
            throw new TrTracesProcessorError('Action must contain act field', actionTraces[0]);
        }
        let traceDataOne = null;
        let traceDataTwo = null;
        let traceOneCpuAmount = 0;
        let traceOneNetAmount = 0;
        let traceTwoCpuAmount = 0;
        let traceTwoNetAmount = 0;
        let traceOneAccountNameFrom;
        let traceOneAccountNameTo;
        let traceTwoAccountNameFrom;
        let traceTwoAccountNameTo;
        if (actOne.name !== skipWord) {
            traceDataOne = actOne.data;
            if (!traceDataOne) {
                throw new TrTracesProcessorError('Data inside trace is malformed', actOne);
            }
            TrTracesProcessor.checkRequiredFields(tracedDataRequiredFields, traceDataOne);
            traceOneCpuAmount =
                TrTracesProcessor.getTokensAmountFromString(traceDataOne[cpuQuantityField]);
            traceOneNetAmount =
                TrTracesProcessor.getTokensAmountFromString(traceDataOne[netQuantityField]);
            // @ts-ignore
            traceOneAccountNameFrom = traceDataOne.from;
            // @ts-ignore
            traceOneAccountNameTo = traceDataOne.receiver;
        }
        if (actTwo && actTwo.name !== skipWord) {
            traceDataTwo = actTwo.data;
            if (!traceDataTwo) {
                throw new TrTracesProcessorError('Data inside trace is malformed', actTwo);
            }
            TrTracesProcessor.checkRequiredFields(tracedDataRequiredFields, traceDataTwo);
            traceTwoCpuAmount =
                TrTracesProcessor.getTokensAmountFromString(traceDataTwo[cpuQuantityField]);
            traceTwoNetAmount =
                TrTracesProcessor.getTokensAmountFromString(traceDataTwo[netQuantityField]);
            // @ts-ignore
            traceTwoAccountNameFrom = traceDataTwo.from;
            // @ts-ignore
            traceTwoAccountNameTo = traceDataTwo.receiver;
        }
        if (traceOneAccountNameFrom && traceTwoAccountNameFrom) {
            if (traceOneAccountNameFrom !== traceTwoAccountNameFrom) {
                throw new TrTracesProcessorError('Account name from (from) field must be equal in both traces');
            }
        }
        if (traceOneAccountNameTo && traceTwoAccountNameTo) {
            if (traceOneAccountNameTo !== traceTwoAccountNameTo) {
                throw new TrTracesProcessorError('Account name to (receiver) field must be equal in both traces');
            }
        }
        const accountNameFrom = traceOneAccountNameFrom || traceTwoAccountNameFrom;
        const accountNameTo = traceOneAccountNameTo || traceTwoAccountNameTo;
        if (accountNameFrom !== accountNameTo) {
            throw new TrTracesProcessorError('Account name to (receiver) field must be equal to account name from (from)');
        }
        const trProcessedData = {
            resources: {
                cpu: {
                    [trProcessedField]: {
                        [trProcessedQuantityField]: traceOneCpuAmount + traceTwoCpuAmount,
                        currency: CURRENCY__UOS,
                    },
                },
                net: {
                    [trProcessedField]: {
                        [trProcessedQuantityField]: traceOneNetAmount + traceTwoNetAmount,
                        currency: CURRENCY__UOS,
                    },
                },
            },
        };
        return TrTracesProcessor.getProcessedObj(trType, trProcessedData, doc, accountNameFrom, accountNameTo);
    }
    /**
     *
     * @param {Object} doc
     * @returns {Object|null}
     * @private
     */
    static processTrVoteForBp(doc) {
        const tracedDataRequiredFields = [
            'producers',
            'voter',
        ];
        const actionTraces = doc.action_traces;
        if (actionTraces.length !== 1 || !actionTraces[0]) {
            throw new TrTracesProcessorError('Action traces length !== 1 or there is no action trace with index 0', actionTraces);
        }
        const act = actionTraces[0].act;
        if (!act) {
            throw new TrTracesProcessorError('There is no act field inside action traces', actionTraces[0]);
        }
        const traceData = act.data;
        if (!traceData) {
            throw new TrTracesProcessorError('There is no data inside act', act);
        }
        TrTracesProcessor.checkRequiredFields(tracedDataRequiredFields, traceData);
        const trProcessedData = {
            producers: traceData.producers,
        };
        return TrTracesProcessor.getProcessedObj(blockchainTrTracesDictionary.getTypeVoteForBp(), trProcessedData, doc, traceData.voter);
    }
    /**
     *
     * @param {Object} doc
     * @returns {Object|null}
     * @private
     */
    static processTrBuyRamBytes(doc) {
        const actionTraces = doc.action_traces;
        if (actionTraces.length !== 1 || !actionTraces[0]) {
            throw new TrTracesProcessorError('actionTraces.length !== 1 || !actionTraces[0]', actionTraces);
        }
        const act = actionTraces[0].act;
        if (!act) {
            throw new TrTracesProcessorError('!act', actionTraces[0]);
        }
        const traceData = act.data;
        if (!traceData) {
            throw new TrTracesProcessorError('!traceData', act);
        }
        const tracedDataRequiredFields = [
            'payer',
            'receiver',
            'bytes',
        ];
        TrTracesProcessor.checkRequiredFields(tracedDataRequiredFields, traceData);
        const inlineTraces = actionTraces[0].inline_traces;
        if (!inlineTraces || inlineTraces.length !== 2 || inlineTraces.length === 0) {
            throw new TrTracesProcessorError('!inlineTraces || inlineTraces.length !== 2 || inlineTraces.length === 0', actionTraces[0]);
        }
        if (!inlineTraces[0] || !inlineTraces[0].act || !inlineTraces[0].act.data || !inlineTraces[0].act.data.quantity) {
            throw new TrTracesProcessorError('!inlineTraces[0] || !inlineTraces[0].act || !inlineTraces[0].act.data || !inlineTraces[0].act.data.quantity', actionTraces[0]);
        }
        if (!inlineTraces[1] || !inlineTraces[1].act || !inlineTraces[1].act.data || !inlineTraces[1].act.data.quantity) {
            throw new TrTracesProcessorError('!inlineTraces[1] || !inlineTraces[1].act || !inlineTraces[1].act.data || !inlineTraces[1].act.data.quantity', actionTraces[0]);
        }
        const tokensAmount = TrTracesProcessor.getTokensAmountFromString(inlineTraces[0].act.data.quantity)
            + TrTracesProcessor.getTokensAmountFromString(inlineTraces[1].act.data.quantity);
        if (traceData.payer !== traceData.receiver) {
            throw new TrTracesProcessorError('traceData.payer !== traceData.receiver', traceData);
        }
        const trProcessedData = {
            resources: {
                ram: {
                    dimension: 'kB',
                    amount: traceData.bytes / 1024,
                    tokens: {
                        amount: tokensAmount,
                        currency: CURRENCY__UOS,
                    },
                },
            },
        };
        return TrTracesProcessor.getProcessedObj(blockchainTrTracesDictionary.getTypeBuyRamBytes(), trProcessedData, doc, traceData.payer, traceData.receiver);
    }
    /**
     *
     * @param {Object} doc
     * @returns {Object|null}
     * @private
     */
    static processTrSellRamBytes(doc) {
        const actionTraces = doc.action_traces;
        if (actionTraces.length !== 1 || !actionTraces[0]) {
            throw new TrTracesProcessorError('actionTraces.length !== 1 || !actionTraces[0]', actionTraces);
        }
        const act = actionTraces[0].act;
        if (!act) {
            throw new TrTracesProcessorError('!act', actionTraces[0]);
        }
        const traceData = act.data;
        if (!traceData) {
            throw new TrTracesProcessorError(!traceData, act);
        }
        const tracedDataRequiredFields = [
            'account',
            'bytes',
        ];
        TrTracesProcessor.checkRequiredFields(tracedDataRequiredFields, traceData);
        const inlineTraces = actionTraces[0].inline_traces;
        if (!inlineTraces || inlineTraces.length !== 2 || inlineTraces.length === 0) {
            throw new TrTracesProcessorError('!inlineTraces || inlineTraces.length !== 2 || inlineTraces.length === 0', actionTraces[0]);
        }
        // process inline traces
        if (!inlineTraces[0] || !inlineTraces[0].act || !inlineTraces[0].act.data || !inlineTraces[0].act.data.quantity || !inlineTraces[0].act.data.memo) {
            throw new TrTracesProcessorError('!inlineTraces[0] || !inlineTraces[0].act || !inlineTraces[0].act.data || !inlineTraces[0].act.data.quantity || !inlineTraces[0].act.data.memo', actionTraces[0]);
        }
        if (!inlineTraces[1] || !inlineTraces[1].act || !inlineTraces[1].act.data || !inlineTraces[1].act.data.quantity || !inlineTraces[1].act.data.memo) {
            throw new TrTracesProcessorError('!inlineTraces[1] || !inlineTraces[1].act || !inlineTraces[1].act.data || !inlineTraces[1].act.data.quantity || !inlineTraces[1].act.data.memo', actionTraces[0]);
        }
        let tokensAmount = 0;
        const inlineTraceOneQuantity = TrTracesProcessor.getTokensAmountFromString(inlineTraces[0].act.data.quantity);
        const inlineTraceTwoQuantity = TrTracesProcessor.getTokensAmountFromString(inlineTraces[1].act.data.quantity);
        let isFee = false;
        if (inlineTraces[0].act.data.memo.includes('fee')) {
            tokensAmount -= inlineTraceOneQuantity;
            isFee = true;
        }
        else {
            tokensAmount += inlineTraceOneQuantity;
        }
        if (inlineTraces[1].act.data.memo.includes('fee')) {
            tokensAmount -= inlineTraceTwoQuantity;
            isFee = true;
        }
        else {
            tokensAmount += inlineTraceTwoQuantity;
        }
        if (!isFee) {
            throw new TrTracesProcessorError('!isFee');
        }
        if (tokensAmount <= 0) {
            throw new TrTracesProcessorError('tokensAmount <= 0');
        }
        const trProcessedData = {
            resources: {
                ram: {
                    dimension: 'kB',
                    amount: traceData.bytes / 1024,
                    tokens: {
                        amount: tokensAmount,
                        currency: CURRENCY__UOS,
                    },
                },
            },
        };
        return TrTracesProcessor.getProcessedObj(blockchainTrTracesDictionary.getTypeSellRam(), trProcessedData, doc, traceData.account, traceData.account);
    }
    /**
     * #task - merge all stake/unstake operations in one processor
     * @param {Object} doc
     * @returns {Object}
     * @private
     */
    static processStakeWithUnstake(doc) {
        const actNames = doc.action_traces.map((trace) => {
            return trace.act.name;
        });
        if (actNames[0] === actNames[1] && ~['delegatebw', 'undelegatebw'].indexOf(actNames[0])) {
            // in future it is better to process all stake types in one request, not in separate ones
            return null;
        }
        if (~actNames.indexOf('buyram')) {
            // There are transactions with buyram plus undelegatebw
            return;
        }
        if (!~actNames.indexOf('delegatebw') || !~actNames.indexOf('undelegatebw')) {
            throw new TrTracesProcessorError('processStakeWithUnstake. There is no stake or unstake trace inside', doc.action_traces);
        }
        const traces = doc.action_traces;
        const stakeData = traces.find(trace => trace.act.name === 'delegatebw').act.data;
        const unstakeData = traces.find(trace => trace.act.name === 'undelegatebw').act.data;
        if (!stakeData || !unstakeData) {
            throw new TrTracesProcessorError('processStakeWithUnstake. There is no stake or unstake trace inside', traces);
        }
        const stakeCpu = TrTracesProcessor.getTokensAmountFromString(stakeData.stake_cpu_quantity);
        const stakeNet = TrTracesProcessor.getTokensAmountFromString(stakeData.stake_net_quantity);
        const unstakeCpu = TrTracesProcessor.getTokensAmountFromString(unstakeData.unstake_cpu_quantity);
        const unstakeNet = TrTracesProcessor.getTokensAmountFromString(unstakeData.unstake_net_quantity);
        const trProcessedData = {
            resources: {
                cpu: {
                    tokens: {
                        self_delegated: stakeCpu,
                        currency: CURRENCY__UOS,
                    },
                    unstaking_request: {
                        amount: unstakeCpu,
                        currency: CURRENCY__UOS,
                    },
                },
                net: {
                    tokens: {
                        self_delegated: stakeNet,
                        currency: CURRENCY__UOS,
                    },
                    unstaking_request: {
                        amount: unstakeNet,
                        currency: CURRENCY__UOS,
                    },
                },
            },
        };
        return TrTracesProcessor.getProcessedObj(blockchainTrTracesDictionary.getTypeStakeWithUnstake(), trProcessedData, doc, unstakeData.from, unstakeData.receiver);
    }
    /**
     *
     * @param doc
     * @private
     */
    static processTrClaimEmission(doc) {
        const actionTrace = doc.action_traces.find(trace => trace.act.name === 'withdrawal');
        if (!actionTrace) {
            throw new TrTracesProcessorError('There is no trace with name withdrawal', doc.action_traces);
        }
        const traceData = actionTrace.act.data;
        const inlineTrace = doc.action_traces[0].inline_traces.find(trace => trace.act.name === 'issue');
        if (!inlineTrace) {
            throw new TrTracesProcessorError('There is no inline trace with act name issue', doc.action_traces[0]);
        }
        const tokenEmission = TrTracesProcessor.getTokensAmountFromString(inlineTrace.act.data.quantity);
        const trProcessedData = {
            tokens: {
                emission: tokenEmission,
                currency: CURRENCY__UOS,
            },
        };
        return TrTracesProcessor.getProcessedObj(blockchainTrTracesDictionary.getTypeClaimEmission(), trProcessedData, doc, null, traceData.owner);
    }
    /**
     *
     * @param doc
     * @private
     */
    static processNewAccount(doc) {
        // Data is hashed. It is required to fetch data from somewhere else
        // So it is almost useless "trace"
        const trProcessedData = {};
        return TrTracesProcessor.getProcessedObj(blockchainTrTracesDictionary.getTypeMyselfRegistration(), trProcessedData, doc, null, null);
    }
    /**
     *
     * @param {Object} doc
     * @returns {void}
     * @private
     */
    static checkDocCommonFields(doc) {
        const docRequiredFields = [
            'id',
            '_id',
            'createdAt',
        ];
        TrTracesProcessor.checkRequiredFields(docRequiredFields, doc);
    }
    /**
     *
     * @param {string[]} expected
     * @param {Object} actual
     * @returns {void}
     *
     * @private
     */
    static checkRequiredFields(expected, actual) {
        for (let i = 0; i < expected.length; i += 1) {
            const field = expected[i];
            if ((typeof actual[field]) !== 'undefined') {
                continue;
            }
            throw new TrTracesProcessorError(`There is no field ${field} inside action trace`, actual);
        }
    }
    /**
     *
     * @param {number} trType
     * @param {Object} trProcessedData
     * @param {Object} doc
     * @param {string|null} accountNameFrom
     * @param {string|null} accountNameTo
     * @param memo
     * @returns {Object}
     * @private
     */
    static getProcessedObj(trType, trProcessedData, doc, accountNameFrom, accountNameTo = null, memo = '') {
        const executedAtMoment = moment(doc.block_data.executed_at);
        const mongoDbCreatedAtMoment = moment(doc.createdAt);
        return {
            memo,
            tr_type: trType,
            tr_processed_data: trProcessedData,
            tr_id: doc.id,
            external_id: doc._id.toString(),
            account_name_from: accountNameFrom,
            account_name_to: accountNameTo,
            raw_tr_data: doc,
            tr_executed_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
            mongodb_created_at: mongoDbCreatedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
        };
    }
    /**
     *
     * @param {string} stringValue
     * @param {string} token
     * @return {number}
     */
    static getTokensAmountFromString(stringValue, token = CURRENCY__UOS) {
        const value = stringValue.replace(` ${token}`, '');
        return +value;
    }
}
module.exports = TrTracesProcessor;
