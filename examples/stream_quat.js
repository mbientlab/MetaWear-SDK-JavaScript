// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref')

// Main
async function mainAsync(mac) {
  // Discover
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  await new Promise((resolve, reject) => {
    console.log('Connecting...')
    // Connect + setup
    device.connectAndSetUp(error => {
    console.log('Connected.')
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  // Setup gyro, acc, and sensor fusion settings
  MetaWear.mbl_mw_sensor_fusion_set_mode(device.board, 1); //SensorFusionMode.NDOF);
  MetaWear.mbl_mw_sensor_fusion_set_acc_range(device.board, 2 ); //SensorFusionAccRange._8G)
  MetaWear.mbl_mw_sensor_fusion_set_gyro_range(device.board, 0); //SensorFusionGyroRange._2000DPS)
  MetaWear.mbl_mw_sensor_fusion_write_config(device.board);

  // Get quaternion
  console.log('Get quat signal.');
  let signal = MetaWear.mbl_mw_sensor_fusion_get_data_signal(device.board, 3); //See bindings - SensorFusionData.QUATERNION);
  
  // Stream quat
  console.log('Set up stream.');
  MetaWear.mbl_mw_datasignal_subscribe(signal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' quat: ' + value.x + ' ' + value.y + ' ' + value.z);
  }));
  
  // Start quat - setups acc/gyro/mag for you
  console.log('Start sensor fusion.');
  MetaWear.mbl_mw_sensor_fusion_enable_data(device.board, 3); //See bindings - SensorFusionData.QUATERNION);
  MetaWear.mbl_mw_sensor_fusion_start(device.board);

  // Terminal on terminal input
  process.openStdin().addListener("data", data => {
    console.log('Reset.');
    MetaWear.mbl_mw_sensor_fusion_stop(device.board);
    MetaWear.mbl_mw_datasignal_unsubscribe(signal);
    MetaWear.mbl_mw_debug_reset(device.board);
    setTimeout(function () {
      // Exit terminal
      process.exit(1);
    }, 2000);
  });
}

// Run this example by putting the MAC address on the command line
// sudo node stream_quat.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])
