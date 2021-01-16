.. highlight:: javascript

Logging
=======
Logging functions in the `logging.h <https://mbientlab.com/docs/metawear/cpp/latest/logging_8h.html>`_ header file control the on-board logger.  

These functions go hand in hand with the data signal logger outlined in the :doc:`datasignal` section.  

Once a logger is created; logging functions can be used. After you have setup the signal loggers, start 
the logger by calling `mbl_mw_logging_start <https://mbientlab.com/docs/metawear/cpp/latest/logging_8h.html#acab2d6b1c4f5449a39fe3bf60205471f>`_. ::

    MetaWear.mbl_mw_logging_start(device.board, 0);

Once we are done logging, simply call: ::

    MetaWear.mbl_mw_logging_stop(device.board);

Downloading Data
----------------
When you are ready to retrieve the data, execute 
`mbl_mw_logging_download <https://mbientlab.com/docs/metawear/cpp/latest/logging_8h.html#a5d972af91fc37cfcb235785e20974ed3>`_.  

You will need to pass in a `MblMwLogDownloadHandler <https://mbientlab.com/docs/metawear/cpp/latest/structMblMwLogDownloadHandler.html>`_ struct to handle notifications 
from the logger. ::

    // Setup the handlers for events during the download
    var downloadHandler = new MetaWear.LogDownloadHandler();
    downloadHandler.received_progress_update = MetaWear.FnVoid_VoidP_UInt_UInt.toPointer(function onSignal(context, entriesLeft, totalEntries) {
        console.log('received_progress_update entriesLeft:' + entriesLeft + ' totalEntries:' + totalEntries);
        if (entriesLeft === 0) {
            // Remove all log entries if told to stop logging
            MetaWear.mbl_mw_metawearboard_tear_down(device.board);
            callback(null);
        }
    });
    downloadHandler.received_unknown_entry = MetaWear.FnVoid_VoidP_UByte_Long_UByteP_UByte.toPointer(function onSignal(context, id, epoch, data, length) {
        console.log('received_unknown_entry');
    });
    downloadHandler.received_unhandled_entry = MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
        var data = dataPtr.deref();
        var dataPoint = data.parseValue();
        console.log('received_unhandled_entry: ' + dataPoint);
    });

Typical setup
----------------
Here is the skeleton code for a typical scenario logging and downloading the accelerometer data: ::

    function startLogging(device, callback) {
        // Setup accelerometer
        MetaWear.mbl_mw_acc_set_odr(device.board, 50.0);
        MetaWear.mbl_mw_acc_set_range(device.board, 16.0);
        MetaWear.mbl_mw_acc_write_acceleration_config(device.board);

        // See if we already created a logger
        var accSignal = MetaWear.mbl_mw_acc_get_acceleration_data_signal(device.board);
        MetaWear.mbl_mw_datasignal_log(accSignal, ref.NULL, MetaWear.FnVoid_VoidP_DataLoggerP.toPointer(function (context, logger) {
            accelLogger = logger;
            callback(logger.address() ? null : new Error('failed to start logging accel'));
        }));

        // Start logging
        MetaWear.mbl_mw_logging_start(device.board, 0);
        MetaWear.mbl_mw_acc_enable_acceleration_sampling(device.board);
        MetaWear.mbl_mw_acc_start(device.board);
    }

    function downloadLog(device, callback) {
        // Shutdown accel
        MetaWear.mbl_mw_acc_stop(device.board);
        MetaWear.mbl_mw_acc_disable_acceleration_sampling(device.board);
  
        // Shutdown log
        MetaWear.mbl_mw_logging_stop(device.board);

        // Subscribe to accel logger
        MetaWear.mbl_mw_logger_subscribe(accelLogger, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
            var data = dataPtr.deref();
            var pt = data.parseValue();
            console.log(data.epoch + ' ' + pt.x + ',' + pt.y + ',' + pt.z);
        }));

        // Setup the handlers for events during the download
        var downloadHandler = new MetaWear.LogDownloadHandler();
        downloadHandler.received_progress_update = MetaWear.FnVoid_VoidP_UInt_UInt.toPointer(function onSignal(context, entriesLeft, totalEntries) {
            console.log('received_progress_update entriesLeft:' + entriesLeft + ' totalEntries:' + totalEntries);
            if (entriesLeft === 0) {
                // Remove all log entries if told to stop logging
                MetaWear.mbl_mw_metawearboard_tear_down(device.board);
                callback(null);
            }
        });
        downloadHandler.received_unknown_entry = MetaWear.FnVoid_VoidP_UByte_Long_UByteP_UByte.toPointer(function onSignal(context, id, epoch, data, length) {
            console.log('received_unknown_entry');
        });
        downloadHandler.received_unhandled_entry = MetaWear.FnVoid_VoidP_DataP.toPointer(function onSignal(context, dataPtr) {
            var data = dataPtr.deref();
            var dataPoint = data.parseValue();
            console.log('received_unhandled_entry: ' + dataPoint);
        });

        // Actually start the log download, this will cause all the handlers we setup to be invoked
        MetaWear.mbl_mw_logging_download(device.board, 20, downloadHandler.ref());
    }