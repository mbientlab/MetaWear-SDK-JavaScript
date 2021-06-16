// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref');

// Discover by MAC
MetaWear.discoverByAddress('ea:78:c3:d3:f0:8a', function(device) {
  console.log('Discovered');
  // Setup
  device.connectAndSetUp(async function (error) {
    console.log('Connected');
    
    // Get pressure signal 
    console.log('Get pressure');
    var baro = MetaWear.mbl_mw_baro_bosch_get_pressure_data_signal(device.board);

    // Create a comparator to only allow pressure >= 102190 pascals to passthrough (5 is the opp type - see ComparatorOperation in binding file)
    var promise = new Promise((resolve, reject) => {
      var comparator = MetaWear.mbl_mw_dataprocessor_comparator_create(baro, 5, 102190.0, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, comparator) {1
        console.log('comparator created');
        resolve(comparator);
      }));
    });
    let comparator = await promise;

    // Subscribe to it
    console.log('Subscribe');
    MetaWear.mbl_mw_datasignal_subscribe(comparator, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((context, pointer) => {
      console.log('got data');
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' pressure: ' + value);
    }));
  
    // Start timer
    console.log('Start');
    MetaWear.mbl_mw_baro_bosch_start(device.board);
    
    // End on terminal input
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

