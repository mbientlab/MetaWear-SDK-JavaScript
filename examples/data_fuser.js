var MetaWear = require('../index.js')//require('metawear');
var ref = require('ref')

async function mainAsync(mac) {
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
  await new Promise((resolve, reject) => {
    device.connectAndSetUp(error => {
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board)
  let gyro = MetaWear.mbl_mw_gyro_bmi160_get_rotation_data_signal(device.board)

  let fuser = await new Promise((resolve, reject) => {
    //ArrayType(ref.refType(AnonymousDataSignal));
    console.log("creating fuser? ")
    console.log(acc)
    console.log(gyro)
    MetaWear.mbl_mw_dataprocessor_fuser_create(acc, new MetaWear.ArrayDataSignalP([gyro]), 1, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
      if (!pointer) {
        reject("Failed to create fuser")
      } else {
        resolve(pointer);
      }
    }))
    console.log("fuser created?")
  })

  MetaWear.mbl_mw_datasignal_subscribe(fuser, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var values = data.parseValue({'nElem': 2});

    let acc = values[0]
    let gyro = values[1]

    console.log(`acc: (${acc.x},${acc.y},${acc.z}), gyro; (${gyro.x},${gyro.y},${gyro.z})`)
  }))
  
  MetaWear.mbl_mw_gyro_bmi160_enable_rotation_sampling(device.board)
  MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board)

  MetaWear.mbl_mw_gyro_bmi160_start(device.board)
  MetaWear.mbl_mw_acc_start(device.board)

  process.openStdin().addListener("data", data => {
    MetaWear.mbl_mw_debug_reset(device.board)
  })
}

mainAsync(process.argv[2])