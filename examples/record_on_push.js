// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref-napi');
var accLogger = null;

MetaWear.discoverByAddress('f7:c0:14:1b:e5:86', function(device) {
  console.log('Discovered');
  device.connectAndSetUp(async function (error) {

    console.log('Set up acc');
    MetaWear.mbl_mw_acc_bmi160_set_odr(device.board, cbindings.AccBmi160Odr._25Hz);
    MetaWear.mbl_mw_acc_set_range(device.board, cbindings.AccBoschRange._2G);
    MetaWear.mbl_mw_acc_write_acceleration_config(device.board);

    console.log('Get acc signal');
    var acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    console.log('Create LOGGER for acc');
    var promise = new Promise((resolve, reject) => {
      MetaWear.mbl_mw_datasignal_log(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataLoggerP.toPointer(function onSignal(context, logger) {
        console.log('LOGGER Created for acc: ' + logger);
        resolve(logger);
      }));
    });
    accLogger = await promise;

    console.log('Enable and Start Acc');
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
    MetaWear.mbl_mw_acc_start(device.board);

    console.log('Get button signal');
    var switcher = MetaWear.mbl_mw_switch_get_state_data_signal(device.board);

    console.log('Create switch counter');
    promise = new Promise((resolve, reject) => {
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

    console.log('Record COMMAND for even switch - not pressed');
    MetaWear.mbl_mw_event_record_commands(evener);
    MetaWear.mbl_mw_logging_stop(device.board);
    MetaWear.mbl_mw_led_stop_and_clear(device.board);
    console.log('End Record COMMAND for even switch');
    promise = new Promise((resolve, reject) => {
      var startLog = MetaWear.mbl_mw_event_end_record(evener, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
        console.log('COMMAND Created');
        resolve(lstatus);
      }));
    });
    let startLog = await promise;

    console.log('Record COMMAND for odd switch - pressed');
    MetaWear.mbl_mw_event_record_commands(odder);
    MetaWear.mbl_mw_logging_start(device.board, 0);
    MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), cbindings.LedColor.RED);
    MetaWear.mbl_mw_led_play(device.board);
    console.log('End Record COMMAND for odd switch');
    promise = new Promise((resolve, reject) => {
      var stopLog = MetaWear.mbl_mw_event_end_record(odder, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
        console.log('COMMAND Created');
        resolve(lstatus);
      }));
    });
    let stopLog = await promise;

    console.log('wait 10s');
    // Stop after 10 seconds and download log
    setTimeout(function () {
      console.log('done waiting, lets download log');
      downloadLog(device, function (error) {
        device.once('disconnect', function (reason) {
          console.log('disconnect');
          process.exit(0);
        });
        MetaWear.mbl_mw_debug_reset(device.board);
      });
    }, 10000);
  });
});

function downloadLog(device, callback) {
  console.log('Disable Acc and Stop logging');
  // Shutdown accel and logger
  MetaWear.mbl_mw_acc_stop(device.board);
  MetaWear.mbl_mw_acc_disable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_logging_stop(device.board);

  console.log('Setup Download');
  // Subscribe to the logger of the signal
  MetaWear.mbl_mw_logger_subscribe(accLogger, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var pt = data.parseValue();
    str = JSON.stringify(pt);
    var d = new Date(0); 
    d.setUTCSeconds(data.epoch);
    console.log('received_entry: ' + d + ' ' + str);
  }));

  // Setup the handlers for events during the download
  var downloadHandler = new MetaWear.LogDownloadHandler();

  // Handle download progress updates
  downloadHandler.received_progress_update = MetaWear.FnVoid_VoidP_UInt_UInt.toPointer(function onSignal(context, entriesLeft, totalEntries) {
    console.log('received_progress_update entriesLeft:' + entriesLeft + ' totalEntries:' + totalEntries);
    if (entriesLeft === 0) {
      // Remove all log entries if told to stop logging
      MetaWear.mbl_mw_metawearboard_tear_down(device.board);
      callback(null);
    }
  });

  // Handle unknown entries
  downloadHandler.received_unknown_entry = MetaWear.FnVoid_VoidP_UByte_Long_UByteP_UByte.toPointer(function onSignal(context, id, epoch, data, length) {
    console.log('received_unknown_entry');
  });

  // Handle bad entries
  downloadHandler.received_unhandled_entry = MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var dataPoint = data.parseValue();
    console.log('received_unhandled_entry: ' + dataPoint);
  });

  // Actually start the log download, this will cause all the handlers we setup to be invoked
  console.log('Start Download');
  MetaWear.mbl_mw_logging_download(device.board, 20, downloadHandler.ref());
}