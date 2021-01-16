.. highlight:: javascript

MetaWear Board
==============

The `MetaWear <https://www.mbientlab.com/docs/metawear/ios/latest/Classes/MetaWear.html>`_ interface is a software representation of the MetaWear boards and is the central class of the MetaWear API.  It contains methods for connecting, disconnecting, saving and restoring state.

You always get a `MetaWear <https://www.mbientlab.com/docs/metawear/ios/latest/Classes/MetaWear.html>`_ object through the `MetaWearScanner <https://www.mbientlab.com/docs/metawear/ios/latest/Classes/MetaWearScanner.html>`_ , afterwards, keep a reference to it as long as the app is running.  From here on assume that inside code blocks ``device`` is a `MetaWear <https://www.mbientlab.com/docs/metawear/ios/latest/Classes/MetaWear.html>`_ object reference

Bluetooth LE Connection
-----------------------
Before using any API features, you must first connect to the board with `connectAsync <https://mbientlab.com/docs/metawear/ios/latest/Classes/MetaWear.html#/s:8MetaWearAAC15connectAndSetup10BoltsSwift4TaskCyAFyABGGyF>`_.  The returned task will finish when a connection has been established and the ``MetaWear`` state has been initialized.  ::

    device.connectAndSetUp(function (error) {
        console.log('were connected!');
    });

Conversely, call `cancelConnection <https://mbientlab.com/docs/metawear/ios/latest/Classes/MetaWear.html#/c:@M@MetaWear@objc(cs)MetaWear(im)cancelConnection>`_ to close the connection.  If there is a pending ``connectAndSetup`` task when ``cancelConnection`` is called, the connect task will be cancelled.  ::

    device.disconnect(function (error) {
        console.log('were disconnected!');
    });

Watching for Disconnects
^^^^^^^^^^^^^^^^^^^^^^^^
It is often useful to handle BLE disconnection events.  The task returned from ``connectAndSetup`` will completes once this device disconnects, either expectedly or unexpectedly.  ::

    device.on('disconnect', function () {
        console.log('we got disconnected!');
    });

Saving MetaWears
-----------------
If you expect to re-connect to a specific MetaWear device, you can "remember" it for easy retrieval later on through the MetaWearScanner. ::

    var devices = [];
    devices.push(device);

Identifier
----------
Apple generates a unique identifier for each BLE device.  Note, two different Apple devices will generate two different identifiers for the same MetaWear.  It might be useful to use ``device.mac`` instead. ::

    console.log('discovered ' + device.address);

Reset
----------
To fully reset your MetaWear board: ::

    MetaWear.mbl_mw_debug_reset_after_gc(device.board);

