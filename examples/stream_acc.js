var MetaWear = require('../index');
var ref = require('ref')

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

  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board)
  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z)
  }))
  
  console.log('Start accelerometer.')
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board)
  MetaWear.mbl_mw_acc_start(device.board)

  process.openStdin().addListener("data", data => {
    console.log('Reset.')
    MetaWear.mbl_mw_debug_reset(device.board)
  })
}

mainAsync(process.argv[2])
