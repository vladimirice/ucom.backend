import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

class BlockchainNodesCommon {
  public static getGraphQlNodeAlias(user: UserModel, blockchainNodesType: number): string {
    return `${user.account_name}_${blockchainNodesType}`;
  }
}

export = BlockchainNodesCommon;
