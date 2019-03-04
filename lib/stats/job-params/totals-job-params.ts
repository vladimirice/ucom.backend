import { TotalStatsParams } from '../interfaces/dto-interfaces';

import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');

import UsersRepository = require('../../users/users-repository');
import OrganizationsRepository = require('../../organizations/repository/organizations-repository');
import PostsRepository = require('../../posts/posts-repository');
import TagsRepository = require('../../tags/repository/tags-repository');
import CommentsRepository = require('../../comments/comments-repository');
import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import CommonModelProvider = require('../../common/service/common-model-provider');

const { ParamTypes } = require('ucom.libs.common').Stats.Dictionary;

const RECALC_INTERVAL = 'PT1H';
const WINDOW_INTERVAL_ISO = 'PT24H';

const windowIntervalHours = 24;

const entityName = CommonModelProvider.getEntityName();

const eventGroup      =  EventParamGroupDictionary.getNotDetermined();
const eventSuperGroup =  EventParamSuperGroupDictionary.getNotDetermined();

const deltaSet: any[] = [
  {
    entityName,
    windowIntervalHours,
    initialEventType:     ParamTypes.USERS_PERSON__NUMBER,
    windowIntervalIso:    WINDOW_INTERVAL_ISO,
    isFloat: false,
    eventType:            ParamTypes.USERS_PERSON__DELTA_PT24H,

    eventGroup,
    eventSuperGroup,

    recalcInterval:   RECALC_INTERVAL,
    description:      'USERS_PERSON__DELTA_PT24H',
  },
];

const currentNumberSet: TotalStatsParams[] = [
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.USERS_PERSON__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'USERS_PERSON__NUMBER',

    providerFunc:     UsersRepository.countAll,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.ORGS_PERSON__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'ORGS_PERSON__NUMBER',

    providerFunc:     OrganizationsRepository.countAllWithoutFilter,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.POSTS_MEDIA__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'POSTS_MEDIA__NUMBER',

    providerFunc:     PostsRepository.countAllMediaPosts,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.POSTS_DIRECT__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'POSTS_DIRECT__NUMBER',

    providerFunc:     PostsRepository.countAllDirectPosts,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.TAGS_PERSON__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'TAGS_PERSON__NUMBER',

    providerFunc:     TagsRepository.countAllWithoutFilter,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.COMMENTS_PARENT__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'COMMENTS_PARENT__NUMBER',

    providerFunc:     CommentsRepository.countAllCommentsWithoutParent,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.COMMENTS_REPLY__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'COMMENTS_REPLY__NUMBER',

    providerFunc:     CommentsRepository.countAllReplies,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.ACTIVITIES_VOTE_UPVOTE__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'ACTIVITIES_VOTE_UPVOTE__NUMBER',

    providerFunc:     UsersActivityRepository.countAllUpvotes,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.ACTIVITIES_VOTE_DOWNVOTE__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'ACTIVITIES_VOTE_DOWNVOTE__NUMBER',

    providerFunc:     UsersActivityRepository.countAllDownvotes,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.POSTS_REPOST_MEDIA__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'POSTS_REPOST_MEDIA__NUMBER',

    providerFunc:     PostsRepository.countAllRepostsOfMediaPosts,
  },
  {
    eventGroup,
    eventSuperGroup,

    eventType:        ParamTypes.POSTS_REPOST_DIRECT__NUMBER,
    recalcInterval:   RECALC_INTERVAL,
    description:      'POSTS_REPOST_DIRECT__NUMBER',

    providerFunc:     PostsRepository.countAllRepostsByDirectPosts,
  },
];

class TotalsJobParams {
  public static getDeltaSet(): any[] {
    return deltaSet;
  }

  public static getCurrentNumberSet(): TotalStatsParams[] {
    return currentNumberSet;
  }
}

export = TotalsJobParams;
