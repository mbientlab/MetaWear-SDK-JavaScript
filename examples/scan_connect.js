// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

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
    setTimeout(function () {
      device.disconnect(function (error) {
        console.log('disconnect call finished');
      });
    }, 1000);
  });
});
