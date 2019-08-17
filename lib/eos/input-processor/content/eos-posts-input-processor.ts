/* eslint-disable no-case-declarations */
import { AppError, BadRequestError } from '../../../api/errors';
import { UserModel } from '../../../users/interfaces/model-interfaces';
import { IRequestBody } from '../../../common/interfaces/common-types';

import BlockchainUniqId = require('../../eos-blockchain-uniqid');
import EosContentInputProcessor = require('./eos-content-input-processor');
import EosTransactionService = require('../../eos-transaction-service');
import UsersRepository = require('../../../users/users-repository');
import OrganizationsRepository = require('../../../organizations/repository/organizations-repository');

const { TransactionFactory, ContentTypeDictionary } = require('ucom-libs-social-transactions');
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

class EosPostsInputProcessor {
  public static async addSignedTransactionDetailsToBody(
    body: IRequestBody,
    currentUser: UserModel,
    postTypeId: number,
    organizationBlockchainId: string | null = null,
  ): Promise<void> {
    if (postTypeId === ContentTypeDictionary.getTypeRepost()) {
      throw new AppError('Reposts is not supported here. Consider to use different method');
    }

    const transactionDetails = EosContentInputProcessor.getSignedTransactionFromBody(body);

    if (transactionDetails !== null) {
      body.blockchain_id      = transactionDetails.blockchain_id;
      body.signed_transaction = transactionDetails.signed_transaction;

      return;
    }

    if (postTypeId === ContentTypeDictionary.getTypeDirectPost()) {
      await this.addSignedTransactionForDirectPost(
        body,
        currentUser,
      );

      return;
    }

    // noinspection IfStatementWithTooManyBranchesJS
    if (postTypeId === ContentTypeDictionary.getTypeMediaPost()) {
      body.blockchain_id = BlockchainUniqId.getUniqidForMediaPost();
    } else if (postTypeId === ContentTypeDictionary.getTypeOffer()) {
      body.blockchain_id = BlockchainUniqId.getUniqidForPostOffer();
    } else {
      throw new BadRequestError({ post_type_id: `Unsupported post type id: ${postTypeId}` });
    }

    if (organizationBlockchainId) {
      // eslint-disable-next-line no-underscore-dangle
      body.signed_transaction = await TransactionFactory._getSignedOrganizationCreatesContent(
        currentUser.account_name,
        currentUser.private_key,
        organizationBlockchainId,
        body.blockchain_id,
        postTypeId,
      );
    } else {
      // eslint-disable-next-line no-underscore-dangle
      body.signed_transaction = await TransactionFactory._userHimselfCreatesPost(
        currentUser.account_name,
        currentUser.private_key,
        body.blockchain_id,
        postTypeId,
      );
    }
  }

  public static async addSignedTransactionDetailsToBodyForRepost(
    body: IRequestBody,
    currentUser: UserModel,
    parentBlockchainId: string,
  ): Promise<void> {
    const added: boolean = this.addSignedTransactionDetailsFromRequest(body);

    if (added) {
      return;
    }

    await EosTransactionService.appendSignedUserCreatesRepost(
      body,
      currentUser,
      parentBlockchainId,
    );
  }

  private static async addSignedTransactionForDirectPost(
    body: IRequestBody,
    currentUser: UserModel,
  ): Promise<void> {
    switch (body.entity_name_for) {
      case EntityNames.USERS:
        const accountNameFor: string = await UsersRepository.findAccountNameById(body.entity_id_for);

        await EosTransactionService.appendSignedLegacyUserCreatesDirectPostForOtherUser(
          body,
          currentUser,
          accountNameFor,
        );
        break;
      case EntityNames.ORGANIZATIONS:
        const organizationBlockchainId: string = await OrganizationsRepository.findBlockchainIdById(body.entity_id_for);

        await EosTransactionService.appendSignedUserCreatesDirectPostForOrg(
          body,
          currentUser,
          organizationBlockchainId,
        );
        break;
      default:
        throw new AppError(`Unsupported entity_name_for: ${body.entity_name_for}`);
    }
  }

  private static addSignedTransactionDetailsFromRequest(body: IRequestBody): boolean {
    const transactionDetails = EosContentInputProcessor.getSignedTransactionFromBody(body);

    if (transactionDetails === null) {
      return false;
    }

    body.blockchain_id      = transactionDetails.blockchain_id;
    body.signed_transaction = transactionDetails.signed_transaction;

    return true;
  }
}

export  = EosPostsInputProcessor;
