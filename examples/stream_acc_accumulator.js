var MetaWear = require('../index');
var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
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
  let baro = MetaWear.mbl_mw_baro_bosch_get_pressure_data_signal(device.board);
  
  // Create an averager of the 
  let accumulator = await new Promise((resolve, reject) => {
    MetaWear.mbl_mw_dataprocessor_accumulator_create(baro, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
      console.log('Accumulator Created');
      resolve(pointer);
    }))
  });
  console.log(accumulator);
  
  MetaWear.mbl_mw_dataprocessor_set_accumulator_state(accumulator, 0);
  
  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(accumulator, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' pressure: ' + value)
  }))
  
  console.log('Start barometer.')
  MetaWear.mbl_mw_baro_bosch_start(device.board);

  process.openStdin().addListener("data", data => {
    console.log('Reset.')
    MetaWear.mbl_mw_debug_reset(device.board)
  })
}

mainAsync(process.argv[2])

