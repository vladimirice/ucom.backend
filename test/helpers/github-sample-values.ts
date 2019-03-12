const vladSampleData = {
  login:'vladimirice',
  id:13485690,
  node_id:'MDQ6VXNlcjEzNDg1Njkw',
  avatar_url:'',
  gravatar_id:'',
  url:'https://api.github.com/users/vladimirice',
  html_url:'https://github.com/vladimirice',
  followers_url:'https://api.github.com/users/vladimirice/followers',
  following_url:'https://api.github.com/users/vladimirice/following{/other_user}',
  gists_url:'https://api.github.com/users/vladimirice/gists{/gist_id}',
  starred_url:'https://api.github.com/users/vladimirice/starred{/owner}{/repo}',
  subscriptions_url:'https://api.github.com/users/vladimirice/subscriptions',
  organizations_url:'https://api.github.com/users/vladimirice/orgs',
  repos_url:'https://api.github.com/users/vladimirice/repos',
  events_url:'https://api.github.com/users/vladimirice/events{/privacy}',
  received_events_url:'https://api.github.com/users/vladimirice/received_events',
  type:'User',
  site_admin:false,
  name:'Vladimir',
  company:null,
  blog:'www.linkedin.com/in/sapozhnikovvs',
  location:'Moscow',
  email:null,
  hireable:null,
  bio:null,
  public_repos:5,
  public_gists:4,
  followers:3,
  following:2,
  created_at:'2015-07-24T15:02:01Z',
  updated_at:'2019-03-11T07:31:23Z',
};

class GithubSampleValues {
  public static getVladSampleExternalData() {
    return vladSampleData;
  }
}

export = GithubSampleValues;
