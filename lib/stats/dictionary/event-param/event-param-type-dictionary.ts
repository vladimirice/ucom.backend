const CURRENT_BLOCKCHAIN_IMPORTANCE = 1;
const BACKEND_CALCULATED_IMPORTANCE = 2;

const CURRENT_POST_VOTES            = 3;

/** Exact event description */
class EventParamTypeDictionary {
  public static getCurrentPostVotes(): number {
    return CURRENT_POST_VOTES;
  }

  public static getCurrentBlockchainImportance(): number {
    return CURRENT_BLOCKCHAIN_IMPORTANCE;
  }

  public static getBackendCalculatedImportance(): number {
    return BACKEND_CALCULATED_IMPORTANCE;
  }
}

export = EventParamTypeDictionary;
