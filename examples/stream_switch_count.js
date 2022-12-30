// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref-napi');

// Discover MAC
MetaWear.discoverByAddress('f7:c0:14:1b:e5:86', function(device) {
  console.log('Discovered');
  // Connect and setup
  device.connectAndSetUp(async function (error) {
    console.log('Connected');
    
    // Get switch signal 
    console.log('Get switch');
    var switcher = MetaWear.mbl_mw_switch_get_state_data_signal(device.board);

    // Subscribe to it
    console.log('Subscribe');
    MetaWear.mbl_mw_datasignal_subscribe(switcher, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      console.log('got data');
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' counter: ' + value);
    }));
    
    // Setup terminal to end on input
    console.log('Press any key to exit');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      console.log('Disconnect');
      MetaWear.mbl_mw_debug_reset(device.board);
      setTimeout(function () {
        // Exit terminal
        process.exit(1);
      }, 2000);
    });
  });
});
