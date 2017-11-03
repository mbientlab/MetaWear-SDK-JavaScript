
/**
 * Created by sschiffli on 11/2/17.
 */
var MetaWear = require('../index')//require('metawear');

// MetaWear.discoverByAddress('f6:3d:13:48:ce:ab', function (device) {
MetaWear.discover(function (device) {
  console.log('connecting...' + device.address);
  device.connectAndSetUp(function (error) {
    console.log('connected!');
    MetaWear.mbl_mw_metawearboard_create_anonymous_datasignals(device.board,
      MetaWear.FnVoid_MetaWearBoardP_AnonymousDataSignalP_UInt.toPointer(function (board, anonymousSignals, size) {
        if (!anonymousSignals) {
          console.log('nothing being logged');        
          process.exit(1);
        }
        // Set the size on the array so we can index
        anonymousSignals.length = size;
        var i;
        for (i = 0; i < size; i++) {
          var identifier = MetaWear.mbl_mw_anonymous_datasignal_get_identifier(anonymousSignals[i]);
          MetaWear.mbl_mw_anonymous_datasignal_subscribe(anonymousSignals[i], MetaWear.FnVoid_DataP.toPointer(function onSignal(dataPtr) {
            var data = dataPtr.deref();
            var pt = data.parseValue();
            console.log(identifier + ':' + data.epoch + ' ' + JSON.stringify(pt));
          }));
        }
        download(device, function () {
          device.once('disconnect', function (reason) {
            process.exit(0);
          });
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
  downloadHandler.received_progress_update = MetaWear.FnVoid_UInt_UInt.toPointer(function onSignal(entriesLeft, totalEntries) {
    console.log('received_progress_update entriesLeft:' + entriesLeft + ' totalEntries:' + totalEntries);
    if (entriesLeft === 0) {
      callback(null);
    }
  });
  downloadHandler.received_unknown_entry = MetaWear.FnVoid_UByte_Long_UByteP_UByte.toPointer(function onSignal(id, epoch, data, length) {
    console.log('received_unknown_entry');
  });
  downloadHandler.received_unhandled_entry = MetaWear.FnVoid_DataP.toPointer(function onSignal(dataPtr) {
    var data = dataPtr.deref();
    var dataPoint = data.parseValue();
    console.log('received_unhandled_entry: ' + dataPoint);
  });
  // Actually start the log download, this will cause all the handlers we setup to be invoked
  MetaWear.mbl_mw_logging_download(device.board, 20, downloadHandler.ref());
}
