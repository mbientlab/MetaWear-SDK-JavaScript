// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref');

// Main function
async function mainAsync(mac) {
  // Find device with MAC address
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  
  // Connect to device with MAC address
  await new Promise((resolve, reject) => {
    console.log('Connecting...')
    // Setup and connect
    device.connectAndSetUp(error => {
    console.log('Connected.')
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  // Get the barometer signal 
  let baro = MetaWear.mbl_mw_baro_bosch_get_pressure_data_signal(device.board);
  
  // Create an averager of the baro (pressure)
  let accumulator = await new Promise((resolve, reject) => {
    MetaWear.mbl_mw_dataprocessor_accumulator_create(baro, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
      console.log('Accumulator Created');
      resolve(pointer);
    }))
  });
  console.log(accumulator);
  
  // Create accumulator
  MetaWear.mbl_mw_dataprocessor_set_accumulator_state(accumulator, 0);
  
  // Subscribe to logger
  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(accumulator, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log('epoch: ' + data.epoch + ' pressure: ' + value)
  }))
  
  // Start baromater
  console.log('Start barometer.')
  MetaWear.mbl_mw_baro_bosch_start(device.board);

  // Reset process on any terminal entry
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
// sudo node stream_acc_accumulator.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])

