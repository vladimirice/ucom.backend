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

  /**
   *
   * @returns {boolean}
   */
  isCurrentUser() {
    return !!this.id
  }

  getUser() {
    return this.user;
  }

  getCurrentUserId() {
    return this.id
  }
}

module.exports = CurrentUser;