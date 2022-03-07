// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref-napi');

// Main function
async function mainAsync(mac) {
  // Find device with MAC address
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  
  // Connect to device with MAC address
  await new Promise((resolve, reject) => {
    console.log('Connecting...')
    // Connect and setup
    device.connectAndSetUp(error => {
    console.log('Connected.')
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  // Get the accelerometer signal 
  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  let acc_x = MetaWear.mbl_mw_datasignal_get_component(acc, cbindings.Const.ACC_ACCEL_X_AXIS_INDEX);
  
  // Create an averager of the acc (i/e filter)
  let averager = await new Promise((resolve, reject) => {
    MetaWear.mbl_mw_dataprocessor_average_create(acc_x, 8, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
      console.log('Averager Created');
      resolve(pointer);
    }))
  });
  console.log(averager);
  
  // Log the averaged signal (filter)
  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(averager, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' acc_x averaged: ' + value)
  }))
  
  // Start acc
  console.log('Start accelerometer.')
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board)
  MetaWear.mbl_mw_acc_start(device.board)

  // Terminate app on any terminal inpur
  process.openStdin().addListener("data", data => {
    console.log('Reset.')
    MetaWear.mbl_mw_debug_reset(device.board)
    setTimeout(function () {
      // Exit terminal
      process.exit(1);
    }, 2000);
  })
}

// Run this example by putting the MAC address on the command line
// sudo node stream_acc_averager.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])

