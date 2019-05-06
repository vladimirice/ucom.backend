import { AuthCallbackLogger } from '../../../config/winston';
import { AppError, BadRequestError } from '../../api/errors';

import UsersExternalRepository = require('../../users-external/repository/users-external-repository');
import ExternalTypeIdDictionary = require('../../users-external/dictionary/external-type-id-dictionary');
import UsersExternalAuthLogRepository = require('../../users-external/repository/users-external-auth-log-repository');
import AuthService = require('../../auth/authService');

const request = require('request-promise-native');

const githubConfig = require('config').github;

const ACCESS_TOKEN_URI              = '/login/oauth/access_token';
const FETCH_USER_DATA_VIA_TOKEN_URI = '/user?access_token=';

const TOKEN_EXPIRATION_IN_DAYS = 30;

class GithubAuthService {
  public static getCookieExpiration(): number {
    return (3600 * 1000) * 24 * 30; // 1 month
  }

  public static async processAuthCallback(
    req: any,
  ): Promise<{redirectUri: string, authToken: string}> {
    AuthCallbackLogger.info(`Github callback. Method is: ${req.method}, query string content: ${JSON.stringify(req.query)}`);

    const { code, state } = req.query;
    if (!state || state !== githubConfig.state) {
      throw new AppError('There is no state or state is not correct', 500);
    }

    if (!code) {
      throw new AppError('There is no code in github callback', 500);
    }

    try {
      const token     = await this.fetchTokenByCode(code);
      const userData  = await this.fetchUserDataViaToken(token);

      const usersExternalId: number = await this.saveDataToDb(req, userData);
      const authToken = AuthService.getNewGithubAuthToken(usersExternalId, TOKEN_EXPIRATION_IN_DAYS);

      let redirectUri = githubConfig.default_redirect_uri;
      if (req.query && req.query.redirect_uri) {
        redirectUri = this.composeRedirectUrl(req.query);
      }

      return {
        redirectUri,
        authToken,
      };
    } catch (error) {
      throw this.processAuthError(error);
    }
  }

  private static composeRedirectUrl(queryString) {
    const toExclude = ['redirect_uri', 'code', 'state'];

    const toAppend: string[] = [];
    for (const field in queryString) {
      if (!~toExclude.indexOf(field)) {
        toAppend.push(`${field}=${queryString[field]}`);
      }
    }

    if (toAppend.length === 0) {
      return queryString.redirect_uri;
    }

    return `${queryString.redirect_uri}&${toAppend.join('&')}`;
  }

  private static async saveDataToDb(req, userData): Promise<number> {
    const externalId: number = userData.id;

    const usersExternalId: number = await UsersExternalRepository.upsertExternalUser(
      ExternalTypeIdDictionary.github(),
      externalId,
      userData.login,
      userData,
      null,
    );

    await UsersExternalAuthLogRepository.insertOneAuthLog({
      json_headers: req.headers,
      json_body: req.query,
      json_value: userData,
      referer: req.query.redirect_uri,
      users_external_id: usersExternalId,
    });

    return usersExternalId;
  }

  private static processAuthError(err) {
    if (err.name === 'StatusCodeError' && err.statusCode >= 400 && err.statusCode < 500 && err.message) {
      return new BadRequestError(err.message, err.statusCode);
    }

    return err;
  }

  private static async fetchTokenByCode(code: string): Promise<string> {
    const uri = `${githubConfig.main_uri}${ACCESS_TOKEN_URI}`;
    const options = {
      uri,
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      form: {
        code,
        client_id:      githubConfig.client_id,
        client_secret:  githubConfig.client_secret,
        state:          githubConfig.state,
      },
    };

    const res = await request(options);
    AuthCallbackLogger.info(`Github token request response: ${JSON.stringify(res)}`);

    const data =  JSON.parse(res);

    if (!data) {
      throw new AppError('Malformed response data', 500);
    }

    if (data.error) {
      throw new AppError(`${JSON.stringify(data)}`, 500);
    }

    if (!data.access_token) {
      throw new AppError('There is no access token or data', 500);
    }

    return data.access_token;
  }

  private static async fetchUserDataViaToken(accessToken: string): Promise<any> {
    const uri = `${githubConfig.api_uri}${FETCH_USER_DATA_VIA_TOKEN_URI}${accessToken}`;

    const data = await request({
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': githubConfig.app_name,
      },
      uri,
    });
    AuthCallbackLogger.info(`Github public data response is: ${data}`);

    return JSON.parse(data);
  }
}

export = GithubAuthService;
