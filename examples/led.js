/**
 * Created by sschiffli on 8/15/17.
 */
var MetaWear = require('../index')//require('metawear');

// If you know the MAC address, you can uncomment this line
//MetaWear.discoverByAddress('cb:7d:c5:b0:20:8f', function(device) {
MetaWear.discover(function (device) {
  device.connectAndSetUp(function (error) {
    var pattern = new MetaWear.LedPattern();
    MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
    MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
    MetaWear.mbl_mw_led_play(device.board);
    setTimeout(function () {
      device.on('disconnect', function () {
        process.exit(0);
      });
      MetaWear.mbl_mw_debug_reset(device.board);
    }, 5000);
  });
});
