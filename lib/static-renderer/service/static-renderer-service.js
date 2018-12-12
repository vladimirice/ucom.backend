const config  = require('config');
const fs      = require('fs');

const backendConfig   = config.host;
const frontendConfig  =  config.frontend;

const PostsRepository = require('../../posts/posts-repository');

const contentMetaTagsTemplate = `
      <meta property="og:url" content="{{og_url_value}}" />
      <meta property="og:type" content="{{og_type_value}}" />
      <meta property="og:title" content="{{og_title_value}}" />
      <meta property="og:description" content="{{og_description_value}}" />
      <meta property="og:image" content="{{og_image_value}}" />
    `;

const CONTENT_META_TAGS_PLACEHOLDER = '<!--content_meta_tags-->';

class StaticRendererService {
  /**
   *
   * @param {string} host
   * @param {string} originalUrl
   * @returns {Promise<string>}
   */
  static async getHtml(host, originalUrl) {
    // #task - implement strategy pattern for different urls
    if (!originalUrl.startsWith('/posts/')) {
      throw new Error('Request is not supported');
      // TODO - write to logger and render basic page without any tags
    }

    const postId = +originalUrl.replace('/posts/', '');
    const model = await PostsRepository.findOneById(postId, null, true);

    const metaTagsValues = {
      '{{og_url_value}}': `${host}${originalUrl}`,
      '{{og_type_value}}': 'article',
      '{{og_title_value}}': model.title,
      '{{og_description_value}}': model.leading_text || model.title,
      '{{og_image_value}}': model.main_image_filename ? `${backendConfig.root_url}/upload/${model.main_image_filename}` : ''
    };

    const metaTagsFragment = this._getMetaTagsFragment(metaTagsValues);
    const frontendTemplate = fs.readFileSync(frontendConfig.main_html_filename).toString();

    // TODO - search for this tag. If no - log error and do nothing

    return frontendTemplate.replace(CONTENT_META_TAGS_PLACEHOLDER, metaTagsFragment);
  }

  /**
   *
   * @param {Object} metaTagsValues
   * @returns {string}
   * @private
   */
  static _getMetaTagsFragment(metaTagsValues) {
    const searchString = Object.keys(metaTagsValues).join('|');
    const regex = new RegExp(searchString, 'gi');

    return contentMetaTagsTemplate.replace(regex, function (x) {
      return metaTagsValues[x];
    });
  }

}

module.exports = StaticRendererService;