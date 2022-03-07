// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
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

  // Get acc and gyro signal
  console.log('Get gyro and acc signal');
  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board)
  // For MMS
  let gyro = MetaWear.mbl_mw_gyro_bmi270_get_rotation_data_signal(device.board)
  // For MMRL, MMC, MMR
  //let gyro = MetaWear.mbl_mw_gyro_bmi160_get_rotation_data_signal(device.board)
  
  // Subscribe to the signals
  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z)
  }))
  MetaWear.mbl_mw_datasignal_subscribe(gyro, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' gyro: ' + value.x + ' ' + value.y + ' ' + value.z)
  }))
  
  // Start the accelerometer
  console.log('Start accelerometer.')
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board)
  MetaWear.mbl_mw_acc_start(device.board)
  
  // Start the gyroscope
  console.log('Start gyroscope.')
  // For MMS
  MetaWear.mbl_mw_gyro_bmi270_enable_rotation_sampling(device.board)
  MetaWear.mbl_mw_gyro_bmi270_start(device.board)
  // Uncomment for MMRL, MMR, MMC
  //MetaWear.mbl_mw_gyro_bmi160_enable_rotation_sampling(device.board)
  //MetaWear.mbl_mw_gyro_bmi160_start(device.board)

  // End of terminal input
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
// sudo node stream_acc_gyro.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])
