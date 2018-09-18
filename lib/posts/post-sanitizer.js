const sanitizeHtml = require('sanitize-html');
const PostRepository = require('./posts-repository');

const allowedTags = [ 'div', 'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'figure', 'iframe' ];

class PostSanitizer {
  static sanitisePost(params) {
    PostRepository.getModel().getSimpleTextFields().forEach(field => {
      if (params[field]) {
        params[field] = sanitizeHtml(params[field], {
          allowedTags: []
        });
      }
    });
    PostRepository.getModel().getHtmlFields().forEach(field => {
      if (params[field]) {
        params[field] = sanitizeHtml(params[field], {
          allowedTags: allowedTags
        });
      }
    });

    this._sanitizePostOfferFields(params)
  }

  static _sanitizePostOfferFields(params) {
    if (params['action_button_title']) {
      params['action_button_title'] = sanitizeHtml(params['action_button_title'], {
        allowedTags: []
      });
    }

    if (params['action_button_url']) {
      params['action_button_url'] = sanitizeHtml(params['action_button_url'], {
        allowedTags: ['a']
      });
    }
  };
}

module.exports = PostSanitizer;