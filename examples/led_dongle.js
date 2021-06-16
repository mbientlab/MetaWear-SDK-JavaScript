// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');

//Multiple Adapters
//hci0 is used by default to override set the NOBLE_HCI_DEVICE_ID environment variable to the interface number.
//Example, specify hci1:
//sudo NOBLE_HCI_DEVICE_ID=1 node <your file>.js

//Reporting all HCI events
//By default noble waits for both the advertisement data and scan response data for each Bluetooth address. If your device does not use scan response the following environment variable can be used to bypass it.
//sudo NOBLE_REPORT_ALL_HCI_EVENTS=1 node <your file>.js

// If you know the MAC address:
MetaWear.discoverByAddress('ea:78:c3:d3:f0:8a', function(device) {
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
