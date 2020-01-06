/* eslint-disable no-console */
import OffersCreatorService = require('../../service/offers-creator-service');
import DatetimeHelper = require('../../../common/helper/datetime-helper');
import CloseHandlersHelper = require('../../../common/helper/close-handlers-helper');


const yargs = require('yargs');

const { argv } = yargs
  .option('title', {
    describe: 'A title of offer',
    type: 'string',
    demand: true,
  })
  .option('postId', {
    describe: 'Already created post-offer ID',
    type: 'string',
    demand: true,
  })
  .option('startedAt', {
    describe: 'UTC string. Default - now',
    type: 'string',
    default: DatetimeHelper.currentDatetime(),
  })
  .option('finishedAt', {
    describe: 'UTC string. Default null - unlimited',
    type: 'string',
    default: null,
  })
  .help()
  .alias('help', 'h')
  ;

(async () => {
  const { title } = argv;
  const { postId } = argv;

  const { startedAt } = argv;
  const { finishedAt } = argv;

  try {
    const offer = await OffersCreatorService.createOfferForRegistration(
      title,
      postId,
      startedAt,
      finishedAt,
    );
    console.log(`Offer is created. ID is: ${offer.id}`);
  } catch (error) {
    console.error(error);
  } finally {
    await CloseHandlersHelper.closeDbConnections();
  }
})();
