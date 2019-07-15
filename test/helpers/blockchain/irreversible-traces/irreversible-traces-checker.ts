import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { UOS } from '../../../../lib/common/dictionary/symbols-dictionary';

import UsersHelper = require('../../../integration/helpers/users-helper');
import CommonChecker = require('../../common/common-checker');

const blockchainTrTypesDictionary = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

class IrreversibleTracesChecker {
  public static checkEmission(trace): void {
    this.checkCommonTrTracesFields(trace);
    expect(trace.tr_type).toBe(blockchainTrTypesDictionary.getTypeClaimEmission());
    expect(trace.memo).toBe('');

    CommonChecker.expectNotEmpty(trace.tokens);

    const expected = {
      currency: UOS,
      emission: 1334.8073,
    };

    expect(trace.tokens).toEqual(expected);
  }

  public static checkBuySellRamTrace(trace, trType: number, expectedBytes: number, expectedUos: number): void {
    this.checkCommonTrTracesFields(trace);
    expect(trace.tr_type).toBe(trType);
    expect(trace.memo).toBe('');

    CommonChecker.expectNotEmpty(trace.resources);

    const expected = {
      ram: {
        amount: +(expectedBytes / 1024).toFixed(4),
        dimension: 'kB',
        tokens: {
          amount: +expectedUos.toFixed(4),
          currency: UOS,
        },
      },
    };

    expect(trace.resources).toEqual(expected);
  }


  public static checkVoteForBps(trace, expectedProducers: string[]) {
    this.checkCommonTrTracesFields(trace);
    expect(trace.tr_type).toBe(blockchainTrTypesDictionary.getTypeVoteForBp());

    expect(trace.memo).toBe('');
    expect(Array.isArray(trace.producers)).toBeTruthy();

    expect(trace.producers.length).toBe(expectedProducers.length);
    expect(trace.producers).toMatchObject(expectedProducers);
  }

  public static checkStakeUnstakeStructure(trace, expectedTrType: number) {
    this.checkCommonTrTracesFields(trace);
    expect(trace.tr_type).toBe(expectedTrType);

    CommonChecker.expectNotEmpty(trace.resources);
    CommonChecker.expectNotEmpty(trace.resources.cpu);
    CommonChecker.expectNotEmpty(trace.resources.cpu.tokens);
    CommonChecker.expectNotEmpty(trace.resources.cpu.unstaking_request);

    CommonChecker.expectNotEmpty(trace.resources.net);
    CommonChecker.expectNotEmpty(trace.resources.net.tokens);
    CommonChecker.expectNotEmpty(trace.resources.net.unstaking_request);

    expect(trace.resources.cpu.tokens.currency).toBe(UOS);
    expect(trace.resources.net.tokens.currency).toBe(UOS);

    expect(trace.resources.cpu.unstaking_request.currency).toBe(UOS);
    expect(trace.resources.net.unstaking_request.currency).toBe(UOS);
  }

  public static checkVoteForCalculators(trace, expectedCalculators: string[]) {
    this.checkCommonTrTracesFields(trace);
    expect(trace.tr_type).toBe(blockchainTrTypesDictionary.getTypeVoteForCalculatorNodes());

    expect(trace.memo).toBe('');
    expect(Array.isArray(trace.calculators)).toBeTruthy();

    expect(trace.calculators.length).toBe(expectedCalculators.length);
    expect(trace.calculators).toMatchObject(expectedCalculators);
  }

  public static checkUosTransferFrom(trace, actsFor: UserModel) {
    this.checkCommonTrTracesFields(trace);
    expect(trace.tr_type).toBe(blockchainTrTypesDictionary.getLabelTransferFrom());

    this.checkUosTransferActionData(trace, true);
    expect(trace.User.account_name).toBe(actsFor.account_name);
  }

  public static checkUosTransferTo(trace, actsFrom: UserModel) {
    this.checkCommonTrTracesFields(trace);

    expect(trace.tr_type).toBe(blockchainTrTypesDictionary.getLabelTransferTo());
    this.checkUosTransferActionData(trace, true);

    expect(trace.User.account_name).toBe(actsFrom.account_name);
  }

  public static checkUosTransferForeign(trace) {
    this.checkCommonTrTracesFields(trace);
    expect(trace.tr_type).toBe(blockchainTrTypesDictionary.getLabelTransferForeign());

    this.checkUosTransferActionData(trace, false);
  }

  private static checkUosTransferActionData(trace, expectUser: boolean) {
    expect(trace.tokens).toBeDefined();
    expect(typeof trace.tokens.active).toBe('number');
    expect(trace.tokens.currency).toBe(UOS);

    if (expectUser) {
      UsersHelper.checkIncludedUserPreview(trace);
    } else {
      expect(trace.User).toBeNull();
    }
  }

  public static checkCommonTrTracesFields(trace): void {
    CommonChecker.expectNotEmpty(trace);

    expect(typeof trace.updated_at).toBe('string');
    expect(trace.updated_at.length).toBeGreaterThan(0);
    expect(trace.updated_at).toMatch('Z');
    expect(trace.raw_tr_data).toBeDefined();
    expect(typeof trace.tr_type).toBe('number');
    expect(trace.tr_type).toBeGreaterThan(0);

    expect(typeof trace.memo).toBe('string');
    expect(trace.memo.length).toBeGreaterThanOrEqual(0);
  }
}

export = IrreversibleTracesChecker;
