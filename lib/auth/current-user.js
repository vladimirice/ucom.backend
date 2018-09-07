class CurrentUser {

  /**
   *
   * @param {Object} value
   */
  setCurrentUser(value) {
    this.user = value;
    this.setCurrentUserId(value.id)
  }

  setCurrentUserId(value) {
    this.id = value;
  }

  getUser() {
    return this.user;
  }

  getCurrentUserId() {
    return this.id
  }
}

module.exports = CurrentUser;