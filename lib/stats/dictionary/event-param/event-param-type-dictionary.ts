const CURRENT_BLOCKCHAIN_IMPORTANCE   = 1;
const POST_VOTES_CURRENT_AMOUNT       = 3;
const POST_REPOSTS_CURRENT_AMOUNT     = 4;
const POST_COMMENTS_CURRENT_AMOUNT    = 5;
const ORG_POSTS_CURRENT_AMOUNT        = 6;
const ORG_FOLLOWERS_CURRENT_AMOUNT    = 7;
const TAG_ITSELF_CURRENT_AMOUNTS      = 8;
const POST_CURRENT_ACTIVITY_INDEX     = 9;
const ORG_CURRENT_ACTIVITY_INDEX      = 10;
const TAG_CURRENT_ACTIVITY_INDEX      = 11;
const BLOCKCHAIN_IMPORTANCE_DELTA     = 12;
const POST_UPVOTES_DELTA              = 13;
const POST_ACTIVITY_INDEX_DELTA       = 14;
const ORG_POSTS_TOTAL_AMOUNT_DELTA    = 15;
const ORG_ACTIVITY_INDEX_DELTA        = 16;
const TAG_ACTIVITY_INDEX_DELTA        = 17;
const TAG_IMPORTANCE_DELTA            = 18;
const TAG_POSTS_TOTAL_AMOUNT_DELTA    = 19;
const USERS_POSTS_CURRENT_AMOUNT      = 20;
const USER_HIMSELF_CURRENT_AMOUNTS    = 21;
const USERS_POSTS_TOTAL_AMOUNT_DELTA  = 22;
const USERS_SCALED_IMPORTANCE_DELTA   = 23;
const USERS_SCALED_SOCIAL_RATE_DELTA  = 24;
/** Exact event description */
class EventParamTypeDictionary {
  public static getTagItselfCurrentAmounts(): number {
    return TAG_ITSELF_CURRENT_AMOUNTS;
  }

  public static getUserHimselfCurrentAmounts(): number {
    return USER_HIMSELF_CURRENT_AMOUNTS;
  }

  public static getOrgFollowersCurrentAmount(): number {
    return ORG_FOLLOWERS_CURRENT_AMOUNT;
  }

  public static getOrgPostsCurrentAmount(): number {
    return ORG_POSTS_CURRENT_AMOUNT;
  }

  public static getUsersPostsCurrentAmount(): number {
    return USERS_POSTS_CURRENT_AMOUNT;
  }

  public static getPostVotesCurrentAmount(): number {
    return POST_VOTES_CURRENT_AMOUNT;
  }

  public static getPostRepostsCurrentAmount(): number {
    return POST_REPOSTS_CURRENT_AMOUNT;
  }

  public static getPostCommentsCurrentAmount(): number {
    return POST_COMMENTS_CURRENT_AMOUNT;
  }

  public static getPostCurrentActivityIndex(): number {
    return POST_CURRENT_ACTIVITY_INDEX;
  }

  public static getOrgCurrentActivityIndex(): number {
    return ORG_CURRENT_ACTIVITY_INDEX;
  }

  public static getTagCurrentActivityIndex(): number {
    return TAG_CURRENT_ACTIVITY_INDEX;
  }

  public static getCurrentBlockchainImportance(): number {
    return CURRENT_BLOCKCHAIN_IMPORTANCE;
  }

  public static getBlockchainImportanceDelta(): number {
    return BLOCKCHAIN_IMPORTANCE_DELTA;
  }

  public static getPostUpvotesDelta(): number {
    return POST_UPVOTES_DELTA;
  }

  public static getPostActivityIndexDelta(): number {
    return POST_ACTIVITY_INDEX_DELTA;
  }

  public static getOrgsActivityIndexDelta(): number {
    return ORG_ACTIVITY_INDEX_DELTA;
  }

  public static getTagsActivityIndexDelta(): number {
    return TAG_ACTIVITY_INDEX_DELTA;
  }

  public static getOrgPostsTotalAmountDelta(): number {
    return ORG_POSTS_TOTAL_AMOUNT_DELTA;
  }

  public static getUsersPostsTotalAmountDelta(): number {
    return USERS_POSTS_TOTAL_AMOUNT_DELTA;
  }

  public static getTagsImportanceDelta(): number {
    return TAG_IMPORTANCE_DELTA;
  }

  public static getUsersScaledImportanceDelta(): number {
    return USERS_SCALED_IMPORTANCE_DELTA;
  }

  public static getUsersScaledSocialRateDelta(): number {
    return USERS_SCALED_SOCIAL_RATE_DELTA;
  }

  public static getTagPostsTotalAmountDelta(): number {
    return TAG_POSTS_TOTAL_AMOUNT_DELTA;
  }
}

export = EventParamTypeDictionary;
