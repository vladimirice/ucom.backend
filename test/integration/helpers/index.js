
module.exports = {
  RequestHelper:  require('./request-helper'), // @deprecated name
  Req:            require('./request-helper'),

  ResponseHelper: require('./response-helper'), // @deprecated name
  Res: require('./response-helper'),

  PostHelper:     require('./posts-helper'), // @deprecated name
  Post:       require('./posts-helper'), // @deprecated name
  Posts:     require('./posts-helper'),

  UserHelper:     require('./users-helper'), // @deprecated
  Users:           require('./users-helper'),
  ActivityHelper: require('./activity-helper'), // @deprecated

  Activity:       require('./activity-helper'),

  SeedsHelper:    require('./seeds-helper'), // @deprecated name
  Seeds:          require('./seeds-helper'),

  Organizations:  require('./organizations-helper'), // @deprecated name
  Org:            require('./organizations-helper'),
  FileToUpload:  require('./file-to-upload-helper'),
  EosTransaction:  require('./eos-transaction-helpers'),

  Comments:  require('./comments-helper'),

  Mock:  require('./mock-helper'),

  Common: require('./common-helper')
};