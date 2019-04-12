const ACTION_TRACES_COLLECTION_NAME = 'action_traces';

class MongoExternalModelProvider {
  public static actionTracesCollection(): string {
    return ACTION_TRACES_COLLECTION_NAME;
  }
}

export = MongoExternalModelProvider;
