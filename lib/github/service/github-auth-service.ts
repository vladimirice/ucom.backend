import { AuthCallbackLogger } from '../../../config/winston';
import { AppError } from '../../api/errors';

const request = require('request-promise-native');

const githubConfig = require('config').github;

const ACCESS_TOKEN_URI              = '/login/oauth/access_token';
const FETCH_USER_DATA_VIA_TOKEN_URI = '/user?access_token=';

class GithubAuthService {
  public static async processAuthCallback(req: any): Promise<string> {
    AuthCallbackLogger.info(`Github callback. Method is: ${req.method}, query string content: ${JSON.stringify(req.query)}`);
    /*
      "Github callback. Method is: GET, query string content: {\"redirect_uri\":\"https://u.community/users\",\"code\":\"bc5c680977050e2107d9\",\"state\":\"randomstatestring\"}"
    */
    const { code, state } = req.query;
    if (!state || state !== githubConfig.state) {
      throw new AppError('There is no state or state is not correct', 500);
    }

    if (!code) {
      throw new AppError('There is no code in github callback', 500);
    }

    const token = await this.fetchTokenByCode(code);
    // @ts-ignore
    const userData = await this.fetchUserDataViaToken(token);

    // TODO - save event log
    // TODO - upsert userData

    if (req.query && req.query.redirect_uri) {
      return req.query.redirect_uri;
    }

    return githubConfig.default_redirect_uri;
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

    // const sampleResponse = '{"access_token":"cb259e0f9ea2b0dc02323e80d3b6667e8ce6462e","token_type":"bearer","scope":""}';
    // const decoded = JSON.parse(resp);

    // TODO
    // sample bad response
    //
    // {
    //   "error": "bad_verification_code",
    //   "error_description": "The code passed is incorrect or expired.",
    //   "error_uri": "https://developer.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code"
    // }
  }

  private static async fetchUserDataViaToken(accessToken: string) {
    const uri = `${githubConfig.api_uri}${FETCH_USER_DATA_VIA_TOKEN_URI}${accessToken}`;

    const userData = await request({
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': githubConfig.app_name,
      },
      uri,
    });

    /*
      const samplePublicData = {"login":"vladimirice","id":13485690,"node_id":"MDQ6VXNlcjEzNDg1Njkw","avatar_url":"https://avatars2.githubusercontent.com/u/13485690?v=4","gravatar_id":"","url":"https://api.github.com/users/vladimirice","html_url":"https://github.com/vladimirice","followers_url":"https://api.github.com/users/vladimirice/followers","following_url":"https://api.github.com/users/vladimirice/following{/other_user}","gists_url":"https://api.github.com/users/vladimirice/gists{/gist_id}","starred_url":"https://api.github.com/users/vladimirice/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/vladimirice/subscriptions","organizations_url":"https://api.github.com/users/vladimirice/orgs","repos_url":"https://api.github.com/users/vladimirice/repos","events_url":"https://api.github.com/users/vladimirice/events{/privacy}","received_events_url":"https://api.github.com/users/vladimirice/received_events","type":"User","site_admin":false,"name":"Vladimir","company":null,"blog":"www.linkedin.com/in/sapozhnikovvs","location":"Moscow","email":null,"hireable":null,"bio":null,"public_repos":5,"public_gists":4,"followers":3,"following":2,"created_at":"2015-07-24T15:02:01Z","updated_at":"2019-03-11T07:31:23Z"}
    */
    AuthCallbackLogger.info(`Github public data response is: ${userData}`);

    return userData;
  }
}

export = GithubAuthService;
