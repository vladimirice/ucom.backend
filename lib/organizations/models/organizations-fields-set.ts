import { IModelFieldsSet } from '../../common/interfaces/models-dto';

import EntityImagesModelProvider = require('../../entity-images/service/entity-images-model-provider');

const fieldsSet: IModelFieldsSet = {
  // Editable by a user request
  avatar_filename: {
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
  currency_to_show: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  powered_by: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  about: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  nickname: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  email: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  phone_number: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  country: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  city: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  address: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  personal_website_url: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  [EntityImagesModelProvider.entityImagesColumn()]: {
    type: 'any',
    request: {
      sanitizationType: 'any',
    },
  },
  blockchain_id: {
    type: 'text',
    request: {
      sanitizationType: 'text',
    },
  },
  signed_transaction: {
    type: 'text',
    request: {
      sanitizationType: 'text',
    },
  },

  // not editable by user request
  id: {
    type: 'number',
  },
  user_id: {
    type: 'number',
  },
  organization_type_id: {
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
};

class OrganizationsFieldsSet {
  public static getAllFieldsSet(): IModelFieldsSet {
    return fieldsSet;
  }
}

export = OrganizationsFieldsSet;
