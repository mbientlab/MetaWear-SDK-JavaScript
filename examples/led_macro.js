var MetaWear = require('../index')//require('metawear');
var ref = require('ref');

// If you know the MAC address, you can uncomment this line
MetaWear.discoverByAddress('f9:b5:f9:81:3f:77', function(device) {
//MetaWear.discover(function (device) {
  device.connectAndSetUp(async function (error) {

    console.log('Macro started');
    MetaWear.mbl_mw_macro_record(device.board, 1)

    console.log('LED');
    var pattern = new MetaWear.LedPattern();
    MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
    MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
    MetaWear.mbl_mw_led_play(device.board);
    console.log('END');

    var promise = new Promise((resolve, reject) => {
      var macro = MetaWear.mbl_mw_macro_end_record(device.board, ref.NULL, MetaWear.FnVoid_VoidP_Int.toPointer(function onSignal(context, rec) {
        console.log('Macro created');
        console.log(rec);
        resolve(rec);
      }));
    });
    var rec = await promise;

    setTimeout(function () {
      device.on('disconnect', function () {
        process.exit(0);
      });
      MetaWear.mbl_mw_debug_reset(device.board);
    }, 5000);
  });
});
