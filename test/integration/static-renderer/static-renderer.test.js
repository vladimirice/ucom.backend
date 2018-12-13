const request = require('supertest');
const server = require('../../../lib/static-renderer/static-renderer-app');

const helpers = require('../helpers');
const gen     = require('../../generators');

require('jest-expect-message');

helpers.Mock.mockAllBlockchainPart();

let userVlad, userJane, userPetr, userRokky;

describe('Posts API', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initUsersOnly();
  });

  describe('Static renderer', () => {
    describe('Positive', async () => {
      /**
       * @link StaticRendererService#getHtml
       */
      it('try to render simple post', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const url = `/posts/${postId}?fid=32132132312`;

        const res = await request(server)
          .get(url)
        ;

        expect(res.status).toBe(200);
        expect(res.type).toBe('text/html');

        expect(res.text).toBe(getExpectedPostOneHtml(res.request.host));
      });
    });

    describe('Negative', async () => {
      it('should return template without static part if malformed modelId', async () => {
        const url = `/posts/malformed`;

        const res = await request(server)
          .get(url)
        ;

        expect(res.status).toBe(200);
        expect(res.type).toBe('text/html');

        expect(res.text).toBe(getExpectedHtmlWithoutStaticPart(res.request.host));

      });

      it('should return template without static part if no such model', async () => {
        const url = `/posts/100500`;

        const res = await request(server)
          .get(url)
        ;

        expect(res.status).toBe(200);
        expect(res.type).toBe('text/html');

        expect(res.text).toBe(getExpectedHtmlWithoutStaticPart(res.request.host));
      });

      it('should return template without static part if url is malformed', async () => {
        const url = `/mega-posts/`;

        const res = await request(server)
          .get(url)
        ;

        expect(res.status).toBe(200);
        expect(res.type).toBe('text/html');

        expect(res.text).toBe(getExpectedHtmlWithoutStaticPart(res.request.host));
      });
    });

  });
});

/**
 *
 * @param {string} host - host is changed from test to test
 */
function getExpectedHtmlWithoutStaticPart(host) {
return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name=viewport content="width=device-width,initial-scale=1">
  <meta name="google-site-verification" content="mhqdpp_Xwfs-HeZvF6fQ1OR-pq3wNylaet4dVvUeLPk" />
  <link href="https://fonts.googleapis.com/css?family=Montserrat:400,400i,600,700,700i,900" rel="stylesheet">
  <link href="https://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">
  <title>U°Community</title>
  <meta name="mobile-web-app-capable" content="yes"><meta name="theme-color" content="#fff"><meta name="application-name" content="u"><link rel="apple-touch-icon" sizes="57x57" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-57x57.png"><link rel="apple-touch-icon" sizes="60x60" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-60x60.png"><link rel="apple-touch-icon" sizes="72x72" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-72x72.png"><link rel="apple-touch-icon" sizes="76x76" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-76x76.png"><link rel="apple-touch-icon" sizes="114x114" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-114x114.png"><link rel="apple-touch-icon" sizes="120x120" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-120x120.png"><link rel="apple-touch-icon" sizes="144x144" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-144x144.png"><link rel="apple-touch-icon" sizes="152x152" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-152x152.png"><link rel="apple-touch-icon" sizes="180x180" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-180x180.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="u"><link rel="icon" type="image/png" sizes="32x32" href="/icons-143d3f051f55f3b246233bd5b2acf75b/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/icons-143d3f051f55f3b246233bd5b2acf75b/favicon-16x16.png"><link rel="shortcut icon" href="/icons-143d3f051f55f3b246233bd5b2acf75b/favicon.ico"><link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 1)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-320x460.png"><link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-640x920.png"><link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-640x1096.png"><link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-750x1294.png"><link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 3)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-1182x2208.png"><link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 3)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-1242x2148.png"><link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 1)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-748x1024.png"><link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 1)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-768x1004.png"><link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-1496x2048.png"><link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-1536x2008.png"></head>
  <!--content_meta_tags-->
<body>
<div id="app"></div>
<div id="app-portal-root"></div>

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WGSSH3Q"
                  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<script type="text/javascript" src="/app.js?702994c56fd1ae70940c"></script></body>
</html>`
}

/**
 *
 * @param {string} host - host is changed from test to test
 */
function getExpectedPostOneHtml(host) {
return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name=viewport content="width=device-width,initial-scale=1">
  <meta name="google-site-verification" content="mhqdpp_Xwfs-HeZvF6fQ1OR-pq3wNylaet4dVvUeLPk" />
  <link href="https://fonts.googleapis.com/css?family=Montserrat:400,400i,600,700,700i,900" rel="stylesheet">
  <link href="https://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">
  <title>U°Community</title>
  <meta name="mobile-web-app-capable" content="yes"><meta name="theme-color" content="#fff"><meta name="application-name" content="u"><link rel="apple-touch-icon" sizes="57x57" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-57x57.png"><link rel="apple-touch-icon" sizes="60x60" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-60x60.png"><link rel="apple-touch-icon" sizes="72x72" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-72x72.png"><link rel="apple-touch-icon" sizes="76x76" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-76x76.png"><link rel="apple-touch-icon" sizes="114x114" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-114x114.png"><link rel="apple-touch-icon" sizes="120x120" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-120x120.png"><link rel="apple-touch-icon" sizes="144x144" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-144x144.png"><link rel="apple-touch-icon" sizes="152x152" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-152x152.png"><link rel="apple-touch-icon" sizes="180x180" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-icon-180x180.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="u"><link rel="icon" type="image/png" sizes="32x32" href="/icons-143d3f051f55f3b246233bd5b2acf75b/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/icons-143d3f051f55f3b246233bd5b2acf75b/favicon-16x16.png"><link rel="shortcut icon" href="/icons-143d3f051f55f3b246233bd5b2acf75b/favicon.ico"><link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 1)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-320x460.png"><link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-640x920.png"><link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-640x1096.png"><link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-750x1294.png"><link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 3)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-1182x2208.png"><link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 3)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-1242x2148.png"><link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 1)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-748x1024.png"><link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 1)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-768x1004.png"><link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-1496x2048.png"><link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)" href="/icons-143d3f051f55f3b246233bd5b2acf75b/apple-touch-startup-image-1536x2008.png"></head>
  
      <meta property="og:url" content="${host}/posts/1" />
      <meta property="og:type" content="article" />
      <meta property="og:title" content="Extremely new post" />
      <meta property="og:description" content="extremely leading text" />
      <meta property="og:image" content="" />
    
<body>
<div id="app"></div>
<div id="app-portal-root"></div>

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WGSSH3Q"
                  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<script type="text/javascript" src="/app.js?702994c56fd1ae70940c"></script></body>
</html>`
}