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

  console.log('Set up acc signal.');
  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  console.log('Get x component of acc.');
  let acc_x = MetaWear.mbl_mw_datasignal_get_component(acc, 0); //cbindings.Const.ACC_ACCEL_X_AXIS_INDEX);  
  console.log('Set up stream.');
  MetaWear.mbl_mw_datasignal_subscribe(acc_x, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' acc x: ' + value);
  }))
  
  console.log('Start accelerometer.');
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_acc_start(device.board);

  process.openStdin().addListener("data", data => {
    console.log('Reset.');
    MetaWear.mbl_mw_debug_reset(device.board);
  })
}

mainAsync(process.argv[2])
