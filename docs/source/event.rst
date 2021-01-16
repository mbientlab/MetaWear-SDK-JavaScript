.. highlight:: javascript

Events
======
An event is an asynchronous notification from the MetaWear board represented in the C++ API by the 
`MblMwEvent <https://mbientlab.com/docs/metawear/cpp/latest/event__fwd_8h.html#a569b89edd88766619bb41a2471743695>`_ struct.  

Recording Commands
------------------
The board can be programmed to execute MetaWear commands in response to an event firing.  

An event can be many things such as a data filter (average the accelerometer signal), a disconnect (the board has disconnected from the Bluetooth link), or even a timer (10 seconds have passed).

To start recording commands, call 
`mbl_mw_event_record_commands <https://mbientlab.com/docs/metawear/cpp/latest/event_8h.html#a771158b2eedeea765163a7df5f6c51e7>`_.  While in a recording 
state, all MetaWear functions called will instead be recorded on the board and executed when the event is fired.  

To stop recording, call `mbl_mw_event_end_record <https://mbientlab.com/docs/metawear/cpp/latest/event_8h.html#a5d4f44a844d2ff90b9e97ed33613fca8>`_. This function is asynchronous and will alert the caller when it is completed via a callback function.

In this example, we use a timed event to read the temperature sensor:

::

    MetaWear.mbl_mw_event_record_commands(tempTimer);

    MetaWear.mbl_mw_datasignal_read(tempSignal);

    promise = new Promise((resolve, reject) => {
        var rec = MetaWear.mbl_mw_event_end_record(tempTimer, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, status) {
            resolve(status);
        }));
    });
    let rec = await promise;
    
Here is the full example:

::

    // Get temp signal 
    var temp = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board,1);

    // Subscribe to it
    MetaWear.mbl_mw_datasignal_subscribe(temp, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      console.log('got data');
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' temp: ' + value);
    }));

    // Create a timer 
    var promise = new Promise((resolve, reject) => {
      var timer = MetaWear.mbl_mw_timer_create_indefinite(device.board, 1000, 0, ref.NULL, MetaWear.FnVoid_VoidP_TimerP.toPointer(function onSignall(context, timer) {
        resolve(timer);
      }));
    });
    let timer = await promise;
  
    // Create event based on timer and record as a command
    MetaWear.mbl_mw_event_record_commands(timer);
    MetaWear.mbl_mw_datasignal_read(temp);
    promise = new Promise((resolve, reject) => {
      var rec = MetaWear.mbl_mw_event_end_record(timer, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
        console.log('Command created');
        resolve(lstatus);
      }));
    });
    let rec = await promise;
  
    // Start timer
    MetaWear.mbl_mw_timer_start(timer);