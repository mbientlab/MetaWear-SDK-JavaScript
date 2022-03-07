// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');
var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref-napi');

// If you know the MAC address:
MetaWear.discoverByAddress('d1:e7:65:2a:ad:6f', function(device) {
//MetaWear.discover(function (device) {
  device.connectAndSetUp(function (error) {
    // Create a LED patter type
    var pattern = new MetaWear.LedPattern();
    // Load a LED pattern already in firmware
    MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
    // Send pattern to Board
    MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
    // Tell board to play pattern
    MetaWear.mbl_mw_led_play(device.board);
    setTimeout(function () {
      device.on('disconnect', function () {
        process.exit(0);
      });
      // Stop LED
      MetaWear.mbl_mw_led_stop_and_clear(device.board);
      // Debug reset board
      MetaWear.mbl_mw_debug_reset(device.board);
    }, 5000); // Wait 5 seconds
  });
});
