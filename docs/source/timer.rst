.. highlight:: javascript

Timer
=====
A MetaWear timer can be thought of as an event that is fired at fixed intervals.  

These timers are represented by the 
`MblMwTimer <https://mbientlab.com/docs/metawear/cpp/latest/timer__fwd_8h.html#ac32a834c8b7bc7230ce6947425f43926>`_ struct and can be safely typcased to a 
`MblMwEvent <https://mbientlab.com/docs/metawear/cpp/latest/event__fwd_8h.html#a569b89edd88766619bb41a2471743695>`_ struct.  

Timers can be used to schedule periodic tasks or setup a delayed task execution. For example, you can use the timer to record temperature samples are extremely low frequencies such as once per day or once per hour.

ID
--
MblMwTimer objects are identified by a numerical id; you can retrieve the id by calling 
`mbl_mw_timer_get_id <https://mbientlab.com/docs/metawear/cpp/latest/timer_8h.html#a695e95e035825b626b78416b5df5611e>`_.  

The id is used to retrieve existing timers from the API with the 
`mbl_mw_timer_lookup_id <https://mbientlab.com/docs/metawear/cpp/latest/timer_8h.html#a84d84562f66090e61061b67321c22961>`_ function.

As with previous sections, you may want to keep the id handy so that you can retrieve a timer at a later time.

Task Scheduling
---------------
Before you can schedule tasks, you first need to create a timer, by calling either 
`mbl_mw_timer_create <https://mbientlab.com/docs/metawear/cpp/latest/timer_8h.html#a749457dc6c8a181990367d8b1f92284c>`_ or 
`mbl_mw_timer_create_indefinite <https://mbientlab.com/docs/metawear/cpp/latest/timer_8h.html#ae6a58f97ba8e443aec84769a9cc84453>`_.  These functions are asynchronous and 
will pass a pointer to the caller when the timer is created.  

When you have a valid `MblMwTimer <https://mbientlab.com/docs/metawear/cpp/latest/timer__fwd_8h.html#ac32a834c8b7bc7230ce6947425f43926>`_, you can use the command recording system outlined in 
:doc:`event` section to program the board to respond to the periodic events.  

Upon recording timer task commands, call 
`mbl_mw_timer_start <https://mbientlab.com/docs/metawear/cpp/latest/timer_8h.html#a90455d9e29548c1332ef7ad9db46c50e>`_ to start the timer.

When you are done using a timer, you can remove it with 
`mbl_mw_timer_remove <https://mbientlab.com/docs/metawear/cpp/latest/timer_8h.html#a96d102b4f39a46ccbaf8ee5a37a2a55e>`_. 

A good example is the one mentioned above. Because the temperature sensor is a slow sensor, it must be read using a timer to get periodic readings (unlike setting the ODR for the accelerometer):

::

    // Get temp signal 
    var temp = MetaWear.mbl_mw_multi_chnl_temp_get_temperature_data_signal(device.board,1);

    // Subscribe to it
    MetaWear.mbl_mw_datasignal_subscribe(temp, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
      console.log('got data');
      var data = pointer.deref();
      var value = data.parseValue();
      console.log('epoch: ' + data.epoch + ' switch: ' + value);
    }));

    // Create a timer to read every 1 second
    var promise = new Promise((resolve, reject) => {
      var timer = MetaWear.mbl_mw_timer_create_indefinite(device.board, 1000, 0, ref.NULL, MetaWear.FnVoid_VoidP_TimerP.toPointer(function onSignall(context, timer) {
        console.log('Timer created');
        resolve(timer);
      }));
    });
    let timer = await promise;
  
    // Create event based on timer and record as a command - Start record command
    MetaWear.mbl_mw_event_record_commands(timer);
    // Command to read temp when timer fires
    MetaWear.mbl_mw_datasignal_read(temp);
    // End record command
    promise = new Promise((resolve, reject) => {
      var rec = MetaWear.mbl_mw_event_end_record(timer, ref.NULL, MetaWear.FnVoid_VoidP_EventP_Int.toPointer(function onSignal(context, dataPtr, lstatus) {
        console.log('Command created');
        resolve(lstatus);
      }));
    });
    let rec = await promise;
  
    // Start timer
    MetaWear.mbl_mw_timer_start(timer);