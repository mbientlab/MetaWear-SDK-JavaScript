# MetaWear JavaScript SDK #
JavaScript SDK for creating MetaWear apps that run on node.js or in the browser (web-bluetooth support not widespread yet, but growing).  This is a thin wrapper around the [MetaWear C++ API](https://github.com/mbientlab/Metawear-CppAPI) so you will find the C++ [documentation](https://mbientlab.com/cppdocs/latest/) and [API reference](https://mbientlab.com/docs/metawear/cpp/latest/globals.html) useful.  Also, check out the JavaScript [examples](https://github.com/mbientlab/MetaWear-SDK-JavaScript/tree/master/examples).


# Install Noble #
The Mbient JavaScript SDK relies on [Noble](https://github.com/mbientlab/noble) for Bluetooth Low Energy communications. You need to setup  the relevant [prerequisites for Noble](https://github.com/mbientlab/noble#prerequisites) and then [install Noble](https://github.com/mbientlab/noble#install).  You should familiarize yourself with the rest of the README since there a few limitiations and other gotchas spelled out, such as the maximum number of simultaneous Bluetooth connections.

# Install Metawear #
Install mbient's Metawear NPM module by simply entering in the command line: 
```javascript
npm install metawear
```

# Usage #

Require the metawear package

```javascript
var MetaWear = require('metawear');
```
Discover the first MetaWear device seen
```javascript
MetaWear.discover(function (device) { ... }
```

Or a specific MAC address
```javascript
MetaWear.discoverByAddress('cb:7d:c5:b0:20:8f', function(device) { ... }
```
There are other options too, documented in [Noble Device](https://github.com/mbientlab/noble-device#discovery-api)

After that, you must connect to the device
```javascript
device.connectAndSetUp(function (error) { ... }
```

At this point you can call any of the MetaWear API's, for example, you can blink the LED green
```javascript
var pattern = new MetaWear.LedPattern();
MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
MetaWear.mbl_mw_led_play(device.board);
```

### Complete Example ###
```javascript
var MetaWear = require('metawear');

MetaWear.discover(function (device) {
  device.connectAndSetUp(function (error) {
    var pattern = new MetaWear.LedPattern();
    MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
    MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
    MetaWear.mbl_mw_led_play(device.board);
    // After 5 seconds we reset the board to clear the LED, when we receive
    // a disconnect notice we know the reset is complete, so exit the program
    setTimeout(function () {
      device.on('disconnect', function () {
        process.exit(0);
      });
      MetaWear.mbl_mw_debug_reset(device.board);
    }, 5000);
  });
});
```

