var MetaWear = require('../index');
var ref = require('ref');

async function mainAsync(mac) {
  // Find device with MAC address
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  
  // Connect to device with MAC address
  await new Promise((resolve, reject) => {
    console.log('Connecting...')
    device.connectAndSetUp(error => {
    console.log('Connected.')
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  // Get the accelerometer signal 
  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  
  // Add a counter to the accelerometer signal
  let accounter = await new Promise((resolve, reject) => {
    MetaWear.mbl_mw_dataprocessor_accounter_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
      console.log('Accounter Created');
      resolve(pointer);
    }))
  });
  console.log(accounter);
  
  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(accounter, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
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

