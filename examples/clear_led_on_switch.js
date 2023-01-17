// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref-napi');

MetaWear.discoverByAddress('f7:c0:14:1b:e5:86', function(device) {
  console.log('Discovered');
  device.connectAndSetUp(async function (error) {
   
    console.log('Get button signal');
    var switcher = MetaWear.mbl_mw_switch_get_state_data_signal(device.board);
  

    console.log('Create switch counter');
    var promise = new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_counter_create(switcher, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('Comparator Created');
        resolve(dataPtr);
      }));
    });
    let counter = await promise;

    console.log('Create modular 2 calc on counter');
    promise = new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_math_create(counter, cbindings.MathOperation.MODULUS, 2.0, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('Modulator Created');
        resolve(dataPtr);
      }));
    });
    let moder = await promise;

    console.log('Create odd comparator');
    promise = new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_comparator_create(moder, cbindings.ComparatorOperation.EQ, 1.0, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('Odder Created');
        resolve(dataPtr);
      }));
    });
    let odder = await promise;

    console.log('Create even comparator');
    promise = new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_comparator_create(moder, cbindings.ComparatorOperation.EQ, 0.0, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('Evener Created');
        resolve(dataPtr);
      }));
    });
    let evener = await promise;

    // Create a LED patter type
    console.log('Set up LED');
    var pattern = new MetaWear.LedPattern();
    // Load a LED pattern already in firmware
    MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), cbindings.LedPreset.SOLID);

    console.log('Record COMMAND for even switch');
    MetaWear.mbl_mw_event_record_commands(evener);
    MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), cbindings.LedColor.BLUE);
    MetaWear.mbl_mw_led_play(device.board);
    console.log('End Record COMMAND for even switch');
    promise = new Promise((resolve, reject) => {
      var startLog = MetaWear.mbl_mw_event_end_record(evener, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
        console.log('COMMAND Created');
        resolve(lstatus);
      }));
    });
    let startLog = await promise;

    console.log('Record COMMAND for odd switch');
    MetaWear.mbl_mw_event_record_commands(odder);
    MetaWear.mbl_mw_led_stop_and_clear(device.board);
    console.log('End Record COMMAND for odd switch');
    promise = new Promise((resolve, reject) => {
      var stopLog = MetaWear.mbl_mw_event_end_record(odder, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
        console.log('COMMAND Created');
        resolve(lstatus);
      }));
    });
    let stopLog = await promise;

    MetaWear.mbl_mw_debug_disconnect(device.board);
    device.on('disconnect', function () {
      process.exit(0);
    });
  });
});
