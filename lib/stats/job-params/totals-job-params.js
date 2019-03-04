"use strict";
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const EventParamTypeCommon = require("../dictionary/event-param/event-param-type-common-dictionary");
const UsersRepository = require("../../users/users-repository");
/*

кол-во профилей
кол-во комьюнити, публикаций, постов, тегов
кол-во комментов/реплаев/тотал
кол-во оценов - лайк дизлайк тотал
шеры - посты/публикации/тотал

 */
const eventGroup = EventParamGroupDictionary.getNotDetermined();
const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
const currentNumberSet = [
    {
        eventGroup,
        eventSuperGroup,
        eventType: EventParamTypeCommon.USERS_PERSON__NUMBER,
        recalcInterval: 'PT1H',
        description: 'USERS_PERSON__NUMBER',
        providerFunc: UsersRepository.countAll,
    },
];
class TotalsJobParams {
    static getCurrentNumberSet() {
        return currentNumberSet;
    }
}
module.exports = TotalsJobParams;
