import { TotalStatsParams } from '../interfaces/dto-interfaces';

import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');

import EventParamTypeCommon = require('../dictionary/event-param/event-param-type-common-dictionary');
import UsersRepository = require('../../users/users-repository');


/*

кол-во профилей
кол-во комьюнити, публикаций, постов, тегов
кол-во комментов/реплаев/тотал
кол-во оценов - лайк дизлайк тотал
шеры - посты/публикации/тотал

 */

const eventGroup      =  EventParamGroupDictionary.getNotDetermined();
const eventSuperGroup =  EventParamSuperGroupDictionary.getNotDetermined();

const currentNumberSet: TotalStatsParams[] = [
  {
    eventGroup,
    eventSuperGroup,

    eventType:        EventParamTypeCommon.USERS_PERSON__NUMBER,
    recalcInterval:   'PT1H',
    description:      'USERS_PERSON__NUMBER',

    providerFunc:     UsersRepository.countAll,
  },
];

class TotalsJobParams {
  public static getCurrentNumberSet(): TotalStatsParams[] {
    return currentNumberSet;
  }
}

export = TotalsJobParams;
