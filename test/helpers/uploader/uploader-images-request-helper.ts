import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import ResponseHelper = require('../../integration/helpers/response-helper');
import RequestHelper = require('../../integration/helpers/request-helper');
import UploaderRequestHelper = require('../common/uploader-request-helper');

const imagesUrl = `${UploaderRequestHelper.getApiV1Prefix()}/images`;
const oneImageUrl = `${imagesUrl}/one-image`;

class UploaderImagesRequestHelper {
  public static async uploadOneSampleImage(
    imagePath: string | null,
    myself: UserModel | null = null,
    expectedStatus: number = 201,
  ): Promise<any> {
    const request = UploaderRequestHelper.getRequestObjForPost(oneImageUrl);
    const fieldName = 'one_image';

    if (imagePath) {
      RequestHelper.attachImage(request, fieldName, imagePath);
    }

    if (myself !== null) {
      RequestHelper.addAuthToken(request, myself);
    }

    const response = await request;
    const { body } = response;

    ResponseHelper.expectStatusToBe(response, expectedStatus);

    return body;
  }
}

export = UploaderImagesRequestHelper;
