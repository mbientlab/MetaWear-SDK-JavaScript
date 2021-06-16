// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref');

// THIS IS FOR THE MMS ONLY

// Store the log event for later download.  If your program needs to terminate
// before performing the log download, you will need to use mbl_mw_metawearboard_serialize
// to store the device state and that pass that state as the second argument to
// connectAndSetUp when you are ready to download.  Use mbl_mw_logger_lookup_id
// to retrieve this accelLogger object

var accelLogger = null;

// If you know the MAC address:
MetaWear.discoverByAddress('ea:78:c3:d3:f0:8a', function (device) {
// If you don't know the MAC address, this will connect to nearest
//MetaWear.discover(function (device) {
  console.log('discovered ' + device.address);
  // Connect and setup
  device.connectAndSetUp(function (error) {
    if (error) {
      console.log(error);
      process.exit(1);
    }
    console.log('connected ' + device.address);
    // Start logging
    startLogging(device, function (error) {
      if (error) {
        console.log(error);
        process.exit(1);
      }
      // Stop logging after 10 seconds
      setTimeout(function () {
        downloadLog(device, function (error) {
          device.once('disconnect', function (reason) {
            process.exit(0);
          });
          MetaWear.mbl_mw_debug_reset(device.board);
        });
      }, 10000);
    });
  });
});

function downloadLog(device, callback) {
  // Shutdown accel
  MetaWear.mbl_mw_acc_stop(device.board);
  MetaWear.mbl_mw_acc_disable_acceleration_sampling(device.board);
  // Shutdown log
  MetaWear.mbl_mw_logging_stop(device.board);
  // MMS only call
  MetaWear.mbl_mw_logging_flush_page(device.board);
  // Setup handler for accel data points entries
  MetaWear.mbl_mw_logger_subscribe(accelLogger, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var pt = data.parseValue();
    console.log(data.epoch + ' ' + pt.x + ',' + pt.y + ',' + pt.z);
  }));
  // Setup the handlers for events during the download
  var downloadHandler = new MetaWear.LogDownloadHandler();
  // Setup handler progress updates
  downloadHandler.received_progress_update = MetaWear.FnVoid_VoidP_UInt_UInt.toPointer(function onSignal(context, entriesLeft, totalEntries) {
    console.log('received_progress_update entriesLeft:' + entriesLeft + ' totalEntries:' + totalEntries);
    if (entriesLeft === 0) {
      // Remove timers and data processors
      MetaWear.mbl_mw_metawearboard_tear_down(device.board);
      callback(null);
    }
  });
  // Setup handle for unknown entry
  downloadHandler.received_unknown_entry = MetaWear.FnVoid_VoidP_UByte_Long_UByteP_UByte.toPointer(function onSignal(context, id, epoch, data, length) {
    console.log('received_unknown_entry');
  });
  // Setup handler for unhandled entry
  downloadHandler.received_unhandled_entry = MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var dataPoint = data.parseValue();
    console.log('received_unhandled_entry: ' + dataPoint);
  });
  // Actually start the log download, this will cause all the handlers we setup to be invoked
  MetaWear.mbl_mw_logging_download(device.board, 20, downloadHandler.ref());
}

function startLogging(device, callback) {
  // Setup accelerometer
  MetaWear.mbl_mw_acc_set_odr(device.board, 50.0);
  MetaWear.mbl_mw_acc_set_range(device.board, 16.0);
  MetaWear.mbl_mw_acc_write_acceleration_config(device.board);

  // See if we already created a logger
  var accSignal = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  // Log the signal
  MetaWear.mbl_mw_datasignal_log(accSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataLoggerP.toPointer(function (context, logger) {
    accelLogger = logger;
    callback(logger.address() ? null : new Error('failed to start logging accel'));
  }));
  // Start logging
  MetaWear.mbl_mw_logging_start(device.board, 0);
  // Start the accelerometer
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_acc_start(device.board);
}
