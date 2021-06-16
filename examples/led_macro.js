// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref');

// If you know the MAC address:
MetaWear.discoverByAddress('ea:78:c3:d3:f0:8a', function(device) {
// This connects to the closest Metawear
//MetaWear.discover(function (device) {
  device.connectAndSetUp(async function (error) {
    // Record the macro
    console.log('Macro started');
    MetaWear.mbl_mw_macro_record(device.board, 1) // 1 means to exect the macro on boot, else macro must be executed with mbl_mw_execute
    // Create and LED pattern and play it
    console.log('LED');
    var pattern = new MetaWear.LedPattern();
    MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
    MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
    MetaWear.mbl_mw_led_play(device.board);
    console.log('END');
    // End the macro recording
    var promise = new Promise((resolve, reject) => {
      var macro = MetaWear.mbl_mw_macro_end_record(device.board, ref.NULL, MetaWear.FnVoid_VoidP_Int.toPointer(function onSignal(context, rec) {
        console.log('Macro created');
        console.log(rec);
        resolve(rec);
      }));
    });
    var rec = await promise;
    setTimeout(function () {
      console.log('WAIT 5 SECONDS');
      device.on('disconnect', function () {
        // End terminal process
        process.exit(0);
      });
      // Reset board
      MetaWear.mbl_mw_debug_reset(device.board);
    }, 5000); // Wait 5 seconds
  });
});
