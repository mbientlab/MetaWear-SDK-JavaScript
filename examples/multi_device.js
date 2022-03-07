// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var fs = require('fs');
var ref = require('ref-napi');

var addresses = [
  'ea:78:c3:d3:f0:8a',
  'e6:fe:b6:b4:db:e7'
];
var devices = [];

// Discover device function
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

// Start the accelerometer stream function
function startAccelStream(device) {
  device.connectAndSetUp(function (error) {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log('connected ' + device.address);
    // Set the max range of the accelerometer
    MetaWear.mbl_mw_acc_set_range(device.board, cbindings.AccBoschRange._8G);
    MetaWear.mbl_mw_acc_set_odr(device.board, 5);
    MetaWear.mbl_mw_acc_write_acceleration_config(device.board);
    console.log('get acc signal');
    var accSignal = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
    // Setup acc download by subscribing to the signal
    console.log('subscribe to logger');
    MetaWear.mbl_mw_datasignal_subscribe(accSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer(function gotTimer(context, dataPtr) {
      var data = dataPtr.deref();
      var pt = data.parseValue();
      console.log(pt.x, pt.y, pt.z);
    }));
    // Start acc
    console.log('start acc');
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
    MetaWear.mbl_mw_acc_start(device.board);

    // Stop after 5 seconds
    setTimeout(function () {
      // Stop the stream
      console.log('stop and reset');
      MetaWear.mbl_mw_acc_stop(device.board);
      MetaWear.mbl_mw_acc_disable_acceleration_sampling(device.board);
      MetaWear.mbl_mw_datasignal_unsubscribe(accSignal);
      MetaWear.mbl_mw_debug_disconnect(device.board);
      setTimeout(function () {
        process.exit(1);
      }, 1000);
    }, 5000);
  });
}
