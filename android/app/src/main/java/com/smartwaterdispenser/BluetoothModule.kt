package com.smartwaterdispenser

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Callback
import android.content.Intent
import android.bluetooth.BluetoothAdapter

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val REQUEST_ENABLE_BT = 1
    }

    override fun getName(): String {
        return "BluetoothModule"
    }

    @ReactMethod
    fun requestBluetooth(callback: Callback) {
        val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        val activity = currentActivity

        if (bluetoothAdapter == null) {
            callback.invoke(false)
            return
        }

        if (!bluetoothAdapter.isEnabled && activity != null) {
            val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
            activity.startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT)
            callback.invoke(true)
        } else {
            callback.invoke(true)
        }
    }
}