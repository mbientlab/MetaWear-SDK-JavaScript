# MetaWear  SDK for Javascript by MBIENTLAB

[![Platforms](https://img.shields.io/badge/platform-linux--64%20%7C%20win--32%20%7C%20osx--64%20%7C%20win--64-lightgrey?style=flat)](https://github.com/mbientlab/MetaWear-SDK-JavaScript)
[![License](https://img.shields.io/cocoapods/l/MetaWear.svg?style=flat)](https://github.com/mbientlab/MetaWear-SDK-JavaScript/blob/master/LICENSE.md)
[![Version](https://img.shields.io/badge/node-%3D%208.0.0-brightgreen?style=flat)](https://github.com/mbientlab/MetaWear-SDK-JavaScript)

![alt tag](https://raw.githubusercontent.com/mbientlab/MetaWear-SDK-iOS-macOS-tvOS/master/Images/Metawear.png)

SDK for creating MetaWear apps that run on node.js. Supported mainly on Linux but can also work on Windows, OS X and the Browser (web-bluetooth support not widespread yet, but growing) if Noble is setup correctly.  This is a thin wrapper around the [MetaWear C++ API](https://github.com/mbientlab/Metawear-CppAPI) so you will find the C++ [documentation](https://mbientlab.com/cppdocs/latest/) and [API reference](https://mbientlab.com/docs/metawear/cpp/latest/globals.html) useful.  

Also, check out the JavaScript [examples](https://github.com/mbientlab/MetaWear-SDK-JavaScript/tree/master/examples). Again, supported on Linux only out-of-the-box.

Under the hood it uses [Noble](https://github.com/mbientlab/noble) for Bluetooth Low Energy communications.

> ADDITIONAL NOTES  
You can try to get our JS SDK running on OSX or Windows at your own risk as this requires that you get Noble to work under those OSs yourself. We do not provide examples or support for this. Please see the Noble README.

### Overview

[MetaWear](https://mbientlab.com) is a complete development and production platform for wearable and connected device applications.

MetaWear features a number of sensors and peripherals all easily controllable over Bluetooth 4.0 Low Energy using this SDK, no firmware or hardware experience needed!

The MetaWear hardware comes pre-loaded with a wirelessly upgradeable firmware, so it keeps getting more powerful over time.

### Requirements
- [MetaWear board](https://mbientlab.com/store/)
- A linux machine with Bluetooth 4.0 (or the other OSs w/ Bluetooth support at your own risk)

### License
See the [License](https://github.com/mbientlab/MetaWear-SDK-JavaScript/blob/master/LICENSE.md).

### Support
Reach out to the [community](https://mbientlab.com/community/) if you encounter any problems, or just want to chat :)

## Getting Started

### Installation
The Mbient JavaScript SDK relies on [Noble](https://github.com/mbientlab/noble) for Bluetooth Low Energy communications. You need to setup  the relevant [prerequisites for Noble](https://github.com/mbientlab/noble#prerequisites) and then [install Noble](https://github.com/mbientlab/noble#install).  

You should familiarize yourself with this README and our tutorials since there a few limitiations and other gotchas spelled out, such as the maximum number of simultaneous Bluetooth connections.

Then you can simply install the MetaWear NPM module with command line: 
```javascript
npm install metawear
```

### Usage

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
MetaWear.mbl_mw_led_load_p_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
MetaWear.mbl_mw_led_play(device.board);
```

### Example
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

### Tutorials

Tutorials can be found [here](https://mbientlab.com/tutorials/).
