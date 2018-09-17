// jscs:disable

const postContentAsHtml = '<p>hello from post content </p>';



class IpfsPlayground {

}


// const ActivityProducer = require('./lib/activity/activity-producer');
// ActivityProducer.publish('Hello from producer', 'content-creation');

const IpfsConsumer = require('./lib/ipfs/ipfs-consumer');
IpfsConsumer.consume().then();



/*
[ { path: 'QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7',
    hash: 'QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7',
    size: 39 } ]

 */

// IpfsPlayground.addFileToIpfs();

/*

* New content is created as object inside database
* It has all ids, etc in order to make actions
* Producer goal is

* Create job containing post as Object - simply get it from request or event
* Push this json to an exchange

* dispatched to IPFS queue
* consumer gets this Object

*/

