// LOCAL
var MetaWear = require("../index");
// METAWEAR
//require('metawear');

var ref = require("ref-napi");

// Discover by MAC address
MetaWear.discoverByAddress("ea:78:c3:d3:f0:8a", function (device) {
  console.log("Discovered");
  // Connect and setup
  device.connectAndSetUp(async function (error) {
    console.log("Connected");

    readBatteryStatus(device);
  });
});

function readBatteryStatus(device) {
  const signal = MetaWear.mbl_mw_settings_get_battery_state_data_signal(
    device.board
  );

  // Subscribe to it
  MetaWear.mbl_mw_datasignal_subscribe(
    signal,
    ref.NULL,
    MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      const data = pointer.deref();

      // { voltage: number, charge: number} ex: {"voltage":3972 "charge":77}
      const value = data.parseValue();

      console.log("Status Battery", JSON.stringify(value), device.address);
    })
  );
  MetaWear.mbl_mw_datasignal_read(signal);
}
