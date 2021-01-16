.. highlight:: javascript

Humidity
========
A humidity sensor senses relative humidity. This means that it measures both air temperature and moisture. Relative humidity, expressed as a percent, is the ratio of actual moisture in the air to the highest amount of moisture air at that temperature can hold.

MetaEnvironment and MTR boards have a Bosch `BME280 <http://www.bosch-sensortec.com/en/bst/products/all_products/bme280>`_ integrated environmental unit.  

Humidity functionality of that sensor are controlled by the functions in the 
`humidity.h <https://mbientlab.com/docs/metawear/cpp/latest/humidity__bme280_8h.html>`_ header file.

Oversampling
------------
The humidity sensing portion of the BME280 chip only has 1 configurable parameter which is the oversampling mode.  This is set by calling 
`mbl_mw_humidity_bme280_set_oversampling <https://mbientlab.com/docs/metawear/cpp/latest/humidity__bme280_8h.html#aebf6ee996c9acd2681f7c1895a571993>`_.  
Unlike other configuration functions, this function will immediately write the change to the sensor. ::

    MetaWear.mbl_mw_humidity_bme280_set_oversampling(board, MBL_MW_HUMIDITY_BME280_OVERSAMPLING_16X);

Humidity Measurement
--------------------
Measuring humidity is manually triggered by calling 
`mbl_mw_datasignal_read <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#a0a456ad1b6d7e7abb157bdf2fc98f179>`_ with a humidity data 
signal.  Humidity data is percetange from 0 to 100 represented as a float.  ::

    // Setup barometer
    MetaWear.mbl_mw_humidity_bme280_set_oversampling(device.board, MBL_MW_HUMIDITY_BME280_OVERSAMPLING_1X);

    // Get humidity signal 
    var hum = MetaWear.mbl_mw_humidity_bme280_get_percentage_data_signal(device.board);

    // Subscribe to it
    console.log('Subscribe');
    MetaWear.mbl_mw_datasignal_subscribe(hum, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' humidity: ' + value);
    }));

    // Read
    MetaWear.mbl_mw_datasignal_read(hum);