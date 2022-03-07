// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref-napi');

// Discover by mac
MetaWear.discoverByAddress('d1:e7:65:2a:ad:6f', function(device) {
  console.log('Discovered');
  // Connect and setup
  device.connectAndSetUp(async function (error) {
    console.log('Connected');
    
    // Get temp signal 
    console.log('Get temp');
    var temp = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board,1);

    // Subscribe to it
    console.log('Subscribe');
    MetaWear.mbl_mw_datasignal_subscribe(temp, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      console.log('got data');
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' temp: ' + value);
    }));

    // Create a timer 
    console.log('Create timer');
    var promise = new Promise((resolve, reject) => {
      var timer = MetaWear.mbl_mw_timer_create_indefinite(device.board, 1000, 0, ref.NULL, MetaWear.FnVoid_VoidP_TimerP.toPointer(function onSignall(context, timer) {
        console.log('Timer created');
        resolve(timer);
      }));
    });
    let timer = await promise;
  
    // Create event based on timer and record as a command
    // The timer will read the temp signal every 1 second and repeat
    console.log('Record command');
    MetaWear.mbl_mw_event_record_commands(timer);
    console.log('Command to read temp signal');	
    MetaWear.mbl_mw_datasignal_read(temp);
    console.log('End record command');
    promise = new Promise((resolve, reject) => {
      var rec = MetaWear.mbl_mw_event_end_record(timer, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
        console.log('Command created');
        resolve(lstatus);
      }));
    });
    let rec = await promise;
  
    // Start timer
    console.log('Start');
    MetaWear.mbl_mw_timer_start(timer);
    
    // Terminal on any input in the terminal
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

