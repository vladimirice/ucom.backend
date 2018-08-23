// const { range } = require('lodash');
const dictionary  = require('./dictionary');

class Brainkey {
  // TODO - this is non-production brainkey generator
  static generateSimple (wordsAmount) {
    const words = dictionary['en'].split(',');
    const wordsLength = words.length;

    let res = [];
    for (let i = 0; i < wordsAmount; i++) {
      const index = Math.floor(Math.random() * wordsLength);
      res.push(words[index]);
    }

    return res.join(' ');
  };
}

module.exports = Brainkey;