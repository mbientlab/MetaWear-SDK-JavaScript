// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var ref = require('ref-napi');
var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');

function part1(device) {
  return new Promise(function(resolve, reject) {
    console.log('Find loggers');
    MetaWear.mbl_mw_metawearboard_create_anonymous_datasignals(device.board, ref.NULL,
      MetaWear.FnVoid_VoidP_MetaWearBoardP_AnonymousDataSignalP_UInt.toPointer(function (context, board, anonymousSignals, size) {
        if (!anonymousSignals || (size == 0)) {
          console.log('Nothing being logged');  
          console.log('Stop logger just in case');
          MetaWear.mbl_mw_logging_stop(device.board);
          resolve();      
        } else {
          console.log('Something is being logged');
          anonymousSignals.length = size;
          var i;
          console.log(size);
          for (i = 0; i < size; i++) {
            console.log(i);
            var identifier = MetaWear.mbl_mw_anonymous_datasignal_get_identifier(anonymousSignals[i]);
            console.log('Found signal: ' + i + ' for ' + identifier);
            console.log('Removing this logger!');
            MetaWear.mbl_mw_logger_remove(anonymousSignals[i]);
          }
          resolve();
        }
      }
    ));
  });
}

function part2(device) {
  return new Promise(function(resolve, reject) {
    console.log('Checking memory');
    MetaWear.mbl_mw_logging_get_length_data_signal(device.board);
    var logSignal = MetaWear.mbl_mw_logging_get_length_data_signal(device.board);
    MetaWear.mbl_mw_datasignal_subscribe(logSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('Log size is: ' + value);
      console.log('Delete all log entries');
      MetaWear.mbl_mw_logging_clear_entries(device.board);
      resolve(0);
    }));
    MetaWear.mbl_mw_datasignal_read(logSignal);
  });
}

function part3(device) {
  return new Promise(function(resolve, reject) {
    console.log('Stop LED');
    MetaWear.mbl_mw_led_stop_and_clear(device.board);
    
    console.log('Remove data processors and timers');
    MetaWear.mbl_mw_metawearboard_tear_down(device.board);
  
    console.log('Delete all macros');
    MetaWear.mbl_mw_macro_erase_all(device.board);
  
    resolve();
  });
}

// Enter the board mac adddress
MetaWear.discoverByAddress('f7:c0:14:1b:e5:86', function(device) {
  console.log('Discovered');
  device.connectAndSetUp(function (error) {
    console.log('Connected');
    part1(device).then((results) => {
      part2(device).then((results) => {
        part3(device).then((results) => {
          console.log('Reset sensor and garbage collect');
          MetaWear.mbl_mw_debug_reset_after_gc(device.board);
          console.log("Wait 2 sec")
          setTimeout(function () {
            device.on('disconnect', function () {
              process.exit(0);
            });
            console.log('Disconnect');
            MetaWear.mbl_mw_debug_disconnect(device.board);
          }, 2000);
        });
      });
    });
  });
});