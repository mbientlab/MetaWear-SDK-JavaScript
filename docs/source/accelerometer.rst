.. highlight:: javascript

Accelerometer
=============
All boards come with an accelerometer. An accelerometer is an electromechanical device that will measure acceleration forces. 
These forces may be static, like the constant force of gravity pulling at your feet, or they could be dynamic - caused by moving or vibrating the accelerometer.

Acceleration is measured in units of gravities (g) or units of m/s2. One g unit = 9.81 m/s2.

The specific accelerometer model varies amongst the boards, howevever the API provides accelerometer 
agnostic functions in the `accelerometer.h <https://mbientlab.com/docs/metawear/cpp/latest/accelerometer_8h.html>`_ header file that can be safely used 
with all supported accelerometers.

Users can check which accelerometer is on their board at runtime to determine the appropriate accelerometer specific functions they need to use, if 
necessary. ::

    let accType = MetaWear.mbl_mw_metawearboard_lookup_module(device.board, MBL_MW_MODULE_ACCELEROMETER);
    switch(accType) {
        case MBL_MW_MODULE_ACC_TYPE_BMI160:
            // code block
            break;
        case MBL_MW_MODULE_ACC_TYPE_MMA8452Q:
            // code block
            break;
        case MBL_MW_MODULE_ACC_TYPE_BMA255:
            // code block
            break;
        case MBL_MW_MODULE_TYPE_NA:
            // code block
            break;
        default:
            // code block - unknown accelerometer
    }

Acceleration Sampling
---------------------
Acceleration sampling measures the current acceleration forces at periodic intervals.  To enable acceleration sampling, call 
`mbl_mw_acc_enable_acceleration_sampling <https://mbientlab.com/docs/metawear/cpp/latest/accelerometer_8h.html#a58272eea512ca22d0de2ae0db0e9f867>`_ 
before starting the accelerometer.

Linear acceleration is represented with the 
`MblMwCartesianFloat <https://mbientlab.com/docs/metawear/cpp/latest/structMblMwCartesianFloat.html>`_ struct and the values are in units of Gs.  The 
``x``, ``y``, and ``z`` fields contain the acceleration in that direction. ::

    console.log('Get acc signal.')
    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  
    console.log('Set up stream.')
    MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z)
    }))
  
    console.log('Start accelerometer.')
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
    MetaWear.mbl_mw_acc_start(device.board);

Configuration
^^^^^^^^^^^^^
Users can configure the output data rate and the sampling range; these parameters control the sampling rate and the data range and resolution 
respectively.  After configuring the settings, call 
`mbl_mw_acc_write_acceleration_config <https://mbientlab.com/docs/metawear/cpp/latest/accelerometer_8h.html#a7f3339b25871344518175f97ae7c95b7>`_ to 
write the configuration to the sensor. ::

    // Set ODR to 25Hz or closest valid frequency
    MetaWear.mbl_mw_acc_set_odr(device.board, 25.0);
    
    // Set range to +/-4g or closest valid range
    MetaWear.mbl_mw_acc_set_range(device.board, 4.0);
        
    // Write the config to the sensor
    MetaWear.mbl_mw_acc_write_acceleration_config(device.board);

High Frequency Stream
^^^^^^^^^^^^^^^^^^^^^
Firmware v1.2.3+ contains a packed mode for the accelerometer which combines 3 acceleration data samples into 1 ble packet allowing the board to 
stream data at a throughput higher than 100Hz.  This special data signal is retrieved from the 
`mbl_mw_acc_get_high_freq_acceleration_data_signal <https://mbientlab.com/docs/metawear/cpp/latest/accelerometer_8h.html#a9203ed5a20d63f6c37ae173aabaaa287>`_ function 
and is only for streaming; do not use it with data processing or logging.  ::

    console.log('Get acc signal.');
    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  
    console.log('ODR at 200Hz.');
    MetaWear.mbl_mw_acc_set_odr(device.board, 200.0);

    console.log('Set up stream.');
    MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z);
    }))
  
    console.log('Start accelerometer.')
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
    MetaWear.mbl_mw_acc_start(device.board);

Step Counter
------------
The BMI160 accelerometer comes with a built in step counter.  It has three operation modes that configure the sensitivity and robustness of the counter:

=========  ==============================================================================================
Mode       Description
=========  ==============================================================================================
Normal     Balanced between false positives and false negatives, recommended for most applications
Sensitive  Few false negatives but eventually more false positives, recommended for light weighted people
Robust     Few false positives but eventually more false negatives
=========  ==============================================================================================

When you have set the operation mode, call 
`mbl_mw_acc_bmi160_write_step_counter_config <https://mbientlab.com/docs/metawear/cpp/latest/accelerometer__bosch_8h.html#ab4fa1b742920e8aefca8bf5e59237f8e>`_ to save the configuration to the board. ::

    MetaWear.mbl_mw_acc_bmi160_set_step_counter_mode(device.board, MBL_MW_ACC_BMI160_STEP_COUNTER_MODE_SENSITIVE);
    MetaWear.mbl_mw_acc_bmi160_write_step_counter_config(device.board);

Reading The Counter
^^^^^^^^^^^^^^^^^^^
One way to retrieve step counts is to periodcally read the step counter.  To read the step counter, call 
`mbl_mw_datasignal_read <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#a0a456ad1b6d7e7abb157bdf2fc98f179>`_ with the step counter data signal.

The counter is not enabled by default so you will need enable it by calling 
`mbl_mw_acc_bmi160_enable_step_counter <https://mbientlab.com/docs/metawear/cpp/latest/accelerometer__bosch_8h.html#ad4ef124ad3ef8ef51667e738331333b8>`_ when configuring the board. ::

    console.log('Enable acc steps.');
    MetaWear.mbl_mw_acc_bmi160_enable_step_counter(device.board);
    MetaWear.mbl_mw_acc_bmi160_write_step_counter_config(device.board);

    console.log('Get step signal.');
    let signal = MetaWear.mbl_mw_acc_bmi160_get_step_counter_data_signal(device.board);

    console.log('Set up read.');
    MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z);
    }))

    console.log('Read.');
    MetaWear.mbl_mw_acc_start(device.board);
    MetaWear.mbl_mw_datasignal_read(signal);

Using The Detector
^^^^^^^^^^^^^^^^^^
Alternatively, you can receive notifications for each step detected by calling 
`mbl_mw_acc_bmi160_enable_step_detector <https://mbientlab.com/docs/metawear/cpp/latest/accelerometer__bosch_8h.html#a3f1b82cb1d70334eeb7b604431e15f20>`_ instead. ::

    var accelerometerBMI160StepCount = 0

    let signal = MetaWear.mbl_mw_acc_bmi160_get_step_detector_data_signal(device.board)! 
    
    MetaWear.mbl_mw_datasignal_subscribe(signal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        accelerometerBMI160StepCount += 1
    }))

    MetaWear.mbl_mw_acc_bmi160_enable_step_detector(device.board);
    MetaWear.mbl_mw_acc_start(device.board);

Orientation Detection
---------------------
The orientation detector alerts you when the sensor's orientation changes between portrait/landscape and front/back.  Data is represented as an 
`MblMwSensorOrientation <https://mbientlab.com/docs/metawear/cpp/0/types_8h.html#a2e83167b55d36e1d48d100f342ad529c>`_ enum.

This feature is currently only supported on devices using the BMI160 or BMA255 accelerometers.  

::

    let signal = MetaWear.mbl_mw_acc_bosch_get_orientation_detection_data_signal(device.board);

    MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var orientation = data.parseValue();
        switch orientation {    
            case MBL_MW_SENSOR_ORIENTATION_FACE_UP_PORTRAIT_UPRIGHT:
                console.log("Portrait Face Up")
            case MBL_MW_SENSOR_ORIENTATION_FACE_UP_PORTRAIT_UPSIDE_DOWN:
                console.log("Portrait Upside Down Face Up")
            case MBL_MW_SENSOR_ORIENTATION_FACE_UP_LANDSCAPE_LEFT:
                console.log("Landscape Left Face Up")
            case MBL_MW_SENSOR_ORIENTATION_FACE_UP_LANDSCAPE_RIGHT:
                console.log("Landscape Right Face Up")
            case MBL_MW_SENSOR_ORIENTATION_FACE_DOWN_PORTRAIT_UPRIGHT:
                console.log("Portrait Face Down")
            case MBL_MW_SENSOR_ORIENTATION_FACE_DOWN_PORTRAIT_UPSIDE_DOWN:
                console.log("Portrait Upside Down Face Down")
            case MBL_MW_SENSOR_ORIENTATION_FACE_DOWN_LANDSCAPE_LEFT:
                console.log("Landscape Left Face Down")
            case MBL_MW_SENSOR_ORIENTATION_FACE_DOWN_LANDSCAPE_RIGHT:
                console.log("Landscape Right Face Down")
            default:
                console.log("N/A")
            }
    }))

    MetaWear.mbl_mw_acc_bosch_enable_orientation_detection(device.board);
    MetaWear.mbl_mw_acc_start(device.board);
        

