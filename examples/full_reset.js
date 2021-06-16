// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');

// Enter the board mac adddress
MetaWear.discoverByAddress('ea:78:c3:d3:f0:8a', function(device) {
  console.log('Discovered');
//MetaWear.discover(function (device) {
  device.connectAndSetUp(function (error) {
    console.log('Connected');
    console.log('Stop LED');
    MetaWear.mbl_mw_led_stop_and_clear(device.board);
    console.log('Stop logger');
    MetaWear.mbl_mw_logging_stop(device.board);
    console.log('Remove data processors and timers');
    MetaWear.mbl_mw_metawearboard_tear_down(device.board);
    console.log('Delete all log entries');
    MetaWear.mbl_mw_logging_clear_entries(device.board);
    console.log('Delete all macros');
    MetaWear.mbl_mw_macro_erase_all(device.board);
    console.log('Reset sensor and garbage collect');
    MetaWear.mbl_mw_debug_reset_after_gc(device.board);
    console.log('Wait 2 seconds');
    setTimeout(function () {
      device.on('disconnect', function () {
        process.exit(0);
      });
      console.log('Disconnect');
      MetaWear.mbl_mw_debug_disconnect(device.board);
    }, 2000);
  });
});
