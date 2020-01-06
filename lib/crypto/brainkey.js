"use strict";
const dictionary = require('./dictionary');
class Brainkey {
    // #task - this is non-production brainkey generator
    static generateSimple(wordsAmount) {
        const words = dictionary.en.split(',');
        const wordsLength = words.length;
        const res = [];
        for (let i = 0; i < wordsAmount; i += 1) {
            const index = Math.floor(Math.random() * wordsLength);
            res.push(words[index]);
        }
        return res.join(' ');
    }
}
module.exports = Brainkey;
