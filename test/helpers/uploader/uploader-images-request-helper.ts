import ResponseHelper = require('../../integration/helpers/response-helper');
import RequestHelper = require('../../integration/helpers/request-helper');
import UploaderRequestHelper = require('../common/uploader-request-helper');

const imagesUrl = `${UploaderRequestHelper.getApiV1Prefix()}/images`;
const oneImageUrl = `${imagesUrl}/one-image`;

class UploaderImagesRequestHelper {
  public static async uploadOneSampleImage() {
    const request = UploaderRequestHelper.getRequestObjForPost(oneImageUrl);
    const fieldName = 'one_image';

    // RequestHelper.addAuthToken(req, myself);
    // RequestHelper.addFieldsToRequest(req, fields);

    RequestHelper.addSampleMainImageFilename(request, fieldName);
    const res = await request;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }
}

export = UploaderImagesRequestHelper;
