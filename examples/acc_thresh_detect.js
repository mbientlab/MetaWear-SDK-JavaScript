// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');

var ref = require('ref-napi');
// Store the log event for later download.  If your program needs to terminate
// before performing the log download, you will need to use mbl_mw_metawearboard_serialize
// to store the device state and that pass that state as the second argument to
// connectAndSetUp when you are ready to download.  Use mbl_mw_logger_lookup_id
// to retrieve this accelLogger object
var thsLogger = null;

MetaWear.discoverByAddress('ea:78:c3:d3:f0:8a', function(device) {
  console.log('Discovered');
  device.connectAndSetUp(async function (error) {

    // setup accelerometer (odr 50Hz and 2Gs)
    console.log('Set up acc');
    // For MMRL, MMR, MMC
    //MetaWear.mbl_mw_acc_bmi160_set_odr(device.board, 6);
    // For MMS
    MetaWear.mbl_mw_acc_bmi270_set_odr(device.board, cbindings.AccBmi270Odr._50Hz);
    MetaWear.mbl_mw_acc_set_range(device.board, 1);
    MetaWear.mbl_mw_acc_write_acceleration_config(device.board);

    // start to setup rms->avg->thresh->log chain
    console.log('Get acc signal');
    var acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    // create RMS - root mean square of acc X,Y,Z
    console.log('Create RMS');
    let promise = new Promise((resolve, reject) => {
      var rms = MetaWear.mbl_mw_dataprocessor_rms_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('RMS Created');
        resolve(dataPtr);
      }));
    });
    let rms = await promise;
    console.log(rms);

    // setup averager - averages over 8 RMS samples @ 50Hz
    console.log('Create AVG');
    promise = new Promise((resolve, reject) => {
      var avg = MetaWear.mbl_mw_dataprocessor_average_create(rms, 8, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('AVG Created');
        resolve(dataPtr);
      }));
    });
    let avg = await promise;
    console.log(avg);

    // setup event on avg - reset averager
    console.log('Record COMMAND');
    MetaWear.mbl_mw_event_record_commands(avg);
    console.log('First command: reset averager after it fires -> 8 data pts');
    MetaWear.mbl_mw_dataprocessor_average_reset(avg);
    console.log('End Record COMMAND');
    promise = new Promise((resolve, reject) => {
      var rec = MetaWear.mbl_mw_event_end_record(avg, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
        console.log('COMMAND Created');
        resolve(lstatus);
      }));
    });
    let rec = await promise;
    console.log(rec);

    // setup threshold detector - detect anything above 1
    console.log('Create THRESH');
    promise = new Promise((resolve, reject) => {
      var ths = MetaWear.mbl_mw_dataprocessor_threshold_create(avg, 1, 1.0, 0.0, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('THRESH Created:' + dataPtr);
        resolve(dataPtr);
      }));
    });
    let ths = await promise;
    console.log(ths);

    // setup logger - log the final signal of the averaged data
    console.log('Create LOGGER');
    promise = new Promise((resolve, reject) => {
      var thsl = MetaWear.mbl_mw_datasignal_log(ths, ref.NULL, MetaWear.FnVoid_VoidP_DataLoggerP.toPointer(function onSignal(context, logger) {
        console.log('LOGGER Created: ' + logger);
        resolve(logger);
      }));
    });
    thsLogger = await promise;
    console.log(thsLogger);

    // Start logging
    startLogging(device, function (error) {
      if (error) {
        console.log(error);
        process.exit(1);
      }
      console.log('wait 10s');
      // Stop logging after 10 seconds
      setTimeout(function () {
	console.log('done waiting');
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
});

function startLogging(device, callback) {
  console.log('Enable Acc and Start logging');
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_acc_start(device.board);
  MetaWear.mbl_mw_logging_start(device.board, 0);
  callback(null);
}

function downloadLog(device, callback) {
  console.log('Disable Acc and Stop logging');
  // Shutdown accel and logger
  MetaWear.mbl_mw_acc_stop(device.board);
  MetaWear.mbl_mw_acc_disable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_logging_stop(device.board);
  console.log('Setup Download');
  // Subscribe to the logger of the signal
  MetaWear.mbl_mw_logger_subscribe(thsLogger, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var pt = data.parseValue();
    console.log('received_entry: ' + data.epoch + ' ' + pt);
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

