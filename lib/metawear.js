/**
 * Created by sschiffli on 4/26/16.
 */
var debug = require('debug')('metawear');
var debugRaw = require('debug')('metaboot');

var NobleDevice = require('noble-device');
var ref = require('ref');
var events = require('events');
var util = require('util');
var os = require('os');
var https = require('https');
var fs = require('fs');
var path = require('path');
var urlExists = require('url-exists');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings');

var METAWEAR_BASE_URI = '326a#id#85cb9195d9dd464cfbbae75a';
var METAWEAR_SERVICE_UUID = METAWEAR_BASE_URI.replace('#id#', '9000');
var METAWEAR_COMMAND_UUID = METAWEAR_BASE_URI.replace('#id#', '9001');
var METAWEAR_NOTIFY_UUID = METAWEAR_BASE_URI.replace('#id#', '9006');

var METABOOT_BASE_URI = '0000#id#1212efde1523785feabcd123';
var METABOOT_DFU_SERVICE_UUID = METABOOT_BASE_URI.replace('#id#', '1530');
var METABOOT_DFU_CONTROL_POINT_UUID = METABOOT_BASE_URI.replace('#id#', '1531');
var METABOOT_DFU_PACKET_UUID = METABOOT_BASE_URI.replace('#id#', '1532');

// then create your thing with the object pattern
var MetaWear = function (peripheral) {
  this.percentage = 0;
  this.errorMessage = null;
  this.isMetaBoot = false;

  // Now create the metawear board object (this is used for accessing the SDK)
  var connection = new MetaWear.BtleConnection();
  connection.write_gatt_char = MetaWear.FnVoid_VoidP_GattCharWriteType_GattCharP_UByteP_UByte.toPointer(writeGattChar.bind(this));
  connection.read_gatt_char = MetaWear.FnVoid_VoidP_GattCharP_FnIntVoidPtrArray.toPointer(readGattChar.bind(this));
  connection.enable_notifications = MetaWear.FnVoid_VoidP_GattCharP_FnIntVoidPtrArray_FnVoidVoidPtrInt.toPointer(enableNotifications.bind(this));
  this.board = MetaWear.mbl_mw_metawearboard_create(connection.ref());
  // No timeout during debug and enabling
  MetaWear.mbl_mw_metawearboard_set_time_for_response(this.board, 0);

  NobleDevice.call(this, peripheral);
};

// tell Noble about the service uuid(s) your peripheral advertises (optional)
MetaWear.SCAN_UUIDS = [METAWEAR_SERVICE_UUID, METABOOT_DFU_SERVICE_UUID];

// inherit noble device
NobleDevice.Util.inherits(MetaWear, NobleDevice);
// MetaWear provides battery and device information services as well
NobleDevice.Util.mixin(MetaWear, NobleDevice.BatteryService);
NobleDevice.Util.mixin(MetaWear, NobleDevice.DeviceInformationService);
// Flatten out and expose all the bindings
Object.assign(MetaWear, cbindings);
Object.assign(MetaWear, MetaWear.Lib);

MetaWear.prototype.writeCommandCharacteristic = function (data, callback) {
  var sanitaizedCallback = (typeof callback === 'function') ? callback : function () { };
  debug('Writing: ' + METAWEAR_COMMAND_UUID + " " + data.toString('hex'));
  this.writeDataCharacteristic(METAWEAR_SERVICE_UUID, METAWEAR_COMMAND_UUID, data, function (error) {
    if (error) {
      debug(error);
    } else {
      debug('Writing Success');
    }
    sanitaizedCallback(error);
  });
};

MetaWear.prototype.connectAndSetUp = function (callback) {
  var initializeCallback = (typeof callback === 'function') ? callback : function () { };

  NobleDevice.prototype.connectAndSetUp.call(this, function (error) {
    if (error) {
      initializeCallback(error);
      return;
    }
    // First check if we are in normal mode or bootloader mode
    this.isMetaBoot = this.hasService(METABOOT_DFU_SERVICE_UUID);
    if (this.isMetaBoot) {
      debug(this.address + ' in bootloader mode');
      // Finished if we are in bootloader mode, nothing to setup.
      initializeCallback(null);
    } else {
      // We can add quite a few pending writes to this guy, so increase the emmiter count
      if (this.hasCharacteristic(METAWEAR_SERVICE_UUID, METAWEAR_COMMAND_UUID)) {
        this._characteristics[METAWEAR_SERVICE_UUID][METAWEAR_COMMAND_UUID].setMaxListeners(50);
      }
      // Setup the CPP SDK 
      MetaWear.mbl_mw_metawearboard_initialize(this.board, MetaWear.FnVoid_MetaWearBoardP_Int.toPointer(function onInitialize(board, code) {
        // Adjust link speed for macOS only since we can't adujust it elsewhere
        if (os.platform() === 'darwin') {
          MetaWear.mbl_mw_settings_set_connection_parameters(this.board, 15.0, 15.0, 0, 4000);
        }
        debug("Finished MetaWear Init");
        initializeCallback(code == 0 ? null : code);
      }.bind(this)));
    }
  }.bind(this));
};

// Helper function to parse data types
MetaWear.Data.prototype.parseValue = function () {
  var value = ref.reinterpret(this.value, this.length, 0);
  switch (this.type_id) {
    case MetaWear.DataTypeId.UINT32:
      return ref.get(value, 0, ref.types.uint32);
    case MetaWear.DataTypeId.FLOAT:
      return ref.get(value, 0, ref.types.float);
    case MetaWear.DataTypeId.CARTESIAN_FLOAT:
      return ref.get(value, 0, MetaWear.CartesianFloat);
    case MetaWear.DataTypeId.INT32:
      return ref.get(value, 0, ref.types.int32);
    case MetaWear.DataTypeId.BYTE_ARRAY:
      return value; // TODO: Test this, not sure if this is the correct solution
    case MetaWear.DataTypeId.BATTERY_STATE:
      return ref.get(value, 0, MetaWear.BatteryState);
    case MetaWear.DataTypeId.TCS34725_ADC:
      return ref.get(value, 0, MetaWear.Tcs34725ColorAdc);
    case MetaWear.DataTypeId.EULER_ANGLE:
      return ref.get(value, 0, MetaWear.Tcs34725ColorAdc);
    case MetaWear.DataTypeId.QUATERNION:
      return ref.get(value, 0, MetaWear.Quaternion);
    case MetaWear.DataTypeId.CORRECTED_CARTESIAN_FLOAT:
      return ref.get(value, 0, MetaWear.CorrectedCartesianFloat);
    default:
      throw 'Unrecognized data type id: ' + this.type_id;
  }
};

// Quick and dirty UUID conversion
function bytesToString(array, start, stop) {
  var result = "";
  var z;
  for (var i = start; i >= stop; i--) {
    var str = array[i].toString(16);
    z = 2 - str.length + 1;
    str = Array(z).join("0") + str;
    result += str;
  }
  return result;
}

function NativeGattChar(array) {
  // always initialize all instance properties
  this.serviceUUID = bytesToString(array, 7, 0) + bytesToString(array, 15, 8);
  this.shortServiceUUID = bytesToString(array, 5, 4);
  this.characteristicUUID = bytesToString(array, 23, 16) + bytesToString(array, 31, 24);
  this.shortCharacteristicUUID = bytesToString(array, 21, 20);
}

function writeGattChar(caller, writeType, characteristicPtr, valuePtr, length) {
  var data = ref.reinterpret(valuePtr, length, 0);
  var characteristic = new NativeGattChar(characteristicPtr);
  if (!this.hasCharacteristic(characteristic.serviceUUID, characteristic.characteristicUUID)) {
    console.error('cant find ' + characteristic.characteristicUUID);
    return;
  }
  var printer = this.isMetaBoot ? debugRaw : debug
  printer('Writing: ' + characteristic.characteristicUUID + " " + data.toString('hex'));

  var withoutResponse = true;
  if (!this.isMetaBoot) {
    // TODO: For now we need to do everything with-reponse, further 
    // testing and enabling is needed before we can turn this off
    withoutResponse = false;
  } else if (characteristic.characteristicUUID === METABOOT_DFU_CONTROL_POINT_UUID) {
    withoutResponse = false;
  }
  this._characteristics[characteristic.serviceUUID][characteristic.characteristicUUID].write(data, withoutResponse, function (error) {
    if (error) {
      printer(error);
    } else {
      printer('Writing Success');
    }
  });
}

function readGattChar(caller, characteristicPtr, callback) {
  var characteristic = new NativeGattChar(characteristicPtr);
  var charToRead = this._characteristics[characteristic.shortServiceUUID][characteristic.shortCharacteristicUUID];
  if (!charToRead) {
    charToRead = this._characteristics[characteristic.serviceUUID][characteristic.characteristicUUID];
  }
  charToRead.read(function (error, data) {
    if (error) {
      console.error(error);
    } else {
      debug("DidRead: " + data);
      callback(caller, data, data.length);
    }
  });
}

function enableNotifications(caller, characteristicPtr, onData, subscribeComplete) {
  var characteristic = new NativeGattChar(characteristicPtr);
  var charToNotify = this._characteristics[characteristic.serviceUUID][characteristic.characteristicUUID];
  if (!charToNotify) {
    charToNotify = this._characteristics[characteristic.shortServiceUUID][characteristic.shortCharacteristicUUID];
  }
  charToNotify.on('data', function (buffer) {
    debug('Did Update: ', buffer);
    if (!buffer) {
      console.error('bad buffer');
    } else {
      onData(caller, buffer, buffer.length);
    }
  });
  // Turn on the notification stream
  charToNotify.subscribe(function (error) {
    if (error) {
      console.error(error);
    }
    subscribeComplete(caller, error == null ? 0 : 1);
  });
}

MetaWear.prototype.updateFirmwareToRev = function (rev, callback) {
  var sanitaizedCallback = (typeof callback === 'function') ? callback : function () { };
  // Helper block to do the update
  var doUpdate = function () {
    debug('updating...');
    findAndPerformDfu.call(this, rev, function (error) {
      debug('metaboot updateFirmware: ' + error);
      sanitaizedCallback(error);
    });
  }.bind(this);
  if (this.isMetaBoot) {
    // Ready to receive an image
    doUpdate();
  } else {
    // Don't update to the same version
    this.readFirmwareRevision(function (error, firmwareRev) {
      if (error) {
        sanitaizedCallback(error);
        return;
      }
      if (firmwareRev === rev) {
        sanitaizedCallback(null);
        return;
      }
      // Must force the device into bootloader mode
      this._peripheral.once('disconnect', function () {
        debug('searching for metaboot...');
        this.connectAndSetUp(function (error) {
          if (error) {
            sanitaizedCallback(error);
            return
          }
          doUpdate();
        }.bind(this));
      }.bind(this));
      // This will cause the device to disconnect and come back as a MetaBoot device
      MetaWear.mbl_mw_debug_jump_to_bootloader(this.board);
    }.bind(this));
  }
};

MetaWear.prototype.updateFirmwareWithUrl = function (url, callback) {
  this.updateFirmwareCallback = (typeof callback === 'function') ? callback : function () { };
  this.percentage = 0;
  var filename = path.join(os.tmpdir(), path.basename(url));
  download(url, filename, function downloadComplete(error) {
    if (error) {
      console.error(error);
      invokeAndClearCallback.call(this, error);
    } else {
      // Firmware update completes on disconnect 
      this.once('disconnect', function (reason) {
        var error = null;
        if (this.percentage != 100) {
          error = new Error('unexpected disconnect, only ' + this.percentage + '/100 complete');
        } else if (reason != 19) {
          error = new Error('unexpected disconnect ' + reason);
        }
        invokeAndClearCallback.call(this, error);
      }.bind(this));

      var delegate = new MetaWear.DfuDelegate();
      delegate.on_dfu_started = MetaWear.FnVoid.toPointer(onDfuStarted.bind(this));
      delegate.on_dfu_cancelled = MetaWear.FnVoid.toPointer(onDfuCancelled.bind(this));
      delegate.on_transfer_percentage = MetaWear.FnVoid_Int.toPointer(onTransferPercentage.bind(this));
      delegate.on_successful_file_transferred = MetaWear.FnVoid.toPointer(onSuccessfulFileTransfer.bind(this));
      delegate.on_error = MetaWear.FnVoid_charP.toPointer(onError.bind(this));
      MetaWear.mbl_mw_metawearboard_perform_dfu(this.board, delegate.ref(), ref.allocCString(filename));
    }
  }.bind(this));
};

function findAndPerformDfu(firmwareRev, callback) {
  this.readModelNumber(function (error, modelNumber) {
    if (error) {
      console.error(error);
      callback(error);
      return;
    }
    debug('modelNumber: ' + modelNumber);
    this.readHardwareRevision(function (error, hardwareRev) {
      if (error) {
        console.error(error);
        callback(error);
        return;
      }
      debug('hardwareRev: ' + hardwareRev);
      // Use the zip firmware if it exists
      var url = firmwareUrl(hardwareRev, modelNumber, firmwareRev, 'firmware.zip');
      urlExists(url, function (err, exists) {
        if (exists) {
          this.updateFirmwareWithUrl(url, callback);
        } else {
          url = firmwareUrl(hardwareRev, modelNumber, firmwareRev, 'firmware.bin');
          urlExists(url, function (err, exists) {
            if (exists) {
              this.updateFirmwareWithUrl(url, callback);
            } else {
              callback(new Error('could not find firmware file:' + url));
            }
          }.bind(this));
        }
      }.bind(this));
    }.bind(this));
  }.bind(this));
}

function firmwareUrl(hardwareRev, modelNumber, firmwareRev, filename) {
  return "https://mbientlab.com/releases/metawear/" + hardwareRev + "/" + modelNumber + "/vanilla/" + firmwareRev + "/" + filename;
}

function download(url, dest, cb) {
  debug('Download: ', url);
  debug('To: ', dest);

  var file = fs.createWriteStream(dest);
  var request = https.get(url, function (response) {
    file.on('finish', function () {
      debug('all writes are now complete.');
      cb(null);
    });
    response.pipe(file);
  });
}

function invokeAndClearCallback(error) {
  var callback = this.updateFirmwareCallback;
  this.updateFirmwareCallback = null;
  if (callback) {
    callback(error);
  }
}

//
// DFU Delegate
//
function onDfuStarted() {
  this.emit('dfuStarted');
  debug('onDfuStarted');
}
function onDfuCancelled() {
  debug('onDfuCancelled');
}
function onTransferPercentage(percentage) {
  debug('transferPercentage ' + percentage);
  this.percentage = percentage;
  this.emit('transferPercentage', percentage);
}
function onSuccessfulFileTransfer() {
  debug('onSuccessfulFileTransfer');
  this.emit('onSuccessfulFileTransfer');
}
function onError(message) {
  debug('dfu error: ' + message);
  invokeAndClearCallback.call(this, new Error(message));
}

// export your device
module.exports = MetaWear;
