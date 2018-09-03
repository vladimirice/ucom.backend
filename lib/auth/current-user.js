class CurrentUser {
  setCurrentUserId(value) {
    this.id = value;
  }

  getCurrentUserId() {
    return this.id
  }
}

module.exports = CurrentUser;