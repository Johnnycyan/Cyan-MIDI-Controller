import { useState, useEffect, useCallback } from 'react';
import { midiHandler, MIDIDevice, MIDIConnectionState } from '../midi/midiHandler';

export default function useMIDI() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [selectedOutput, setSelectedOutput] = useState<MIDIDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize MIDI system
  useEffect(() => {
    const initMIDI = async () => {
      try {
        const success = await midiHandler.initialize();
        if (success) {
          setIsInitialized(true);
          const deviceList = midiHandler.listDevices();
          setDevices([...deviceList.inputs, ...deviceList.outputs]);
          setError(null);
        } else {
          setError('Failed to initialize MIDI system');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown MIDI error');
      }
    };

    initMIDI();
  }, []);

  // Handle MIDI state changes
  useEffect(() => {
    const handleStateChange = (state: MIDIConnectionState) => {
      // Refresh device list
      const deviceList = midiHandler.listDevices();
      setDevices([...deviceList.inputs, ...deviceList.outputs]);
      
      // Update connection status if it affects current output
      if (selectedOutput && state.port.id === selectedOutput.id) {
        setIsConnected(state.port.state === 'connected');
      }
    };

    midiHandler.setStateChangeCallback(handleStateChange);
  }, [selectedOutput]);

  // Select output device
  const selectOutputDevice = useCallback((deviceId: string) => {
    // Debug logging
    console.log('Attempting to select device:', deviceId);
    
    // Remove any type suffix if present
    const baseDeviceId = deviceId.split('-')[0];
    
    // Find the output device with matching ID
    const device = devices.find(d => d.id === baseDeviceId && d.type === 'output');

    if (!device) {
      console.error(`Could not find output device with ID: ${baseDeviceId}`);
      setError(`Invalid output device ID: ${baseDeviceId}`);
      return false;
    }

    const success = midiHandler.selectOutput(device.id);
    if (success) {
      setSelectedOutput(device);
      setIsConnected(true);
      setError(null);
      console.log('Successfully selected output device:', device.name);
      return true;
    } else {
      setError(`Failed to select output device ${device.name}`);
      return false;
    }
  }, [devices]);

  // Select input device
  const selectInputDevice = useCallback((deviceId: string) => {
    // Debug logging
    console.log('Attempting to select input device:', deviceId);
    
    // Find the input device with matching ID
    const device = devices.find(d => d.id === deviceId && d.type === 'input');

    if (!device) {
      console.error(`Could not find input device with ID: ${deviceId}`);
      return false;
    }

    const success = midiHandler.selectInput(device.id);
    if (!success) {
      console.error(`Failed to select input device ${device.name}`);
      return false;
    }

    console.log('Successfully selected input device:', device.name);
    return true;
  }, [devices]);

  // Send CC message
  const sendCC = useCallback((channel: number, cc: number, value: number): boolean => {
    return midiHandler.sendCC(channel, cc, value);
  }, []);

  // Subscribe to CC changes
  const subscribeToCC = useCallback((channel: number, cc: number, callback: (value: number) => void) => {
    return midiHandler.subscribeToCC(channel, cc, callback);
  }, []);

  // Request MIDI access (for refreshing connections)
  const requestMIDIAccess = useCallback(async () => {
    try {
      const success = await midiHandler.initialize();
      if (success) {
        const deviceList = midiHandler.listDevices();
        setDevices([...deviceList.inputs, ...deviceList.outputs]);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown MIDI error');
      return false;
    }
  }, []);

  return {
    isInitialized,
    error,
    devices,
    selectedOutput,
    isConnected,
    selectOutputDevice,
    selectInputDevice,
    sendCC,
    subscribeToCC,
    requestMIDIAccess
  };
}
