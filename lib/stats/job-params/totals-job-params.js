"use strict";
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const UsersRepository = require("../../users/users-repository");
const OrganizationsRepository = require("../../organizations/repository/organizations-repository");
const PostsRepository = require("../../posts/posts-repository");
const TagsRepository = require("../../tags/repository/tags-repository");
const CommentsRepository = require("../../comments/comments-repository");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const { ParamTypes } = require('ucom.libs.common').Stats.Dictionary;
const RECALC_INTERVAL = 'PT1H';
/*

кол-во профилей
кол-во комьюнити, публикаций, постов, тегов
кол-во комментов/реплаев/тотал
кол-во оценов - лайк дизлайк тотал
шеры - посты/публикации/тотал

 */
const eventGroup = EventParamGroupDictionary.getNotDetermined();
const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
const currentNumberSet = [
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.USERS_PERSON__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'USERS_PERSON__NUMBER',
        providerFunc: UsersRepository.countAll,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.ORGS_PERSON__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'ORGS_PERSON__NUMBER',
        providerFunc: OrganizationsRepository.countAllWithoutFilter,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.POSTS_MEDIA__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'POSTS_MEDIA__NUMBER',
        providerFunc: PostsRepository.countAllMediaPosts,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.POSTS_DIRECT__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'POSTS_DIRECT__NUMBER',
        providerFunc: PostsRepository.countAllDirectPosts,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.TAGS_PERSON__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'TAGS_PERSON__NUMBER',
        providerFunc: TagsRepository.countAllWithoutFilter,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.COMMENTS_PARENT__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'COMMENTS_PARENT__NUMBER',
        providerFunc: CommentsRepository.countAllCommentsWithoutParent,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.COMMENTS_REPLY__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'COMMENTS_REPLY__NUMBER',
        providerFunc: CommentsRepository.countAllReplies,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.ACTIVITIES_VOTE_UPVOTE__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'ACTIVITIES_VOTE_UPVOTE__NUMBER',
        providerFunc: UsersActivityRepository.countAllUpvotes,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.ACTIVITIES_VOTE_DOWNVOTE__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'ACTIVITIES_VOTE_DOWNVOTE__NUMBER',
        providerFunc: UsersActivityRepository.countAllDownvotes,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.ACTIVITIES_VOTE_DOWNVOTE__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'ACTIVITIES_VOTE_DOWNVOTE__NUMBER',
        providerFunc: UsersActivityRepository.countAllDownvotes,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.POSTS_REPOST_MEDIA__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'POSTS_REPOST_MEDIA__NUMBER',
        providerFunc: PostsRepository.countAllRepostsOfMediaPosts,
    },
    {
        eventGroup,
        eventSuperGroup,
        eventType: ParamTypes.POSTS_REPOST_DIRECT__NUMBER,
        recalcInterval: RECALC_INTERVAL,
        description: 'POSTS_REPOST_DIRECT__NUMBER',
        providerFunc: PostsRepository.countAllRepostsByDirectPosts,
    },
];
class TotalsJobParams {
    static getCurrentNumberSet() {
        return currentNumberSet;
    }
}
module.exports = TotalsJobParams;
