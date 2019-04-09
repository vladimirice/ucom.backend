import { AirdropsUserToChangeStatusDto } from '../../interfaces/dto-interfaces';

const { BackendApi, EosClient } = require('ucom-libs-wallet');

const EosApi = require('../../../eos/eosApi');

class AirdropsTransactionsSender {
  public static async sendTransaction(
    item: AirdropsUserToChangeStatusDto,
  ): Promise<any> {
    // #task - github airdrop only
    const accountNameFrom = EosApi.getGithubAirdropAccountName();
    const privateKey = EosApi.getGithubAirdropActivePrivateKey();
    const permission = 'active';

    // Inside blockchain airdrop_id record has this 'composed' meaning
    const composedAirdropId: number = +`${item.airdrop_id}${item.symbol_id}`;

    const signed = await BackendApi.getSignedAirdropTransaction(
      accountNameFrom,
      privateKey,
      permission,

      item.id,
      composedAirdropId,
      item.account_name_to,
      item.amount,
      item.symbol_title,
    );

    return EosClient.pushTransaction(signed);
  }
}

export = AirdropsTransactionsSender;
