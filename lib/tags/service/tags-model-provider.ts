const ENTITY_NAME = 'tags      ';
const TABLE_NAME = 'tags';

const BLOCKCHAIN_ID_PREFIX = 'tag';

class TagsModelProvider {
  public static getBlockchainIdPrefix(): string {
    return BLOCKCHAIN_ID_PREFIX;
  }

  public static getCurrentParamsTableName(): string {
    return 'tags_current_params';
  }

  public static getEntityName(): string {
    return ENTITY_NAME;
  }

  public static getTableName(): string {
    return TABLE_NAME;
  }
}

export = TagsModelProvider;
