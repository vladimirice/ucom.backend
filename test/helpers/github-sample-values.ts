import { BadRequestError } from '../../lib/api/errors';

import AirdropsUsersRequest = require('./airdrops-users-request');

const VLAD_ACCESS_TOKEN = 'cb259e0f9ea2b0dc02323e74d3b6667e8ce6868e';
const JANE_ACCESS_TOKEN = 'ab259e0f9ea2b0dc02323e74d3b6667e8ce6868f';

const sampleData = {
  [VLAD_ACCESS_TOKEN]: {
    login: 'vladimirice',
    id: AirdropsUsersRequest.getVladGithubId(),
    node_id: 'MDQ6VXNlcjEzNDg1Njkw',
    avatar_url: '',
    gravatar_id: '',
    url: 'https://api.github.com/users/vladimirice',
    html_url: 'https://github.com/vladimirice',
    followers_url: 'https://api.github.com/users/vladimirice/followers',
    following_url: 'https://api.github.com/users/vladimirice/following{/other_user}',
    gists_url: 'https://api.github.com/users/vladimirice/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/vladimirice/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/vladimirice/subscriptions',
    organizations_url: 'https://api.github.com/users/vladimirice/orgs',
    repos_url: 'https://api.github.com/users/vladimirice/repos',
    events_url: 'https://api.github.com/users/vladimirice/events{/privacy}',
    received_events_url: 'https://api.github.com/users/vladimirice/received_events',
    type: 'User',
    site_admin: false,
    name: 'Vladimir',
    company: null,
    blog: 'www.linkedin.com/in/sapozhnikovvs',
    location: 'Moscow',
    email: null,
    hireable: null,
    bio: null,
    public_repos: 5,
    public_gists: 4,
    followers: 3,
    following: 2,
    created_at: '2015-07-24T15:02:01Z',
    updated_at: '2019-03-11T07:31:23Z',
  },
  [JANE_ACCESS_TOKEN]: {
    login: 'akegaviar',
    id: AirdropsUsersRequest.getJaneGithubId(),
    node_id: 'MDQ6VXNlcjEwMTk1Nzgy',
    avatar_url: `https://avatars1.githubusercontent.com/u/${AirdropsUsersRequest.getJaneGithubId()}?v=4`,
    gravatar_id: '',
    url: 'https://api.github.com/users/akegaviar',
    html_url: 'https://github.com/akegaviar',
    followers_url: 'https://api.github.com/users/akegaviar/followers',
    following_url: 'https://api.github.com/users/akegaviar/following{/other_user}',
    gists_url: 'https://api.github.com/users/akegaviar/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/akegaviar/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/akegaviar/subscriptions',
    organizations_url: 'https://api.github.com/users/akegaviar/orgs',
    repos_url: 'https://api.github.com/users/akegaviar/repos',
    events_url: 'https://api.github.com/users/akegaviar/events{/privacy}',
    received_events_url: 'https://api.github.com/users/akegaviar/received_events',
    type: 'User',
    site_admin: false,
    name: 'Ake Gaviar',
    company: null,
    blog: 'https://ake.wtf',
    location: null,
    email: null,
    hireable: null,
    bio: '14 years in software projects.',
    public_repos: 3,
    public_gists: 0,
    followers: 1,
    following: 1,
    created_at: '2014-12-15T13:22:26Z',
    updated_at: '2019-03-12T04:58:22Z',
  },
};

class GithubSampleValues {
  public static getAccessTokenForCode(code: string): string {
    const set = {
      github_code_vlad: VLAD_ACCESS_TOKEN,
      github_code_jane: JANE_ACCESS_TOKEN,
    };

    if (set[code]) {
      return set[code];
    }

    throw new BadRequestError(`There is no token for code: ${code}`);
  }

  public static getSampleExternalData(accessToken: string) {
    if (sampleData[accessToken]) {
      return sampleData[accessToken];
    }

    throw new BadRequestError(`There is no sampleData for token: ${accessToken}`);
  }

  public static getVladSampleExternalData() {
    return sampleData[VLAD_ACCESS_TOKEN];
  }
}

export = GithubSampleValues;
