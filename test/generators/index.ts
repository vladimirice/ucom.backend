export = {
  Posts:        require('./posts-generator'),
  Comments:     require('./comments-generator'),
  Org:          require('./organizations-generator'),
  Common:       require('./common-generator'),

  Entity: {
    Tags:           require('./entity/entity-tags-generator'),
  },
};
