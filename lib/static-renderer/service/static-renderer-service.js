const config      = require('config');
const fs          = require('fs');
const appRootPath = require('app-root-path');

const backendConfig   = config.host;
const frontendConfig  =  config.frontend;

let frontendMainHtml;
if (process.env.NODE_ENV === 'test') {
  frontendMainHtml = appRootPath + '/test/integration/static-renderer/template-sample.html';
} else {
  frontendMainHtml = frontendConfig.main_html_filename;
}

const PostsRepository = require('../../posts/posts-repository');
const { ApiLogger }  = require('../../../config/winston');

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
    let frontendTemplate;

    try {
      frontendTemplate = fs.readFileSync(frontendMainHtml).toString();

      // #task - implement strategy pattern for different urls
      if (!originalUrl.startsWith('/posts/')) {
        throw new Error(`It is not possible to pre-render. Unknown originalUrl pattern. Url is: ${originalUrl}`);
      }

      const modelId = +originalUrl.replace('/posts/', '');

      if((modelId ^ 0) !== modelId) {
        throw new Error(`Malformed model ID. Url is: ${originalUrl}. Extracted ID is: ${modelId}`);
      }

      const model = await PostsRepository.findOneById(modelId, null, true);
      if (!model) {
        throw new Error(`Not possible to model matching url: ${originalUrl}. Extracted model ID is: ${modelId}`);
      }

      const mainImageUrl = this._extractMainImageUrl(model);

      const metaTagsValues = {
        '{{og_url_value}}': `${host}${originalUrl}`,
        '{{og_type_value}}': 'article',
        '{{og_title_value}}': model.title,
        '{{og_description_value}}': model.leading_text || model.title,
        '{{og_image_value}}': mainImageUrl
      };

      const metaTagsFragment = this._getMetaTagsFragment(metaTagsValues);

      if (!frontendTemplate.includes(CONTENT_META_TAGS_PLACEHOLDER)) {
        throw new Error(
          `There is no content meta tags placeholder inside frontendTemplate. Filename is: ${frontendMainHtml}. Searching for ${CONTENT_META_TAGS_PLACEHOLDER}`
        );
      }

      return frontendTemplate.replace(CONTENT_META_TAGS_PLACEHOLDER, metaTagsFragment);
    } catch (e) {
      if (!frontendTemplate) {
        e.message += ' There is no frontend template - not possible to render anything. Lets rethrow the error';
        throw e;
      }

      e.message += ' Lets render template without static part.';
      ApiLogger.error(e);

      return frontendTemplate;
    }
  }

  /**
   * #task - move to separate service
   * @param {Object} model
   * @returns {string}
   * @private
   */
  static _extractMainImageUrl(model) {
    if (model.entity_images) {
      return model.entity_images.article_title[0].url;
    }

    return model.main_image_filename ? `${backendConfig.root_url}/upload/${model.main_image_filename}` : ''
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