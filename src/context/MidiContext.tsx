import React, { createContext, useContext, useEffect, useState } from 'react';
import { midiHandler, MIDIDevice } from '../midi/midiHandler';

interface MidiContextType {
  isInitialized: boolean;
  error: string | null;
  devices: MIDIDevice[];
  selectedOutput: MIDIDevice | null;
  isConnected: boolean;
  selectOutput: (deviceId: string) => Promise<boolean>;
  selectInput: (deviceId: string) => Promise<boolean>;
  sendCC: (channel: number, cc: number, value: number) => boolean;
  subscribeToCC: (channel: number, cc: number, callback: (value: number) => void) => () => void;
}

const MidiContext = createContext<MidiContextType>({
  isInitialized: false,
  error: null,
  devices: [],
  selectedOutput: null,
  isConnected: false,
  selectOutput: async () => false,
  selectInput: async () => false,
  sendCC: () => false,
  subscribeToCC: () => () => {},
});

export const MidiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        } else {
          setError('Failed to initialize MIDI system');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown MIDI error');
      }
    };

    initMIDI();
  }, []);

  const selectOutput = async (deviceId: string): Promise<boolean> => {
    const device = devices.find(d => d.id === deviceId && d.type === 'output');
    if (!device) return false;

    const success = midiHandler.selectOutput(device.id);
    if (success) {
      setSelectedOutput(device);
      setIsConnected(true);
      setError(null);
      return true;
    }
    return false;
  };

  const selectInput = async (deviceId: string): Promise<boolean> => {
    const device = devices.find(d => d.id === deviceId && d.type === 'input');
    if (!device) return false;

    return midiHandler.selectInput(device.id);
  };

  const sendCC = (channel: number, cc: number, value: number): boolean => {
    return midiHandler.sendCC(channel, cc, value);
  };

  const subscribeToCC = (channel: number, cc: number, callback: (value: number) => void) => {
    return midiHandler.subscribeToCC(channel, cc, callback);
  };

  return (
    <MidiContext.Provider
      value={{
        isInitialized,
        error,
        devices,
        selectedOutput,
        isConnected,
        selectOutput,
        selectInput,
        sendCC,
        subscribeToCC,
      }}
    >
      {children}
    </MidiContext.Provider>
  );
};

export const useMidiContext = () => useContext(MidiContext);

export default MidiContext;
