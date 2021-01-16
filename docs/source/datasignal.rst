.. highlight:: javascript

Data Signal
===========
Data signals are an abstract representation of data producers.  The API treats them as an event that contains data and represents 
them with the `MblMwDataSignal <https://mbientlab.com/docs/metawear/cpp/latest/datasignal__fwd_8h.html#a1ce49f0af124dfa7984a59074c11e789>`_ struct.
  
They can be safely typecasted to an `MblMwEvent <https://mbientlab.com/docs/metawear/cpp/latest/event__fwd_8h.html#a569b89edd88766619bb41a2471743695>`_ as seen in the example in the previous section.

Data signals can come from the accelerometer:

::

    // Get accelerometer data
    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);


Reading the battery level:

::

    // Get battery level
    let  batt = mbl_mw_settings_get_battery_state_data_signal(device.board);

Getting the switch state (is the button pushed or not):

::

    // Get switch state
    let switch = mbl_mw_switch_get_state_data_signal(device.board);

There are many signals which are highlighted in the sections of our documentation:

::

    // Get analog gpio value
    let analog_gpio = mbl_mw_gpio_get_analog_input_data_signal(device.board, pin, MBL_MW_GPIO_ANALOG_READ_MODE_ADC);


Data Handling
-------------
Signal data is encapsulated by the `MblMwData <https://mbientlab.com/docs/metawear/cpp/latest/structMblMwData.html>`_ struct.  

The struct contains a: 

* Timestamp of when the data was created
* Pointer to the data
* Data type id indicating how to cast the pointer

An enumeration of data types is defined by the 
`MblMwDataTypeId <https://mbientlab.com/docs/metawear/cpp/latest/data_8h.html#a8335412069204db23669001bcaed532e>`_ enum and structs wrapping non basic 
data types are defined in the `types.h <https://mbientlab.com/docs/metawear/cpp/latest/types_8h.html>`_ header file.

Let's take a look at the most common ``MblMwCartesianFloat`` data type. Angular velocity from the Gyroscope is represented by the ``MblMwCartesianFloat`` struct and is in units of degrees per second. The ``x``, ``y``, and ``z`` fields contain the angular velocity of the spin around that axis.

::

    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z);
    }))
    
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
    MetaWear.mbl_mw_acc_start(device.board);

You can take a look at our `javascript binding file <https://github.com/mbientlab/MetaWear-SDK-Cpp/tree/master/bindings/javascript>`_ for all the available data types.

A helper function called `parseValue <https://github.com/mbientlab/MetaWear-SDK-JavaScript/blob/master/lib/metawear.js>`_ has been create as part of the MetaWear class file and will help you parse the data correctly.

::

    MetaWear.Data.prototype.parseValue = function (options) {
        var value = ref.reinterpret(this.value, this.length, 0);
        switch (this.type_id) {
            case MetaWear.DataTypeId.UINT32:
                return ref.get(value, 0, ref.types.uint32);
            case MetaWear.DataTypeId.FLOAT:
                return ref.get(value, 0, ref.types.float);
            case MetaWear.DataTypeId.CARTESIAN_FLOAT:
                return ref.get(value, 0, MetaWear.CartesianFloat);
            // Additional statements for additional types
        }
    }


Streaming
---------
Streaming data is sending live data from the sensors on the MetaWear board, through the Bluetooth link, to the device of your choice in real-time.

Aside from the latency of the Bluetooth link, data is received instantaneously.

Note that there are limits to the Bluetooth link as well as the sensors. Please see the `Bluetooth SIG <https://www.bluetooth.com/specifications/bluetooth-core-specification/>`_ and the MetaWear `datasheet <https://mbientlab.com/documentation>`_  to learn more.

To stream data live to your device, call 
`mbl_mw_datasignal_subscribe <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#ab2708a821b8cca7c0d67cf61acec42c3>`_  with the 
desired data signal and a callback function for handling the received data.  Terminating the live stream is done by calling 
`mbl_mw_datasignal_unsubscribe <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#ab2708a821b8cca7c0d67cf61acec42c3>`_. ::

    console.log('Get signal.')  
    var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress(mac.toLowerCase(), d => resolve(d)))
        
    await new Promise((resolve, reject) => {
        console.log('Connecting...')
        device.connectAndSetUp(error => {
        console.log('Connected.')
        if(error == null) resolve(null)
        else reject(error)
        })
    })

    console.log('Get signal.')
    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board)
        
    console.log('Set up stream.')
    MetaWear.mbl_mw_datasignal_subscribe(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z)
    }))
        
    console.log('Start accelerometer.')
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board)
    MetaWear.mbl_mw_acc_start(device.board)


Logging
-------
Alternatively, data can be logged and retrieved at a later time.  

When the data is logged, it is stored in the board memory. The memory is finite and once it is full, old data may be overwritten by new data. Please consult the `Tutorials <https://mbientlab.com/tutorials/>`_ and the `datasheet <https://mbientlab.com/documentation>`_ of your board for more information.

The data must be retrieved at some point in time from the MetaWear board to the device of your choice using the logger APIs.

See the :doc:`logger` section for more details.

Readable Signals
----------------
Some sensors will only send data when they receive a command to do so. These are typically either slower sensors or analog sensors where data doesn't need to be read at 100Hz (such as the temperature sensor). 

Data signals that represent this type of data source are called readable signals.  
You can check if a data signal is readable by calling 
`mbl_mw_datasignal_is_readable <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#a9633497a3785ba2369f57b939bd156c2>`_.  

The read command is issued by calling 
`mbl_mw_datasignal_read <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#a0a456ad1b6d7e7abb157bdf2fc98f179>`_ or 
`mbl_mw_datasignal_read_with_parameters <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#a71391d5862eb18327ce2aaaac4a12159>`_.  Most 
readable data signals will use the former function which does not require any additional parameters.  The latter function is for reads that require 
additional parameters which are bundled into one struct.

Reading the humidity from the barometer is a good example of a single read:

::

    var temp_signal = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board, 1);
    
    // Subscribe to it
    MetaWear.mbl_mw_datasignal_subscribe(temp_signal, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' temp: ' + value);
    }));

    // Read it
    MetaWear.mbl_mw_datasignal_read(temp_signal);

When using readable signals, you must decide up front if the data will be streamed or logged before interacting with it.  That is, you should either 
have subscribed to or setup a logger for a readable signal before reading it.

Data Processing
---------------
Data signals can be fed through the on-board data processors to filter and/or transform the data in the firmware.  By performing computations on the 
MetaWear side, you can reduce the amount of data that is sent over the radio and the amount of postprocessing that is done on your mobile device.  

For example, a threshold processor can be used to determine if the ambient temperature has exceeded 40 degrees. A highpass filter can be used to determine if the board has moved or the comparison processor can be used to determine if and when the light in the room has been turned on.

Data processors can also be chained together to perform more complex tasks, such as using the rss, average, and threshold processors to determine if the 
board is in freefall based on the XYZ acceleration data. 

See the :doc:`dataprocessor` section for more details on the data processing system. 

Here is an example where the x,y,z components of the accelerometer are combined using the rms processor to calculate the root mean square:

::

    // Get acc signal
    var acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    // create RMS - root mean square of acc X,Y,Z
    let promise = new Promise((resolve, reject) => {
      var rms = MetaWear.mbl_mw_dataprocessor_rms_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        resolve(dataPtr);
      }));
    });

    // RMS pointer
    let rms = await promise;

Component Signals
-----------------
Some signals, such as the acceleration data signal, are composed of multiple values.  While you can interact with them as a whole, sometimes it is more 
convenient to only use individual values.  

To access the component values, call 
`mbl_mw_datasignal_get_component <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#abf5eaa69c5f5978cb7bdd9ea04a910e0>`_ with the signal 
and an index represnting which component to retrieve.  If a signal is single valued, the function will return null. 

In this example, only the x-axis is from the accelerometer is retrieved:

::

    // Get acc signal
    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
 
    // Get x components
    let acc_x = MetaWear.mbl_mw_datasignal_get_component(acc, 0); //cbindings.Const.ACC_ACCEL_X_AXIS_INDEX);  

    // Subscribe to it
    MetaWear.mbl_mw_datasignal_subscribe(acc_x, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' acc x: ' + value);
    }))
