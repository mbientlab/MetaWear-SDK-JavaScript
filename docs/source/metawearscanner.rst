.. highlight:: javascript

MetaWear Scanner
================
Scanning and discovery of MetaWear devices is done with Noble `Device <https://github.com/mbientlab/noble-device>`_ which is a wrapper around `Noble <https://github.com/abandonware/noble>`_. 

Scanning for MetaWears
----------------------
It's simple to start scanning for advertising MetaWear devices using the ``discoverByAddress`` to discover a MetaWear with a specific MAC:

::

    MetaWear.discoverByAddress('c8:4b:aa:97:50:05', function(device) {
        console.log(device);
    });

Scanning for Nearby MetaWears
-----------------------------
Start scanning for advertising MetaWear devices using the ``discover`` function to discover nearby MetaWears:
::

    MetaWear.discover(function (device) {
        console.log(device);
    });
