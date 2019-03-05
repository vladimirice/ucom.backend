import TotalCurrentParamsRepository = require('../../repository/total-current-params-repository');

const { ParamTypes } = require('ucom.libs.common').Stats.Dictionary;

function generateRandomNumber(min: number, max: number, precision: number = 0): number {
  return +(Math.random() * (max - min) + min).toFixed(precision);
}

// @ts-ignore
const sample = {
  // ========== Users ============
  [ParamTypes.USERS_PERSON__NUMBER]: {
    event_type: ParamTypes.USERS_PERSON__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.USERS_PERSON__DELTA_PT24H]: {
    event_type: ParamTypes.USERS_PERSON__DELTA_PT24H,
    value: generateRandomNumber(20, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-03-01T14:07:25Z',
  },

  // ========= Organizations (Orgs) ============
  [ParamTypes.ORGS_PERSON__NUMBER]: {
    event_type: ParamTypes.ORGS_PERSON__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.ORGS_PERSON__DELTA_PT24H]: {
    event_type: ParamTypes.ORGS_PERSON__DELTA_PT24H,
    value: generateRandomNumber(20, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-03-01T14:07:25Z',
  },

  // ========= Tags ============
  [ParamTypes.TAGS_PERSON__NUMBER]: {
    event_type: ParamTypes.TAGS_PERSON__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.TAGS_PERSON__DELTA_PT24H]: {
    event_type: ParamTypes.TAGS_PERSON__DELTA_PT24H,
    value: generateRandomNumber(20, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-03-01T14:07:25Z',
  },

  // ========= Comments ============
  [ParamTypes.COMMENTS_PARENT__NUMBER]: {
    event_type: ParamTypes.COMMENTS_PARENT__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.COMMENTS_PARENT__DELTA_PT24H]: {
    event_type: ParamTypes.COMMENTS_PARENT__DELTA_PT24H,
    value: generateRandomNumber(20, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-03-01T14:07:25Z',
  },

  // Replies
  [ParamTypes.COMMENTS_REPLY__NUMBER]: {
    event_type: ParamTypes.COMMENTS_REPLY__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.COMMENTS_REPLY__DELTA_PT24H]: {
    event_type: ParamTypes.COMMENTS_REPLY__DELTA_PT24H,
    value: generateRandomNumber(10, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-03-01T14:07:25Z',
  },

  // ========== Posts ===============
  [ParamTypes.POSTS_MEDIA__NUMBER]: {
    event_type: ParamTypes.POSTS_MEDIA__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.POSTS_MEDIA__DELTA_PT24H]: {
    event_type: ParamTypes.POSTS_MEDIA__DELTA_PT24H,
    value: generateRandomNumber(10, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-02-27T11:07:25Z',
  },

  [ParamTypes.POSTS_DIRECT__NUMBER]: {
    event_type: ParamTypes.POSTS_DIRECT__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.POSTS_DIRECT__DELTA_PT24H]: {
    event_type: ParamTypes.POSTS_DIRECT__DELTA_PT24H,
    value: generateRandomNumber(10, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-02-27T11:07:25Z',
  },

  // ======= Reposts ===========
  [ParamTypes.POSTS_REPOST_MEDIA__NUMBER]: {
    event_type: ParamTypes.POSTS_REPOST_MEDIA__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.POSTS_REPOST_MEDIA__DELTA_PT24H]: {
    event_type: ParamTypes.POSTS_REPOST_MEDIA__DELTA_PT24H,
    value: generateRandomNumber(10, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-02-27T11:07:25Z',
  },

  [ParamTypes.POSTS_REPOST_DIRECT__NUMBER]: {
    event_type: ParamTypes.POSTS_REPOST_DIRECT__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.POSTS_REPOST_DIRECT__DELTA_PT24H]: {
    event_type: ParamTypes.POSTS_REPOST_DIRECT__DELTA_PT24H,
    value: generateRandomNumber(10, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-02-27T11:07:25Z',
  },

  // Upvotes
  [ParamTypes.ACTIVITIES_VOTE_UPVOTE__NUMBER]: {
    event_type: ParamTypes.ACITVITIES_VOTE_UPVOTE__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.ACTIVITIES_VOTE_UPVOTE__DELTA_PT24H]: {
    event_type: ParamTypes.ACITVITIES_VOTE_UPVOTE__DELTA_PT24H,
    value: generateRandomNumber(10, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-02-27T11:07:25Z',
  },

  // Downvotes
  [ParamTypes.ACTIVITIES_VOTE_DOWNVOTE__NUMBER]: {
    event_type: ParamTypes.ACITVITIES_VOTE_DOWNVOTE__NUMBER,
    value: generateRandomNumber(100, 200),
    recalc_interval: 'PT1H',
    created_at: '2019-02-27T11:07:25Z',
  },
  [ParamTypes.ACTIVITIES_VOTE_DOWNVOTE__DELTA_PT24H]: {
    event_type: ParamTypes.ACITVITIES_VOTE_DOWNVOTE__DELTA_PT24H,
    value: generateRandomNumber(10, 50),
    recalc_interval: 'PT1H',
    window_interval: 'PT24H',
    created_at: '2019-02-27T11:07:25Z',
  },
};

class StatsFetchTotal {
  public static async fetchManyTotal(): Promise<any> {
    return TotalCurrentParamsRepository.findAllAndFlattenJsonValue();
  }
}

export = StatsFetchTotal;
