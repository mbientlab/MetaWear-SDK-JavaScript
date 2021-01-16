.. highlight:: javascript

Data Processor Types
====================
Header files defining the data processors type are in the 
`processor <https://mbientlab.com/docs/metawear/cpp/latest/dir_ac375e5396e5f8152317e89ec5f046d1.html>`_ folder.  

.. list-table:: Data Processors
   :header-rows: 1

   * - #
     - Name
     - Description
   * - 1
     - Accounter
     - Adds additional information to the payload to facilitate packet reconstruction.
   * - 2
     - Accumulator
     - Tallies a running sum of the input.
   * - 3
     - Averager
     - Computes a running average of the input.
   * - 4
     - Buffer
     - Captures input data which can be retrieved at a later point in time.
   * - 5
     - Comparator
     - Only allows data through that satisfies a comparison operation.
   * - 6
     - Counter
     - Counts the number of times an event was fired.
   * - 7
     - Delta
     - Only allows data through that is a min distance from a reference value.
   * - 8
     - Fuser
     - Combine data from multiple data sources into 1 data packet.
   * - 9
     - Math
     - Performs arithmetic on sensor data.
   * - 10
     - Packer
     - Combines multiple data values into 1 BLE packet.
   * - 11
     - Passthrough
     - Gate that only allows data though based on a user configured internal state.
   * - 12
     - Pulse
     - Detects and quantifies a pulse over the input values.
   * - 13
     - RMS
     - Computes the root mean square of the input.
   * - 14
     - RSS
     - Computes the root sum square of the input.
   * - 15
     - Sample
     - Holds data until a certain amount has been collected.
   * - 16
     - Threshold
     - Allows data through that crosses a boundary.
   * - 17
     - Timer
     - Periodically allow data through.

To create a processor, call any functions that has ``create`` in its name.  ::

    mbl_mw_dataprocessor_accounter_create()
    mbl_mw_dataprocessor_math_create()
    mbl_mw_dataprocessor_threshold_create()

All data processor need a promise to get the pointer back and handle it appropriately.  ::

    // Create an averager using a Promise
    let averager = await new Promise((resolve, reject) => {
        MetaWear.mbl_mw_dataprocessor_average_create(acc_x_signal, 8, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
            console.log('Averager Created');
            resolve(pointer);
        }))
    });
    // Successful promise returns pointer to processor
    console.log(averager); 

Input data signals that are marked with a `MblMwCartesianFloat <https://mbientlab.com/docs/metawear/cpp/latest/structMblMwCartesianFloat.html>`_ id, 
.i.e accelerometer, gyro, and magnetometer data, are limited to only using the :ref:`dataprocessor-math`, :ref:`dataprocessor-rms`, and 
:ref:`dataprocessor-rss` processors.  Once fed through an RMS or RSS processor however, they can utilize the rest of the data processing functions.

Accounter
---------
The accounter processor adds additional information to the BTLE packet to reconstruct the data's timestamp, typically used with streaming raw 
accelerometer, gyro, and magnetometer data.  

This processor is designed specifically for streaming, DO NOT use with the logger.  ::

    // Get the accelerometer signal 
    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
  
    // Add a counter to the accelerometer signal
    let accounter = await new Promise((resolve, reject) => {
        MetaWear.mbl_mw_dataprocessor_accounter_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
            console.log('Accounter Created');
            resolve(pointer);
        }))
    });
  
    // Subscribe to the accounter
    MetaWear.mbl_mw_datasignal_subscribe(accounter, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' acc: ' + value.x + ' ' + value.y + ' ' + value.z)
    }))
  
    // Start the acc to start getting data
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board)
    MetaWear.mbl_mw_acc_start(device.board)

Average
-------
The averager computes a running average over the over the inputs.  It will not produce any output until it has accumulated enough samples to match the specified sample size. 

There is no high level iOS API for the CPP ``mbl_mw_dataprocessor_averager_create`` function; so here is an example. ::
    
    // Get the accelerometer signal 
    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
    let acc_x = MetaWear.mbl_mw_datasignal_get_component(acc, cbindings.Const.ACC_ACCEL_X_AXIS_INDEX);
  
    // Create an averager of the 
    let averager = await new Promise((resolve, reject) => {
        MetaWear.mbl_mw_dataprocessor_average_create(acc_x, 8, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
            console.log('Averager Created');
        resolve(pointer);
        }))
    });
    console.log(averager);

Accumulator
-----------
The accumulator computes a running sum over the inputs.  Users can explicitly specify an output size (1 to 4 bytes) or 
let the API infer an appropriate size.  

The output data type id of an accumulator is the same as its input source. ::

    // Get the accelerometer signal 
    let baro = MetaWear.mbl_mw_baro_bosch_get_pressure_data_signal(device.board);
  
    // Create an averager of the 
    let accumulator = await new Promise((resolve, reject) => {
        MetaWear.mbl_mw_dataprocessor_accumulator_create(baro, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
            console.log('Accumulator Created');
            resolve(pointer);
        }))
    });
  
    // Set the state of the accumulator
    MetaWear.mbl_mw_dataprocessor_set_accumulator_state(accumulator, 0);

    // Set up stream
    MetaWear.mbl_mw_datasignal_subscribe(accumulator, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
        console.log('epoch: ' + data.epoch + ' pressure: ' + value)
    }))
  
    // Start barometer.
    MetaWear.mbl_mw_baro_bosch_start(device.board);
  

Buffer
------
The buffer processor captures input data which can be read at a later time using 
`mbl_mw_datasignal_read <https://mbientlab.com/docs/metawear/cpp/latest/datasignal_8h.html#a0a456ad1b6d7e7abb157bdf2fc98f179>`_; no output is produced 
by this processor.  

The data type id of a buffer's state is the same as its input source. ::

    // Get the accelerometer signal
    let acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    // Create a buffer of the acc data
    let buffer = await new Promise((resolve, reject) => {
        MetaWear.mbl_mw_dataprocessor_buffer_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
            console.log('Buffer Created');
            resolve(pointer);
        }))
    });
        
    // Set up stream
    MetaWear.mbl_mw_datasignal_subscribe(buffer, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
        var data = pointer.deref();
        var value = data.parseValue();
    }))
        
    // Start accelerometer
    MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
    MetaWear.mbl_mw_acc_start(device.board);

Buffer processors can be used to capture data and retrieve it at a later time by reading its state.

Comparison
----------
The comparator removes data that does not satisfy the comparison operation.  Callers can force a signed or unsigned comparison, or let the API determine which is appropriate.  

The output data type id of comparator is the same as its input source. ::

    // Get barometer signal
    var baro = MetaWear.mbl_mw_baro_bosch_get_pressure_data_signal(device.board);

    // Create a comparator to only allow baro >= 102190 to passthrough
    var promise = new Promise((resolve, reject) => {
      var comparator = MetaWear.mbl_mw_dataprocessor_comparator_create(baro, 5, 102190.0, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, comparator) {1
        console.log('comparator created');
        resolve(comparator);
      }));
    });
    let comparator = await promise;

Multi-Value Comparison
^^^^^^^^^^^^^^^^^^^^^^
Starting from firmware v1.2.3, the comparator can accept multiple reference values to compare against and has additional operation modes that can 
modify output values and when outputs are produced.  The multi-value comparison filter is an extension of the comparison filter implemented on 
older firmware.

Operation modes are defined in the 
`MblMwComparatorOperation <https://mbientlab.com/docs/metawear/cpp/latest/comparator_8h.html#a021a5e13dd18fb4b5b2052bf547e5f54>`_ enum, copied below 
with a description on expected outputs:

===========  =====================================================================================================
Operation    Descripion
===========  =====================================================================================================
Absolute     Input value is returned when the comparison is satisfied, behavior of old comparator
Reference    The reference value is output when the comparison is satisfied
Zone         Outputs the index (0 based) of the reference value that satisfied the comparison, n if none are valid
Pass / Fail  0 if the comparison fails, 1 if it passed
===========  =====================================================================================================

Also note that you can only use one reference value when creating feedback/feedforward loops.

Counter
-------
A counter keeps a tally of how many times it is called.  It can be used by 
`MblMwEvent <https://mbientlab.com/docs/metawear/cpp/latest/event__fwd_8h.html#a569b89edd88766619bb41a2471743695>`_ pointers to count the numbers of 
times a MetaWear event was fired and enable simple events to utilize the full set of firmware features.  

Counter data is only interpreted as an unsigned integer. ::

    // Get switch signal 
    var switchs = MetaWear.mbl_mw_switch_get_state_data_signal(device.board);

    // Create a counter that counts by 1 every time the switch is pressed
    let counter = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_counter_create(switchs, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Counter Created');
        resolve(pointer);
      }))
    });
    console.log(counter);

Delta
-----
A delta processor computes the difference between two successive data values and only allows data through that creates a difference greater in magnitude 
than the specified threshold.  

When creating a delta processor, users will also choose how the processor transforms the output which can, in some cases, alter the output data type id.  

=============  =======================================  ==============================================
Output         Transformation                           Data Type ID
=============  =======================================  ==============================================
Absolute       Input passed through untouched           Same as input source i.e. float -> float
Differential   Difference between current and previous  If input is unsigned int, output is signed int
Binary         1 if difference > 0, -1 if less than 0   Output is always signed int
=============  =======================================  ==============================================

Constants identifying the output modes are defined in the `MblMwDeltaMode <https://mbientlab.com/docs/metawear/cpp/latest/delta_8h.html#ac9e3bece74c3bafb355bb158cf93b843>`_ enum. ::

    // Get ADC signal
    var adc_signal = MetaWear.mbl_mw_gpio_get_analog_input_data_signal(device.board, 0, MBL_MW_GPIO_ANALOG_READ_MODE_ADC);

    // Create a delta 
    let delta = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_delta_create(adc_signal, MBL_MW_DELTA_MODE_BINARY, 128, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Counter Created');
        resolve(pointer);
      }))
    });
    console.log(delta);

High Pass Filter
----------------
High pass filters compute the difference of the current value from a running average of the previous N samples.  

Output from this processor is delayed until the first N samples have been received.  ::

    // Get Acc signal
    var acc_signal = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    // Create a HP filter
    let filter = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_highpass_create(acc_signal, 4, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Filter Created');
        resolve(pointer);
      }))
    });
    console.log(filter);

.. _dataprocessor-math:

Math
----
The math processor performs arithmetic or logical operations on the input.  Users can force signed or unsigned operation, or allow the API to determine which is appropriate.  

Depending on the operation, the output data type id can change.

========================    ====================================================
Operation                   Data Type ID
========================    ====================================================
Add, Sub, Mult, Div, Mod    If input is unsigned, output is signed
Sqrt, Abs                   If input is signed, output is unsigned
Const                       Output type id is the same as input type id
Remaining Ops               API cannot infer, up to user to reassemble the bytes
========================    ====================================================

Constants identifying the operations are defined in the 
`MblMwMathOperation <https://mbientlab.com/docs/metawear/cpp/latest/math_8h.html#acb93d624e6a4bdfcda9bac362197b232>`_ enum. ::

    // Get Temp signal
    var temp_signal = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board, 1);

    // Added 273.15C to the input converting units to Kelvin
    let math = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_math_create(temp_signal, MBL_MW_MATH_OP_ADD, 273.15, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Math Created');
        resolve(pointer);
      }))
    });
    console.log(math);

Like the comparator, the math processor also supports feedback/feedforward loops.  Using 
`mbl_mw_dataprocessor_math_modify_rhs_signal <https://mbientlab.com/docs/metawear/cpp/latest/math_8h.html#a7c7af2e8139e824b82c45b846b96abc6>`_, you can 
set the second operand with the output of another data signal. ::

    switch_signal = mbl_mw_switch_get_state_data_signal(board);

    // everytime the switch state changes, the second operand of the math operation will also
    // change to match the switch state (1 or 0)
    mbl_mw_event_record_commands(switch_signal);
    mbl_mw_dataprocessor_math_modify_rhs_signal(math_processor, switch_signal);
    mbl_mw_event_end_record(switch_signal, cmds_recorded);

Packer
------
The packer processor combines multiple data samples into 1 BLE packet to increase the data throughput.  You can pack between 4 to 8 samples per packet 
depending on the data size.

Note that if you use the packer processor with raw motion data instead of using their packed data producer variants, you will only be able to combine 2 
data samples into a packet instead of 3 samples however, you can chain an accounter processor to associate a timestamp with the packed data.  ::

    // Get Acc signal
    var acc_signal = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    // Create a Packer of 2 samples
    let packer = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_packer_create(acc_signal, 2, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Packer Created');
        resolve(pointer);
      }))
    });
    console.log(packer);

Passthrough
-----------
The passthrough processor is akin to a gate in which the user has manual control over, exercised by setting the processor's count value using  
`mbl_mw_dataprocessor_passthrough_set_count <https://mbientlab.com/docs/metawear/cpp/latest/passthrough_8h.html#a537a105294960629fd035adac1a5d65b>`_.  

It has three operation modes that each use the count value differently:

=========== ==========================================
Mode        Description
=========== ==========================================
All         Allow all data through
Conditional Only allow data through if the count > 0
Count       Only allow a set number of samples through
=========== ==========================================

Constants identifying the operation modes are defined in the 
`MblMwPassthroughMode <https://mbientlab.com/docs/metawear/cpp/latest/passthrough_8h.html#a3fdd23d48b54420240c112fa811a56dd>`_ enum. ::

    // Get GPIO signal
    var gpio_signal = MetaWear.mbl_mw_gpio_get_analog_input_data_signal(device.board, 0, MBL_MW_GPIO_ANALOG_READ_MODE_ABS_REF);

    // Create a sample of 16
    let sample = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_sample_create(gpio_signal, 16, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Sample Created');
        resolve(pointer);
      }))
    });
    console.log(sample);

    // Create a passthrough processor in count mode
    // only allows 16 data samples through, then block all other samples
    let pass = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_passthrough_create(sample, MBL_MW_PASSTHROUGH_COUNT, 0, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Passthrough Created');
        resolve(pointer);
      }))
    });
    console.log(pass);
        
Pulse
-----
The pulse processor detects and quantifies a pulse over a set of data.  

Pulses are defined as a minimum number of data points that rise above then fall below a threshold and quantified by transforming the collection of data into three different values:

========= ======================================== =================================
Output    Description                              Data Type ID
========= ======================================== =================================
Width     Number of samples that made up the pulse Unsigned integer
Area      Summation of all the data in the pulse   Same as input i.e. float -> float
Peak      Highest value in the pulse               Same as input i.e. float -> float
On Detect Return 0x1 as soon as pulse is detected  Unsigned integer
========= ======================================== =================================

Constants defining the different output modes are defined in the 
`MblMwPulseOutput <https://mbientlab.com/docs/metawear/cpp/latest/pulse_8h.html#abd7edcb82fd29ec984390673c60b4904>`_ enum. ::

    // Get GPIO signal
    var gpio_signal = MetaWear.mbl_mw_gpio_get_analog_input_data_signal(device.board, 0, MBL_MW_GPIO_ANALOG_READ_MODE_ADC);

    // Create a pulse
    // values must rise above then fall below 512 and have a min of 16 values
    // the highest value in the collected data will be returned
    let pulse = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_pulse_create(gpio_signal, MBL_MW_PULSE_OUTPUT_PEAK, 512.0, 16, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Sample Created');
        resolve(pointer);
      }))
    });
    console.log(pulse);

.. _dataprocessor-rms:

RMS
---
The RMS processor computes the root mean square over multi component data i.e. XYZ values from acceleration data.  

The processor will convert `MblMwCartesianFloat <https://mbientlab.com/docs/metawear/cpp/latest/structMblMwCartesianFloat.html>`_ inputs into float outputs.  ::

    // Get Acc signal
    var acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    // create RMS - root mean square of acc X,Y,Z
    let promise = new Promise((resolve, reject) => {
      var rms = MetaWear.mbl_mw_dataprocessor_rms_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('RMS Created');
        resolve(dataPtr);
      }));
    });
    let rms = await promise;
    console.log(rms);

.. _dataprocessor-rss:

RSS
---
The RSS processor computes the root sum square, or vector magnitude, over multi component data i.e. XYZ values from acceleration data.  

The processor will convert `MblMwCartesianFloat <https://mbientlab.com/docs/metawear/cpp/latest/structMblMwCartesianFloat.html>`_ inputs into float outputs.  ::

    // Get Acc signal
    var acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    // create RSS - root sum square of acc X,Y,Z
    let promise = new Promise((resolve, reject) => {
      var rss = MetaWear.mbl_mw_dataprocessor_rss_create(acc, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('RSS Created');
        resolve(dataPtr);
      }));
    });
    let rss = await promise;
    console.log(rss);

Sample
------
The sample processor acts like a bucket, only allowing data through once it has collected a set number of samples. It functions as a data historian of 
sorts providing a way to look at the data values prior to an event.  

The output data type id of an accumulator is the same as its input source. ::

    // Get GPIO signal
    var gpio_signal = MetaWear.mbl_mw_gpio_get_analog_input_data_signal(device.board, 0, MBL_MW_GPIO_ANALOG_READ_MODE_ABS_REF);

    // Create a sample of 16
    let sample = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_sample_create(gpio_signal, 16, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Sample Created');
        resolve(pointer);
      }))
    });
    console.log(sample);

Threshold
---------
The threshold processor only allows data through that crosses a boundary, either crossing above or below it.  

It has two output modes:

=============  ========================================== ==============================================
Output         Transformation                             Data Type ID
=============  ========================================== ==============================================
Absolute       Input passed through untouched             Same as input source i.e. float -> float
Binary         1 if value rose above, -1 if it fell below Output is always signed int
=============  ========================================== ==============================================

Constants identifying the output modes are defined by the 
`MblMwThresholdMode <https://mbientlab.com/docs/metawear/cpp/latest/threshold_8h.html#a63e1cc001aa56601099db511d3d3109c>`_ enum. ::

    // Get Temp signal
    var temp_signal = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board, MBL_MW_METAWEAR_RPRO_CHANNEL_ON_BOARD_THERMISTOR);

    // only allow data through when it rises above or falls below 25C
    let thresh = await new Promise((resolve, reject) => {
      MetaWear.mbl_mw_dataprocessor_threshold_create(temp_signal, MBL_MW_THRESHOLD_MODE_BINARY, 25, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer((ctx, pointer) => {
        console.log('Threshold Created');
        resolve(pointer);
      }))
    });

Time
----
The time processor only allows data to pass at fixed intervals.  It can used to limit the rate at which data is received if your sensor does not have 
the desired sampling rate.  

The processor has two output modes:

=============  ======================================= ==============================================
Output         Transformation                          Data Type ID
=============  ======================================= ==============================================
Absolute       Input passed through untouched          Same as input source i.e. float -> float
Differential   Difference between current and previous If input is unsigned int, output is signed int
=============  ======================================= ==============================================

Constants identifying the the output modes are defined by the 
`MblMwTimeMode <https://mbientlab.com/docs/metawear/cpp/latest/time_8h.html#ac5166dcd417797f9bc13a5e388d9073c>`_. ::

    // Get Acc signal
    var acc = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);

    // reduce accelerometer data rate to 125ms or 8Hz
    let promise = new Promise((resolve, reject) => {
      var time = MetaWear.mbl_mw_dataprocessor_time_create(acc, MBL_MW_TIME_ABSOLUTE, 125, ref.NULL, MetaWear.FnVoid_VoidP_DataProcessorP.toPointer(function onSignal(context, dataPtr) {
        console.log('Time Created');
        resolve(dataPtr);
      }));
    });
    let time = await promise;
