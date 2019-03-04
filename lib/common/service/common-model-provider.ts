const ENTITY_NAME = 'all       ';
const FAKE_BLOCKCHAIN_ID = 'not-determined-id';
const FAKE_ENTITY_ID = 1;

class CommonModelProvider {
  public static getEntityName(): string {
    return ENTITY_NAME;
  }

  public static getFakeEntityId(): number {
    return FAKE_ENTITY_ID;
  }

  public static getFakeBlockchainId(): string {
    return FAKE_BLOCKCHAIN_ID;
  }
}

export = CommonModelProvider;
