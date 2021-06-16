// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref');

// Setup function
async function setupStream(device) {
  // Get the accelerometer signal 
  console.log('Get Accelerometer Signal');
  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

  // Create a buffer of the acc
  let buffer = await new Promise((resolve, reject) => {
    MetaWear.mbl_mw_dataprocessor_buffer_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
      console.log('Buffer Created');
      resolve(pointer);
    }))
  });
  console.log(buffer);
        
  // Log the buffer signal
  console.log('Set up stream.')
  MetaWear.mbl_mw_datasignal_subscribe(buffer, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log(value);
  }))
        
  // Start the acc
  console.log('Start accelerometer.');
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_acc_start(device.board);
}

// Main function
async function mainAsync(mac) {
  // Find device with MAC address
  console.log('Find device');
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  console.log('Found device');
  
  // Connect and setup
  console.log('Connecting...')
  await new Promise((resolve, reject) => { 
    device.connectAndSetUp(error => {
      if(error == null) resolve(null)
      else reject(error)
    })
  });
  console.log('Connected.');
  
  // Setup acc + buffer
  setupStream(device);
  
  // Terminate on terminal input
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
// sudo node stream_acc_buffer.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])

