var MetaWear = require('../index');
var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref');

async function setupStream(device) {
  // Get the accelerometer signal 
  console.log('Get Accelerometer Signal');
  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

  // Create an averager of the 
  let buffer = await new Promise((resolve, reject) => {
    MetaWear.mbl_mw_dataprocessor_buffer_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
      console.log('Buffer Created');
      resolve(pointer);
    }))
  });
  console.log(buffer);
        
  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(buffer, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log(value);
  }))
        
  console.log('Start accelerometer.');
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_acc_start(device.board);
}

async function mainAsync(mac) {
  // Find device with MAC address
  console.log('Find device');
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  console.log('Found device');
  
  console.log('Connecting...')
  await new Promise((resolve, reject) => { 
    device.connectAndSetUp(error => {
      if(error == null) resolve(null)
      else reject(error)
    })
  });
  console.log('Connected.');
  
  setupStream(device);
  
  process.openStdin().addListener("data", data => {
    console.log('Reset.')
    MetaWear.mbl_mw_debug_reset(device.board)
  })
}

mainAsync(process.argv[2])

