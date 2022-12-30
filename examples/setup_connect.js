// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref-napi');

MetaWear.discoverByAddress('f7:c0:14:1b:e5:86', function(device) {
//MetaWear.discover(function (device) {
  console.log('got em');
  // you can be notified of disconnects
  device.on('disconnect', function () {
    console.log('we got disconnected! :( ');
  });
  // Call connect and set up - this calls mbl_mw_metawearboard_initialize()
  device.connectAndSetUp(function (error) {
    console.log('were connected!');
    // Adjust link speed - set the min conn interval to 7.5ms and the max conn interval to 7.5ms
    // Adjust link speed - set the latency to 0ms and the timeout to 4000ms
    // Connection interval = how often devices talk - min is 7.5ms, it increases in steps of 1.25ms
    // Slave latency = metawear can choose not to answer when central asks for an update (i.e metawear can sleep longer - doesn't affect transfer speeds)
    // Connection supervision timeout = determines timeout from last data exchange (tells central how long to wait to attempt to reconnect to a lost conn - if your metawear goes in and out of range often, it is better to have a short timeout)
    // This is not guaranteed to work, central can reject peripheral and vice-versa. Apple only accepts 15ms for example.
    MetaWear.mbl_mw_settings_set_connection_parameters(device.board, 7.5, 7.5, 0, 4000);
    console.log('link speed updated');
    // Get the RSSI now:
    var rssi = device._peripheral.rssi;
    for (let i = 1; i < 5000; i++) {
      //console.log(device._peripheral.rssi);
      rssi += device._peripheral.rssi;
    } 
    console.log('Average rssi :' + rssi/5000);
    // Set the highest signals strength
    MetaWear.mbl_mw_settings_set_tx_power(device.board, 4);
    // Everything we know about the device:
    //console.log(device);
    // Find out more about the sensor:
    model = MetaWear.mbl_mw_metawearboard_get_model(device.board);
    console.log('Model: ' + model);
    device.modelDescription = MetaWear.mbl_mw_metawearboard_get_model_name(device.board);
    console.log('Model Name: ' + device.modelDescription);
    var present = MetaWear.mbl_mw_metawearboard_lookup_module(device.board, 'GYRO');
    console.log('Gyroscope: ' + (present == -1 ? 'Not Present' : 'Present'));
    present = MetaWear.mbl_mw_metawearboard_lookup_module(device.board, 'ACCELEROMETER');
    console.log('Accelerometer: ' + (present == -1 ? 'Not Present' : 'Present'));
    present = MetaWear.mbl_mw_metawearboard_lookup_module(device.board, 'MAGNETOMETER');
    console.log('Magnetometer: ' + (present == -1 ? 'Not Present' : 'Present'));
    present = MetaWear.mbl_mw_metawearboard_lookup_module(device.board, 'SENSOR_FUSION');
    console.log('Sensor Fusion: ' + (present == -1 ? 'Not Present' : 'Present'));
    setTimeout(function () {
      device.disconnect(function (error) {
        console.log('disconnect call finished');
        process.exit(0);
      });
    }, 1000);
  });
});
