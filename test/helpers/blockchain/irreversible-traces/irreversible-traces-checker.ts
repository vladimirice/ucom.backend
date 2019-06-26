import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { UOS } from '../../../../lib/common/dictionary/symbols-dictionary';

import UsersHelper = require('../../../integration/helpers/users-helper');
import CommonChecker = require('../../common/common-checker');

const blockchainTrTypesDictionary = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

class IrreversibleTracesChecker {
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

  private static checkCommonTrTracesFields(trace): void {
    CommonChecker.expectNotEmpty(trace);

    expect(typeof trace.updated_at).toBe('string');
    expect(trace.updated_at.length).toBeGreaterThan(0);
    expect(trace.raw_tr_data).toBeDefined();
  }
}

export = IrreversibleTracesChecker;
