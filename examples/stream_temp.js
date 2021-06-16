// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref');

// Discover by MAC
MetaWear.discoverByAddress('ea:78:c3:d3:f0:8a', function(device) {
  console.log('Discovered');
  // Connect and setup
  device.connectAndSetUp(async function (error) {
    // Get temp signal 
    console.log('Get temp signal');
    var temp_signal = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board, 1);
    
    // Subscribe to it
    MetaWear.mbl_mw_datasignal_subscribe(temp_signal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' temp: ' + value);
    }));
    
    // Read it once (only ONE time)
    MetaWear.mbl_mw_datasignal_read(temp_signal);
    
    // Terminal on any input in the terminal
    console.log('press any key to exit');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      console.log('disconnect');
      MetaWear.mbl_mw_debug_reset(device.board);
      setTimeout(function () {
        // Exit terminal
        process.exit(1);
      }, 2000);
    });
  });
});

