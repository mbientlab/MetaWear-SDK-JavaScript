.. highlight:: javascript

Macro
=====
The on-board flash memory can also be used to store MetaWear commands instead of sensor data. 

A good example of this feature is to change the name of a device permanently so that is does not advertise as MetaWear. 

Recorded commands can be executed any time after being 
programmed with the functions in `macro.h <https://mbientlab.com/docs/metawear/cpp/0/macro_8h.html>`_ header file.  

Recording Commands
------------------
To record commands:

1. Call `mbl_mw_macro_record <https://mbientlab.com/docs/metawear/cpp/0/macro_8h.html#aa99e58c7cbc1bbecb10985bd08643bba>`_ to put the API in macro mode  
2. Use the MetaWear commands that you want programmed  
3. Exit macro mode with `mbl_mw_macro_end_record <https://mbientlab.com/docs/metawear/cpp/0/macro_8h.html#aa79694ef4d711d84da302983162517eb>`_ ::

    MetaWear.mbl_mw_macro_record(device.board, 1)
    // COMMANDS
    MetaWear.mbl_mw_macro_end_record(device.board, ref.NULL, callback);

Macros can be set to run on boot by setting the ``exec_on_boot`` parameter with a non-zero value.

::

    MetaWear.mbl_mw_macro_record(board, 1); // ON BOOT
    MetaWear.mbl_mw_macro_record(board, 0); // NOT ON BOOT

In this example, the LED will blink blue on boot:

::

    // Start recording macro
    MetaWear.mbl_mw_macro_record(device.board, 1)

    // COMMAND - Create LED pattern
    var pattern = new MetaWear.LedPattern();
    MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
    MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
    MetaWear.mbl_mw_led_play(device.board);

    // End recording macro
    var promise = new Promise((resolve, reject) => {
      var macro = MetaWear.mbl_mw_macro_end_record(device.board, ref.NULL, MetaWear.FnVoid_VoidP_Int.toPointer(function onSignal(context, rec) {
        console.log('Macro created');
        resolve(rec);
      }));
    });
    var rec = await promise;

Erasing Macros
--------------
Erasing macros is done with the `mbl_mw_macro_erase_all <https://mbientlab.com/docs/metawear/cpp/0/macro_8h.html#aa1c03d8f08b5058d8f81b532a6930d67>`_ 
method.  The erase operation will not occur until you disconnect from the board.

::

    MetaWear.mbl_mw_macro_erase_all(device.board);

