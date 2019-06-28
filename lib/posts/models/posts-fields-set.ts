import { IModelFieldsSet } from '../../common/interfaces/models-dto';

const fieldsSet: IModelFieldsSet = {
  id: {
    type: 'number',
  },
  post_type_id: {
    type: 'number',
    request: {
      sanitizationType: 'number',
    },
  },
  title: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  description: {
    type: 'string',
    request: {
      sanitizationType: 'html',
    },
  },
  main_image_filename: { // deprecated
    type: 'string',
  },
  current_vote: {
    type: 'number',
  },
  current_rate: {
    type: 'number',
  },
  created_at: {
    type: 'datetime',
  },
  updated_at: {
    type: 'datetime',
  },
  user_id: {
    type: 'number',
  },
  leading_text: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  blockchain_id: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  blockchain_status: { // @deprecated
    type: 'string',
  },
  organization_id: {
    type: 'number',
    request: {
      sanitizationType: 'number',
    },
  },
  entity_id_for: {
    type: 'number',
  },
  entity_name_for: {
    type: 'number',
  },
  parent_id: {
    type: 'number',
  },
  entity_images: {
    type: 'any',
    request: {
      sanitizationType: 'any',
    },
  },
  entity_tags: {
    type: 'any',
  },
};

class PostsFieldsSet {
  public static getAllFieldsSet(): IModelFieldsSet {
    return fieldsSet;
  }
}

export = PostsFieldsSet;
