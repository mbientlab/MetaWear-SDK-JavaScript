// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var ref = require('ref-napi')

async function mainAsync(mac) {
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  await new Promise((resolve, reject) => {
    console.log('Connecting...')
    device.connectAndSetUp(error => {
    console.log('Connected.')
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  // For MMS
  let gyro = MetaWear.mbl_mw_gyro_bmi270_get_packed_rotation_data_signal(device.board)
  // Uncomment for MMRL, MMR, MMC
  //let acc = MetaWear.mbl_mw_gyro_bmi160_get_packed_rotation_data_signal(device.board)

  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(gyro, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    let value = data.parseValue()
    let entry = [value.x, value.y, value.z]
    console.log('epoch: ' + data.epoch + ' gyro: ' + 'x: ' + entry[0].toFixed(3) + ' y: ' + entry[1].toFixed(3) + ' z: ' + entry[2].toFixed(3))
  }))
  
  console.log('Start gyroscope.')
  // For MMS
  MetaWear.mbl_mw_gyro_bmi270_enable_rotation_sampling(device.board)
  MetaWear.mbl_mw_gyro_bmi270_start(device.board)
  // Uncomment for MMRL, MMR, MMC
  //MetaWear.mbl_mw_gyro_bmi160_enable_rotation_sampling(device.board)
  //MetaWear.mbl_mw_gyro_bmi160_start(device.board)

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
// sudo node stream_gyro_packed.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])

