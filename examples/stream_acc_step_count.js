var MetaWear = require("../index.js") //require('metawear');
var ref = require("ref")
var accelerometerBMI160StepCount = 0

async function mainAsync(mac) {
  var device = await new Promise((resolve, reject) =>
    MetaWear.discoverByAddress(mac.toLowerCase(), (d) => resolve(d))
  )
  await new Promise((resolve, reject) => {
    console.log("Connecting...")
    device.connectAndSetUp((error) => {
      console.log("Connected.")
      if (error == null) resolve(null)
      else reject(error)
    })
  })

  console.log("Enable acc steps.")

  let acc = MetaWear.mbl_mw_acc_bmi160_get_step_detector_data_signal(
    device.board
  )
  console.log("Set up stream.")
  MetaWear.mbl_mw_datasignal_subscribe(
    acc,
    ref.NULL,
    MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      accelerometerBMI160StepCount += 1
      console.log("Steps:" + accelerometerBMI160StepCount)
    })
  )

  console.log("Start accelerometer.")
  MetaWear.mbl_mw_acc_bmi160_enable_step_detector(device.board)
  MetaWear.mbl_mw_acc_start(device.board)

  process.openStdin().addListener("data", (data) => {
    console.log("Reset.")
    MetaWear.mbl_mw_debug_reset(device.board)
    MetaWear.mbl_mw_macro_erase_all(device.board)
    MetaWear.mbl_mw_debug_reset_after_gc(device.board)
    MetaWear.mbl_mw_debug_disconnect(device.board)
  })
}

mainAsync("MAC-ADDRESS-OF-THE-DEVICE")
