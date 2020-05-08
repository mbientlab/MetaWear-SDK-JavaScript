var MetaWear = require('../index')//require('metawear');

MetaWear.discoverByAddress('f9:b5:f9:81:3f:77', function(device) {
  console.log('Discovered');
//MetaWear.discover(function (device) {
  device.connectAndSetUp(function (error) {
    console.log('Connected');
    console.log('Stop logger and clear all entries');
    MetaWear.mbl_mw_logging_stop(device.board);
    MetaWear.mbl_mw_logging_clear_entries(device.board);
    console.log('Delete all macros');
    MetaWear.mbl_mw_macro_erase_all(device.board);
    console.log('Reset sensor');
    MetaWear.mbl_mw_debug_reset_after_gc(device.board);
    device.disconnect(function (error) {
      console.log('Disconnected');
      process.exit(0);
    });
  });
});
