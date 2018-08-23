class ResponseHelper {
  static expectStatusOk(res) {
    expect(res.status).toBe(200);
  }

  static expectStatusNotFound(res) {
    expect(res.status).toBe(404);
  }

  static expectStatusBadRequest(res) {
    expect(res.status).toBe(400);
  }

  static expectStatusUnauthorized(res) {
    expect(res.status).toBe(401);
  }
}

module.exports = ResponseHelper;