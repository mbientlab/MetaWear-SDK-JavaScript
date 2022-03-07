// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var ref = require('ref-napi')

// Main
async function mainAsync(mac) {
  // Discover
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  await new Promise((resolve, reject) => {
    console.log('Connecting...')
    // Connect
    device.connectAndSetUp(error => {
    console.log('Connected.')
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  // Get acc
  console.log('Set up acc signal.');
  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  
  // Keep only X component
  console.log('Get x component of acc.');
  let acc_x = MetaWear.mbl_mw_datasignal_get_component(acc, 0); //cbindings.Const.ACC_ACCEL_X_AXIS_INDEX);  
  
  // Subscribe to stream
  console.log('Set up stream.');
  MetaWear.mbl_mw_datasignal_subscribe(acc_x, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' acc x: ' + value);
  }))
  
  // Start acc
  console.log('Start accelerometer.');
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_acc_start(device.board);

  // Terminal on terminal input
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
// sudo node stream_acc_x.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])
