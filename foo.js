

let fooObject;

class Foo {
  constructor(test) {
    this.test = test;
  }

  setTest(value) {
    this.test = value;
  }

  getTest() {
    return this.test;
  }
}

module.exports = {
  Foo,
  fooObject
};