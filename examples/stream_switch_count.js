var MetaWear = require('./index.js');
var cbindings = require('./MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref');

MetaWear.discoverByAddress('c8:4b:aa:97:50:05', function(device) {
  console.log('Discovered');
  device.connectAndSetUp(async function (error) {
    console.log('Connected');
    
    // Get swithc signal 
    console.log('Get switch');
    var switchs = MetaWear.mbl_mw_switch_get_state_data_signal(device.board);

    // Create a counter 
    console.log('Create counter');
    let counter = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_counter_create(switchs, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Counter Created');
        resolve(pointer);
      }))
    });
    console.log(counter);

    // Subscribe to it
    console.log('Subscribe');
    MetaWear.mbl_mw_datasignal_subscribe(counter, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      console.log('got data');
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' counter: ' + value);
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
    console.log('Record command');
    MetaWear.mbl_mw_event_record_commands(timer);
    console.log('Command to read temp signal');	
    MetaWear.mbl_mw_datasignal_read(counter);
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
    
    console.log('Press any key to exit');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      console.log('Disconnect');
      MetaWear.mbl_mw_debug_reset(device.board);
      process.exit(0);
    });
  });
});
