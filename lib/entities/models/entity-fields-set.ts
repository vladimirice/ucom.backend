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
      sanitizationType: 'number',
    },
  },
  source_group_id: {
    type: 'number',
    request: {
      sanitizationType: 'number',
    },
  },
  entity_id: {
    type: 'number',
    request: {
      sanitizationType: 'number',
    },
  },
  entity_name: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  source_entity_id: {
    type: 'number',
    request: {
      sanitizationType: 'number',
    },
  },
  source_entity_name: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  text_data: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  avatar_filename: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },

  // not editable by user request
  id: {
    type: 'number',
  },
  created_at: {
    type: 'datetime',
  },
  updated_at: {
    type: 'datetime',
  },
};

class EntityFieldsSet {
  public static getEntitySourcesFieldsSet(): IModelFieldsSet {
    return fieldsSet;
  }
}

export = EntityFieldsSet;
