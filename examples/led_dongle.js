//Multiple Adapters
//hci0 is used by default to override set the NOBLE_HCI_DEVICE_ID environment variable to the interface number.
//Example, specify hci1:
//sudo NOBLE_HCI_DEVICE_ID=1 node <your file>.js

//Reporting all HCI events
//By default noble waits for both the advertisement data and scan response data for each Bluetooth address. If your device does not use scan response the following environment variable can be used to bypass it.
//sudo NOBLE_REPORT_ALL_HCI_EVENTS=1 node <your file>.js

var MetaWear = require('../index')//require('metawear');

// If you know the MAC address, you can uncomment this line
MetaWear.discoverByAddress('f9:b5:f9:81:3f:77', function(device) {
//MetaWear.discover(function (device) {
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
