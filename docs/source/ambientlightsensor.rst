.. highlight:: javascript

Ambient Light Sensor
====================
Light sensors measure illuminance, which can be used to measure more than the brightness of a light source.

MetaWear RPro and Cpro, and MetaDetector board come with a `Lite-On LTR-329ALS <http://www.mouser.com/ds/2/239/Lite-On_LTR-329ALS-01%20DS_ver1.1-348647.pdf>`_ ambient light sensor that can measure light from 0.01 lux to 64k lux.

Functions interacting with 
the light sensor are defined in the `ambientlight_ltr329.h <https://mbientlab.com/docs/metawear/cpp/latest/ambientlight__ltr329_8h.html>`_ header file.

Configuration
-------------
The LTR329 sensor has 3 configurable parameters:

================  =========================================
Parameter         Description
================  =========================================
Gain              Controls data range and resolution
Integration Time  Measurement time for each cycle
Measurement Rate  How frequently to update illuminance data
================  =========================================

Possible values for each of these parameters are defined in their respective enums.  After configuring the API with the desired settings, call 
`mbl_mw_als_ltr329_write_config <https://mbientlab.com/docs/metawear/cpp/latest/ambientlight__ltr329_8h.html#ad37c6a477bde0813186694bff2bcd972>`_. to 
write the settings to the sensor. ::

    // Set sensor gain to 96x
    MetaWear.mbl_mw_als_ltr329_set_gain(device.board, MBL_MW_ALS_LTR329_GAIN_96X);
    
    // Set the integration time to 400ms
    MetaWear.mbl_mw_als_ltr329_set_integration_time(device.board, MBL_MW_ALS_LTR329_TIME_400MS);
    
    // Set the measurement rate to 1000ms
    MetaWear.mbl_mw_als_ltr329_set_measurement_rate(device.board, MBL_MW_ALS_LTR329_RATE_1000MS);
    
    // Write the configuration to the sensor
    MetaWear.mbl_mw_als_ltr329_write_config(device.board);

Illuminance Measurement
-----------------------
To start measuring illuminance, call  
`mbl_mw_als_ltr329_start <https://mbientlab.com/docs/metawear/cpp/latest/ambientlight__ltr329_8h.html#a6e490d629752ddd32bb2a2b39c3ca1fc>`_.  
Illuminance data is represented as an unsigned integer and is in units of milli lux. ::

    let signal = MetaWear.mbl_mw_als_ltr329_get_illuminance_data_signal(device.board);

    MetaWear.mbl_mw_datasignal_subscribe(signal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' illuminance: ' + value/1000.0);
    }))

    MetaWear.mbl_mw_als_ltr329_start(device.board);