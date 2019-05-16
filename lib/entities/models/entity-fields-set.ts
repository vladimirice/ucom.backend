import { IModelFieldsSet } from '../../common/interfaces/models-dto';

const fieldsSet: IModelFieldsSet = {
  avatar_filename: {
    type: 'string',
    request: {
      sanitizationType: 'text',
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
  id: {
    type: 'number',
    request: {
      sanitizationType: 'number',
    },
  },
  nickname: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  title: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  avatar_filename_from_file: {
    type: 'boolean',
    request: {
      sanitizationType: 'boolean',
    },
  },
  description: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  source_type: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
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
  // not editable by user request
  source_type_id: {
    type: 'number',
  },
  source_group_id: {
    type: 'number',
  },
  source_entity_id: {
    type: 'number',
  },
  source_entity_name: {
    type: 'string',
  },
  text_data: {
    type: 'string',
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
