/* eslint-disable no-console */
import { ContentTypesDictionary } from 'ucom.libs.common';
import { TotalParametersResponse } from '../../../common/interfaces/response-interfaces';

import EosApi = require('../../../eos/eosApi');
import knex = require('../../../../config/knex');
import PostsModelProvider = require('../posts-model-provider');
import UsersModelProvider = require('../../../users/users-model-provider');
import OrganizationsModelProvider = require('../../../organizations/service/organizations-model-provider');

const { PublicationsApi } = require('ucom-libs-wallet').Content;
const { EosClient, WalletApi } = require('ucom-libs-wallet');
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

const moment = require('moment');

class DirectPostResendingService {
  public static async resendDirectPostsForUser(
    createdAtLessOrEqualThan: string,
    limit: number,
    printPushResponse: boolean = false,
    offset: number = 0,
  ): Promise<TotalParametersResponse> {
    EosApi.initBlockchainLibraries();

    const stateBefore = await WalletApi.getAccountState(EosApi.getHistoricalSenderAccountName());
    console.log(`Account sources: ${EosApi.getHistoricalSenderAccountName()}`);
    console.dir(stateBefore.resources);

    const manyPosts = await this.getManyDirectPostsForUser(createdAtLessOrEqualThan, limit, offset);

    await this.resendPostsOneByOneForUser(manyPosts, printPushResponse);

    return {
      totalProcessedCounter: manyPosts.length,
      totalSkippedCounter: 0,
    };
  }

  public static async resendDirectPostsForOrganizations(
    createdAtLessOrEqualThan: string,
    limit: number,
    printPushResponse: boolean = false,
    offset: number = 0,
  ): Promise<TotalParametersResponse> {
    EosApi.initBlockchainLibraries();

    const manyPosts = await this.getManyDirectPostsForOrganization(createdAtLessOrEqualThan, limit, offset);

    await this.resendPostsOneByOneForOrganizations(manyPosts, printPushResponse);

    return {
      totalProcessedCounter: manyPosts.length,
      totalSkippedCounter: 0,
    };
  }

  private static getManyDirectPostsForUser(createdAtLessOrEqualThan: string, limit: number, offset: number) {
    return knex(`${PostsModelProvider.getTableName()} AS p`)
      .select([
        'p.blockchain_id as blockchain_id',
        'p.description as description',
        'p.entity_images AS entity_images',
        knex.raw("COALESCE(p.entity_tags, '{}'::text[]) AS entity_tags"),
        'p.created_at AS created_at',
        'p.updated_at AS updated_at',
        'u.account_name AS account_name_from',
        'for.account_name AS account_name_to',
      ])
      .innerJoin(`${UsersModelProvider.getTableName()} AS u`, 'u.id', 'p.user_id')
      .innerJoin(`${UsersModelProvider.getTableName()} AS for`, 'for.id', 'p.entity_id_for')
      .where('p.entity_name_for', EntityNames.USERS)
      .where('p.post_type_id', ContentTypesDictionary.getTypeDirectPost())
      .where('p.created_at', '<=', createdAtLessOrEqualThan)
      .orderBy('p.id', 'ASC')
      .limit(limit)
      .offset(offset)
    ;
  }

  private static getManyDirectPostsForOrganization(createdAtLessOrEqualThan: string, limit: number, offset: number) {
    return knex(`${PostsModelProvider.getTableName()} AS p`)
      .select([
        'p.blockchain_id as blockchain_id',
        'p.description as description',
        'p.entity_images AS entity_images',
        knex.raw("COALESCE(p.entity_tags, '{}'::text[]) AS entity_tags"),
        'p.created_at AS created_at',
        'p.updated_at AS updated_at',
        'u.account_name AS account_name_from',
        'org.blockchain_id AS organization_id_to',
      ])
      .innerJoin(`${UsersModelProvider.getTableName()} AS u`, 'u.id', 'p.user_id')
      .innerJoin(`${OrganizationsModelProvider.getTableName()} AS org`, 'org.id', 'p.entity_id_for')
      .where('p.entity_name_for', EntityNames.ORGANIZATIONS)
      .where('p.post_type_id', ContentTypesDictionary.getTypeDirectPost())
      .where('p.created_at', '<=', createdAtLessOrEqualThan)
      .orderBy('p.id', 'ASC')
      .limit(limit)
      .offset(offset)
    ;
  }

  private static async resendPostsOneByOneForUser(manyPosts, printPushResponse: boolean) {
    let processedCount = 0;
    for (const post of manyPosts) {
      if (processedCount % 100 === 0) {
        console.log(`Current processed count is: ${processedCount}`);
      }

      post.created_at = moment(post.created_at).utc().format();
      post.updated_at = moment(post.updated_at).utc().format();

      const signedTransaction = await PublicationsApi.signResendDirectPostsToAccount(
        post.account_name_from,
        EosApi.getHistoricalSenderPrivateKey(),
        post.account_name_to,
        post,
        post.blockchain_id,
      );

      const pushingResponse = await EosClient.pushTransaction(signedTransaction);

      if (printPushResponse) {
        console.log(`Transaction id: ${pushingResponse.transaction_id}`);
        console.dir(JSON.stringify(pushingResponse.processed.action_traces[0].act.data));
      }

      processedCount += 1;
    }
  }

  private static async resendPostsOneByOneForOrganizations(manyPosts, printPushResponse: boolean) {
    let processedCount = 0;
    for (const post of manyPosts) {
      if (processedCount % 100 === 0) {
        console.log(`Current processed count is: ${processedCount}`);
      }

      post.created_at = moment(post.created_at).utc().format();
      post.updated_at = moment(post.updated_at).utc().format();

      const signedTransaction = await PublicationsApi.signResendDirectPostsToOrganization(
        post.account_name_from,
        EosApi.getHistoricalSenderPrivateKey(),
        post.organization_id_to,
        post,
        post.blockchain_id,
      );

      const pushingResponse = await EosClient.pushTransaction(signedTransaction);

      if (printPushResponse) {
        console.log(`Transaction id: ${pushingResponse.transaction_id}`);
        console.dir(JSON.stringify(pushingResponse.processed.action_traces[0].act.data));
      }

      processedCount += 1;
    }
  }
}

export = DirectPostResendingService;
