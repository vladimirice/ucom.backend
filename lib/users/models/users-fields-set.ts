import { IModelFieldsSet } from '../../common/interfaces/models-dto';

const fieldsSet: IModelFieldsSet = {
  // Editable by a user request
  nickname: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  first_name: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  last_name: {
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
  birthday: {
    type: 'datetime',
    request: {
      sanitizationType: 'any',
    },
  },
  about: {
    type: 'string',
    request: {
      sanitizationType: 'html',
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
  mood_message: {
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
  currency_to_show: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  first_currency: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  first_currency_year: {
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
  achievements_filename: {
    type: 'string',
    request: {
      sanitizationType: 'text',
    },
  },
  is_tracking_allowed: {
    type: 'boolean',
    request: {
      sanitizationType: 'boolean',
    },
  },

  // not editable by user request
  id: {
    type: 'number',
  },
  account_name: {
    type: 'string',
  },
  current_rate: {
    type: 'number',
  },
  private_key: {
    type: 'string',
  },
  blockchain_registration_status: {
    type: 'string',
  },
  owner_public_key: {
    type: 'string',
  },
  created_at: {
    type: 'datetime',
  },
  updated_at: {
    type: 'datetime',
  },
  public_key: {
    type: 'string',
  },
};

class UsersFieldsSet {
  public static getAllFieldsSet(): IModelFieldsSet {
    return fieldsSet;
  }
}

export = UsersFieldsSet;
