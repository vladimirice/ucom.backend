"use strict";
const config = require('config');
const corsLib = require('cors');
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
const defaultCorsParams = {
    methods: 'GET,POST,OPTIONS,PUT,PATCH,DELETE',
    allowedHeaders: `X-Requested-With,content-type,Authorization,${CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB},Cookie,${CommonHeaders.UNIQUE_ID}`,
    credentials: true,
};
class CorsHelper {
    static addRegularCors(app) {
        app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', this.getOriginByRequest(req));
            res.setHeader('Access-Control-Allow-Methods', defaultCorsParams.methods);
            res.setHeader('Access-Control-Allow-Headers', defaultCorsParams.allowedHeaders);
            res.setHeader('Access-Control-Allow-Credentials', defaultCorsParams.credentials);
            next();
        });
    }
    static addCorsLibMiddleware(app) {
        app.use(corsLib(this.getCorsOptionsDelegate()));
    }
    static getCorsOptionsDelegate() {
        return (req, callback) => {
            const corsOptions = Object.assign({}, defaultCorsParams);
            corsOptions.origin = this.getOriginByRequest(req);
            callback(null, corsOptions);
        };
    }
    static getOriginByRequest(request) {
        const allowedOrigins = config.cors.allowed_origins;
        const { origin } = request.headers;
        if (allowedOrigins.includes(origin)) {
            return origin;
        }
        return false;
    }
}
module.exports = CorsHelper;
