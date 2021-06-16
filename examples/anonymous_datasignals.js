// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref')

// MetaWear.discoverByAddress('f6:3d:13:48:ce:ab', function (device) {
MetaWear.discover(function (device) {
  console.log('connecting...' + device.address);
  device.connectAndSetUp(function (error) {
    console.log('connected!');
    // Find the Anonymous signals
    MetaWear.mbl_mw_metawearboard_create_anonymous_datasignals(device.board, ref.NULL,
      MetaWear.FnVoid_VoidP_MetaWearBoardP_AnonymousDataSignalP_UInt.toPointer(function (context, board, anonymousSignals, size) {
        if (!anonymousSignals) {
          console.log('nothing being logged');        
          process.exit(1);
        }
        // Set the size on the array so we can index
        anonymousSignals.length = size;
        var i;
        for (i = 0; i < size; i++) {
          // Get signals that have been logged using the identifier api
          var identifier = MetaWear.mbl_mw_anonymous_datasignal_get_identifier(anonymousSignals[i]);
          // Subscribe to the signals we found
          MetaWear.mbl_mw_anonymous_datasignal_subscribe(anonymousSignals[i], ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
            var data = dataPtr.deref();
            var pt = data.parseValue();
            console.log(identifier + ':' + data.epoch + ' ' + JSON.stringify(pt));
          }));
        }
        // Download the log
        download(device, function () {
          device.once('disconnect', function (reason) {
            // Exit App
            process.exit(0);
          });
          // Reset
          MetaWear.mbl_mw_macro_erase_all(device.board);
          MetaWear.mbl_mw_debug_reset_after_gc(device.board);
          MetaWear.mbl_mw_debug_disconnect(device.board);
        });
      }));
  });
});

function download(device, callback) {
  // Setup the handlers for events during the download
  var downloadHandler = new MetaWear.LogDownloadHandler();
  downloadHandler.received_progress_update = MetaWear.FnVoid_VoidP_UInt_UInt.toPointer(function onSignal(context, entriesLeft, totalEntries) {
    console.log('received_progress_update entriesLeft:' + entriesLeft + ' totalEntries:' + totalEntries);
    if (entriesLeft === 0) {
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
