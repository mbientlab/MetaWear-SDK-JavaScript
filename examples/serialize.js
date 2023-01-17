// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var ref = require('ref-napi');

// If you don't know the MAC address, you can uncomment this line
// and it will connect to nearest automatically
//MetaWear.discover(function (device) {
MetaWear.discoverByAddress('f7:c0:14:1b:e5:86', function(device) {
  console.log(device);
  // you can be notified of disconnects
  device.on('disconnect', function () {
    console.log('we got disconnected! :( ');
  });
  // you'll need to call connect and set up
  device.connectAndSetUp(function (error) {
    console.log('were connected!');
    var intBuf = ref.alloc(ref.types.uint32);
    var raw = MetaWear.mbl_mw_metawearboard_serialize(device.board, intBuf);
    var sizeRead = intBuf.readUInt32LE();
    var data = ref.reinterpret(raw, sizeRead, 0);
    console.log(data.toString('hex').match(/../g).join(' '));
    var initStr = data.toString('hex');
    setTimeout(function () {
      device.disconnect(function (error) {
        console.log('disconnect call finished');
        process.exit();
      });
    }, 1000);
  });
});
