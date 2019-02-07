const ENTITY_NAME = 'tags      ';
const TABLE_NAME = 'tags';

class TagsModelProvider {
  public static getEntityName(): string {
    return ENTITY_NAME;
  }

  public static getTableName(): string {
    return TABLE_NAME;
  }
}

export = TagsModelProvider;
