.. highlight:: javascript

Bridge to CPP SDK
===================
As mentioned previously, the MetaWear Javascript APIs are a wrapper around the CPP APIs.  

MetaWear
---------------
Each script must include the node javascript library ``Metawear``.
::

    var MetaWear = require('metawear');

The core libraries are written in C++ and many of the calls made are from the CPP library. You will find the `C++ documentation <https://mbientlab.com/cppdocs/latest/>`_ and `API reference <https://mbientlab.com/docs/metawear/cpp/latest/globals.html>`_ useful.

The main MetaWear class in Node.JS can be found `here <https://github.com/mbientlab/MetaWear-SDK-JavaScript/blob/master/lib/metawear.js>`_.

Node-FFI
---------------
Node-ffi is a Node.js addon for loading and calling dynamic libraries using pure JavaScript. It can be used to create bindings to native libraries without writing any C++ code. The library has been partially abandoned so MbientLab is hosting a custom copy `here <https://github.com/mbientlab/node-ffi>`_.

Node ffi is use along with the bindings file so that Node API calls can call the CPP SDK.

Bindings
---------------
The `bindings file <https://github.com/mbientlab/MetaWear-SDK-Cpp/blob/master/bindings/javascript/cbindings.js>`_ is the glue between the Javascript APIs and the CPP library.

In the bindings file: ::

    /**
    * Stop sensor fusion
    * @param board         Calling object
    */
    'mbl_mw_sensor_fusion_stop': [ref.types.void, [ref.refType(MetaWearBoard)]],

In the CPP library: ::

    /**
    * Stop sensor fusion
    * @param board         Calling object
    */
    METAWEAR_API void mbl_mw_sensor_fusion_stop(const MblMwMetaWearBoard* board);

Can be called in Node.JS: ::

    var MetaWear = require('metawear');
    MetaWear.mbl_mw_sensor_fusion_stop(device.board);