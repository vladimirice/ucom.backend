import EnvHelper = require('./env-helper');

const config = require('config');

class HttpRequestHelper {
  public static getCookieDomain(request): string {
    if (EnvHelper.isProductionEnv()) {
      return 'u.community';
    }

    const allowedOrigins = config.cors.allowed_origins;

    const { origin } = request.headers;
    if (allowedOrigins.includes(origin) && origin.includes('localhost')) {
      return 'localhost';
    } else {
      return 'u.community';
    }
  }
}

export = HttpRequestHelper;
