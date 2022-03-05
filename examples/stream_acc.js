// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');
const SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler('crash.log');
var ref = require('ref-napi')

// Main function
async function mainAsync(mac) {
  // Discover
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  await new Promise((resolve, reject) => {
    console.log('Connecting...')
    // Connect and setup
    device.connectAndSetUp(error => {
    console.log('Connected.')
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  // Get acc signal
  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board)
  console.log('Set up stream.')
  
  // Stream acc signal
  MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    console.log(data);
    //var value = data.parseValue();
    //console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z)
  }))
  
  // Start acc
  console.log('Start accelerometer.')
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board)
  MetaWear.mbl_mw_acc_start(device.board)

  // Terminal on terminal input
  process.openStdin().addListener("data", data => {
    console.log('Reset.')
    MetaWear.mbl_mw_debug_reset(device.board);
    MetaWear.mbl_mw_debug_disconnect(device.board);
    console.log('Disconnect');
    setTimeout(function () {
      // Exit terminal
      process.exit(1);
    }, 4000);
  })
}

// Run this example by putting the MAC address on the command line
// sudo node stream_acc.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])
