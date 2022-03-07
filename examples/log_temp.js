// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref-napi');
var tempLogger = null;
var tempTimer = null;

// Discover by MAC address
MetaWear.discoverByAddress('ea:78:c3:d3:f0:8a', function(device) {
  console.log('Discovered');
  // Connect and setup
  device.connectAndSetUp(async function (error) {
    console.log('Connected');
    // Start logging
    startLogging(device, function (error) {
      if (error) {
        console.log(error);
        process.exit(1);
      }
      // Stop logging after 10 seconds
      console.log('Wait 10 seconds');
      setTimeout(function () {
        console.log('Done waiting');
        // Download log
        downloadLog(device, function (error) {
          device.once('disconnect', function (reason) {
            console.log('Disconnected');
            process.exit(0);
          });
          console.log('Disconnect');
          // Reset device
          MetaWear.mbl_mw_debug_reset(device.board);
        });
      }, 10000);
    });
  });
});

function downloadLog(device, callback) {
  // Stop timer
  MetaWear.mbl_mw_timer_remove(tempTimer);
  // Shutdown log
  MetaWear.mbl_mw_logging_stop(device.board);
    // MMS only call
  MetaWear.mbl_mw_logging_flush_page(device.board);
  // Setup handler for accel data points
  MetaWear.mbl_mw_logger_subscribe(tempLogger, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var pt = data.parseValue();
    console.log(data.epoch + ' ' + pt);
  }));
  // Setup the handlers for events during the download
  var downloadHandler = new MetaWear.LogDownloadHandler();
  // Handler for progress of download
  downloadHandler.received_progress_update = MetaWear.FnVoid_VoidP_UInt_UInt.toPointer(function onSignal(context, entriesLeft, totalEntries) {
    console.log('received_progress_update entriesLeft:' + entriesLeft + ' totalEntries:' + totalEntries);
    if (entriesLeft === 0) {
      // Remove all log entries if told to stop logging
      MetaWear.mbl_mw_metawearboard_tear_down(device.board);
      callback(null);
    }
  });
  // Handler for unknown entry
  downloadHandler.received_unknown_entry = MetaWear.FnVoid_VoidP_UByte_Long_UByteP_UByte.toPointer(function onSignal(context, id, epoch, data, length) {
    console.log('received_unknown_entry');
  });
  // Handler for unhandled entry
  downloadHandler.received_unhandled_entry = MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var dataPoint = data.parseValue();
    console.log('received_unhandled_entry: ' + dataPoint);
  });
  // Actually start the log download, this will cause all the handlers we setup to be invoked
  MetaWear.mbl_mw_logging_download(device.board, 20, downloadHandler.ref());
}

async function startLogging(device, callback) {
  // Get temp signal 
  console.log('Get temp signal');
  var tempSignal = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board, 1);
  // Create a timer 
  console.log('Create timer');
  var promise = new Promise((resolve, reject) => {
    var timer = MetaWear.mbl_mw_timer_create_indefinite(device.board, 1000, 0, ref.NULL, MetaWear.FnVoid_VoidP_TimerP.toPointer(function onSignal(context, timer) {
      console.log(context);
      console.log('Timer created');
      console.log(timer);
      resolve(timer);
    }));
  });
  tempTimer = await promise;
  console.log(tempTimer);
  // Create event based on timer and record as a command
  console.log('Record command');
  MetaWear.mbl_mw_event_record_commands(tempTimer);
  console.log('Command to read temp signal');	
  MetaWear.mbl_mw_datasignal_read(tempSignal);
  console.log('End record command');
  promise = new Promise((resolve, reject) => {
    var rec = MetaWear.mbl_mw_event_end_record(tempTimer, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
      console.log('Command created');
      resolve(lstatus);
    }));
  });
  let rec = await promise;
  // Start timer
  MetaWear.mbl_mw_timer_start(tempTimer);
  // Create a logger
  MetaWear.mbl_mw_datasignal_log(tempSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataLoggerP.toPointer(function (context, logger) {
    tempLogger = logger;
    callback(logger.address() ? null : new Error('failed to start logging temp'));
  }));
  // Start logger
  MetaWear.mbl_mw_logging_start(device.board, 0);
}
