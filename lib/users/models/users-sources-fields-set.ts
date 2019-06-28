import { IModelFieldsSet } from '../../common/interfaces/models-dto';

const fieldsSet: IModelFieldsSet = {
  // Editable by a user request
  source_url: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  is_official: {
    type: 'boolean',
    request: {
      sanitizationType: 'boolean',
    },
  },
  source_type_id: {
    type: 'number',
    request: {
      sanitizationType: 'any', // it is possible to be nullable #task
    },
  },
  // Not editable by a user request
  id: {
    type: 'number',
  },
  user_id: {
    type: 'number',
  },
  created_at: {
    type: 'any',
  },
  updated_at: {
    type: 'any',
  },
};

class UsersSourcesFields {
  public static getAllFieldsSet(): IModelFieldsSet {
    return fieldsSet;
  }
}

export = UsersSourcesFields;
