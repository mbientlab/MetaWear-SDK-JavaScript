var assert = require('assert');
var MetaWear = require('../lib/metawear');

function Peripheral() {
  this.address = 'fa:55:aa:55:aa:55';
  this.id = this.address;
  this.uuid = this.address;
}

describe('MetaWear', function () {
  it('should be able to create MetaWear object', function () {
    var device = new MetaWear(new Peripheral());
    assert.equal('fa:55:aa:55:aa:55', device.address);
  });
});