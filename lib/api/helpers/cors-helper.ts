const config = require('config');
const corsLib = require('cors');

const defaultCorsParams = {
  origin: '*',
  methods: 'GET,POST,OPTIONS,PUT,PATCH,DELETE',
  allowedHeaders: `X-Requested-With,content-type,Authorization,${CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB},Cookie`,
  credentials: true,
};

class CorsHelper {
  public static addRegularCors(app: any) {
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', this.getOriginByRequest(req));

      res.setHeader('Access-Control-Allow-Methods', defaultCorsParams.methods);

      res.setHeader(
        'Access-Control-Allow-Headers',
        defaultCorsParams.allowedHeaders,
      );

      res.setHeader('Access-Control-Allow-Credentials', defaultCorsParams.credentials);

      next();
    });
  }

  public static addCorsLibMiddleware(app: any) {
    app.use(corsLib(this.getCorsOptionsDelegate()));
  }

  private static getCorsOptionsDelegate() {
    return (req, callback) => {
      const corsOptions: any = {
        ...defaultCorsParams,
      };

      corsOptions.origin = this.getOriginByRequest(req);

      callback(null, corsOptions);
    };
  }

  private static getOriginByRequest(request): string | boolean {
    const allowedOrigins = config.cors.allowed_origins;

    const { origin } = request.headers;
    if (allowedOrigins.includes(origin)) {
      return origin;
    }

    return false;
  }
}

export = CorsHelper;
