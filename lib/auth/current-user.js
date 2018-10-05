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

  /**
   *
   * @return {number}
   */
  getId() {
    return this.id;
  }

  /**
   *
   * @return {number}
   */
  getCurrentUserId() {
    return this.id
  }
}

module.exports = CurrentUser;