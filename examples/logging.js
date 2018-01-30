var MetaWear = require('../index')//require('metawear');
var ref = require('ref');
// Store the log event for later download.  If your program needs to terminate
// before performing the log download, you will need to use mbl_mw_metawearboard_serialize
// to store the device state and that pass that state as the second argument to
// connectAndSetUp when you are ready to download.  Use mbl_mw_logger_lookup_id
// to retrieve this accelLogger object
var accelLogger = null;

// If you know the MAC address, you can uncomment this line
//MetaWear.discoverByAddress('f3:97:6b:cc:71:97', function (device) {
MetaWear.discover(function (device) {
  console.log('discovered ' + device.address);
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
  // Setup handerl for accel data points
  MetaWear.mbl_mw_logger_subscribe(accelLogger, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var pt = data.parseValue();
    console.log(data.epoch + ' ' + pt.x + ',' + pt.y + ',' + pt.z);
  }));
  // Setup the handlers for events during the download
  var downloadHandler = new MetaWear.LogDownloadHandler();
  downloadHandler.received_progress_update = MetaWear.FnVoid_VoidP_UInt_UInt.toPointer(function onSignal(context, entriesLeft, totalEntries) {
    console.log('received_progress_update entriesLeft:' + entriesLeft + ' totalEntries:' + totalEntries);
    if (entriesLeft === 0) {
      // Remove all log entries if told to stop logging
      MetaWear.mbl_mw_metawearboard_tear_down(device.board);
      callback(null);
    }
  });
  downloadHandler.received_unknown_entry = MetaWear.FnVoid_VoidP_UByte_Long_UByteP_UByte.toPointer(function onSignal(context, id, epoch, data, length) {
    console.log('received_unknown_entry');
  });
  downloadHandler.received_unhandled_entry = MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
    var data = dataPtr.deref();
    var dataPoint = data.parseValue();
    console.log('received_unhandled_entry: ' + dataPoint);
  });
  // Actually start the log download, this will cause all the handlers we setup to be invoked
  MetaWear.mbl_mw_logging_download(device.board, 20, downloadHandler.ref());
}

function startLogging(device, callback) {
  MetaWear.mbl_mw_acc_set_odr(device.board, 50.0);
  MetaWear.mbl_mw_acc_set_range(device.board, 16.0);
  MetaWear.mbl_mw_acc_write_acceleration_config(device.board);

  // See if we already created a logger
  var accSignal = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  MetaWear.mbl_mw_datasignal_log(accSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataLoggerP.toPointer(function (context, logger) {
    accelLogger = logger;
    callback(logger.address() ? null : new Error('failed to start logging accel'));
  }));

  MetaWear.mbl_mw_logging_start(device.board, 0);
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
  MetaWear.mbl_mw_acc_start(device.board);
}
