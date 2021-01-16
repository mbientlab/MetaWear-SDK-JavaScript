var MetaWear = require('../index')//require('metawear');
var ref = require('ref');

MetaWear.discoverByAddress('f9:b5:f9:81:3f:77', function(device) {
  console.log('Discovered');
  device.connectAndSetUp(async function (error) {
    // Get temp signal 
    console.log('Get temp signal');
    var temp_signal = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board, 1);
    // Subscribe to it
    MetaWear.mbl_mw_datasignal_subscribe(temp_signal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' temp: ' + value);
    }));
    // Read it
    MetaWear.mbl_mw_datasignal_read(temp_signal);
    
    console.log('press any key to exit');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      console.log('disconnect');
      MetaWear.mbl_mw_debug_reset(device.board);
      process.exit(0);
    });
  });
});

