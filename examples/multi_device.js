var MetaWear = require('../index')//require('metawear');
var fs = require('fs');

var addresses = [
  'f3:97:6b:cc:71:97',
  'c7:e2:8b:3c:32:42'
];
var devices = [];

function onDiscover(device) {
  addresses.forEach(function (address) {
    if (device.address.toUpperCase() === address.toUpperCase()) {
      console.log('discovered ' + address);
      devices.push(device);
    }
  });
  // Some adapters don't allow connecting while scanning is going on, 
  // so we we complete our discovery only when scanning is finished
  if (addresses.length == devices.length) {
    MetaWear.stopDiscoverAll(onDiscover);
    setTimeout(function () {
      console.log('discover complete');
      devices.forEach(function (device) {
        startAccelStream(device);
      });
    }, 1000);
  }
};
MetaWear.discoverAll(onDiscover);

// Start the stream
function startAccelStream(device) {
  device.connectAndSetUp(function (error) {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    // Set the max range of the accelerometer
    MetaWear.mbl_mw_acc_set_range(device.board, 8.0);
    MetaWear.mbl_mw_acc_write_acceleration_config(device.board);
    var accSignal = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
    MetaWear.mbl_mw_datasignal_subscribe(accSignal, MetaWear.FnVoid_DataP.toPointer(function gotTimer(dataPtr) {
      var data = dataPtr.deref();
      var pt = data.parseValue();
      console.log(pt.x, pt.y, pt.z);
    }));
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
    MetaWear.mbl_mw_acc_start(device.board);

    // Stop after 5 seconds
    setTimeout(function () {
      // Stop the stream
      MetaWear.mbl_mw_acc_stop(device.board);
      MetaWear.mbl_mw_acc_disable_acceleration_sampling(device.board);
      MetaWear.mbl_mw_datasignal_unsubscribe(accSignal);
      MetaWear.mbl_mw_debug_disconnect(device.board);
    }, 5000);
  });
}