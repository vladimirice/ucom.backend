"use strict";
const STATE__FULL = 'full';
const STATE__LIST = 'list';
const STATE__NOTIFICATION = 'notification';
const STATE__CARD = 'card';
class EntityResponseState {
    static full() {
        return STATE__FULL;
    }
    static list() {
        return STATE__LIST;
    }
    static notification() {
        return STATE__NOTIFICATION;
    }
    static card() {
        return STATE__CARD;
    }
}
module.exports = EntityResponseState;
