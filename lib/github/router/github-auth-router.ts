import { AuthCallbackLogger } from '../../../config/winston';

const request = require('request-promise-native');
const express = require('express');

const GithubAuthRouter = express.Router();

const GITHUB_CONFIG = {
  app_name: 'staging-backend.u.community',
};

require('express-async-errors');

async function fetchToken(code: string) {
  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    uri: 'https://github.com/login/oauth/access_token',
    form: {
      code,
      client_id:      'ec17c7e5b1f383034c25',
      client_secret:  '5064b1ac3b1eb43c26fef44177359790fbcc779a',
      state:          'randomstatestring',
    },
  };

  const resp = await request(options);
  AuthCallbackLogger.info(`Github token request response: ${JSON.stringify(resp)}`);

  // const sampleResponse = '{"access_token":"cb259e0f9ea2b0dc02323e80d3b6667e8ce6462e","token_type":"bearer","scope":""}';
  return JSON.parse(resp);
}

async function fetchPublicDataViaToken(accessToken: string) {
  const uriToPublicData = `https://api.github.com/user?access_token=${accessToken}`;

  const publicData = await request({
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': GITHUB_CONFIG.app_name,
    },
    uri: uriToPublicData,
  });

  AuthCallbackLogger.info(`Github public data response is: ${publicData}`);
  /*
    const samplePublicData = {"login":"vladimirice","id":13485690,"node_id":"MDQ6VXNlcjEzNDg1Njkw","avatar_url":"https://avatars2.githubusercontent.com/u/13485690?v=4","gravatar_id":"","url":"https://api.github.com/users/vladimirice","html_url":"https://github.com/vladimirice","followers_url":"https://api.github.com/users/vladimirice/followers","following_url":"https://api.github.com/users/vladimirice/following{/other_user}","gists_url":"https://api.github.com/users/vladimirice/gists{/gist_id}","starred_url":"https://api.github.com/users/vladimirice/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/vladimirice/subscriptions","organizations_url":"https://api.github.com/users/vladimirice/orgs","repos_url":"https://api.github.com/users/vladimirice/repos","events_url":"https://api.github.com/users/vladimirice/events{/privacy}","received_events_url":"https://api.github.com/users/vladimirice/received_events","type":"User","site_admin":false,"name":"Vladimir","company":null,"blog":"www.linkedin.com/in/sapozhnikovvs","location":"Moscow","email":null,"hireable":null,"bio":null,"public_repos":5,"public_gists":4,"followers":3,"following":2,"created_at":"2015-07-24T15:02:01Z","updated_at":"2019-03-11T07:31:23Z"}
   */
}


GithubAuthRouter.all('/auth_callback', async (req, res) => {
  AuthCallbackLogger.info(`Github callback. Method is: ${req.method}, query string content: ${JSON.stringify(req.query)}`);

  const { code } = req.query;

  let urlToRedirect = 'https://u.community';
  if (req.query && req.query.redirect_uri) {
    urlToRedirect = req.query.redirect_uri;
  }

  const fetchTokenResponse = await fetchToken(code);

  // TODO
  // sample bad response
  //
  // {
  //   "error": "bad_verification_code",
  //   "error_description": "The code passed is incorrect or expired.",
  //   "error_uri": "https://developer.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code"
  // }

  await fetchPublicDataViaToken(fetchTokenResponse.access_token);

  res.redirect(urlToRedirect);
});

export = GithubAuthRouter;
