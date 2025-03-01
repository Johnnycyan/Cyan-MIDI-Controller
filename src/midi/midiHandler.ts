export class MIDIHandler {
  private midiAccess: MIDIAccess | null = null;
  private selectedInput: MIDIInput | null = null;
  private selectedOutput: MIDIOutput | null = null;
  private onStateChange: ((state: MIDIConnectionState) => void) | null = null;
  private ccListeners: Map<string, (value: number) => void> = new Map();

  // Create a key for CC listeners
  private static getCCKey(channel: number, cc: number): string {
    return `${channel}-${cc}`;
  }

  // Subscribe to CC changes
  subscribeToCC(channel: number, cc: number, callback: (value: number) => void): () => void {
    const key = MIDIHandler.getCCKey(channel, cc);
    this.ccListeners.set(key, callback);

    // Return unsubscribe function
    return () => {
      this.ccListeners.delete(key);
    };
  }

  // Initialize MIDI system
  async initialize(): Promise<boolean> {
    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      this.midiAccess.onstatechange = this.handleStateChange.bind(this);
      return true;
    } catch (error) {
      console.error('Failed to initialize MIDI system:', error);
      return false;
    }
  }

  // Handle MIDI state changes
  private handleStateChange(event: MIDIConnectionEvent) {
    if (!event.port) return;
    
    const port = event.port;
    const state: MIDIConnectionState = {
      port: {
        id: port.id,
        manufacturer: port.manufacturer ?? '',
        name: port.name ?? '',
        state: port.state,
        type: port.type,
      },
      timestamp: event.timeStamp
    };

    console.log(`MIDI port ${port.type} "${port.name ?? 'Unknown'}" state changed to ${port.state}`);
    
    // Notify subscribers
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  // List all available MIDI devices
  listDevices(): MIDIDeviceList {
    if (!this.midiAccess) return { inputs: [], outputs: [] };

    const inputs = Array.from(this.midiAccess.inputs.values()).map(input => ({
      id: input.id,
      manufacturer: input.manufacturer ?? '',
      name: input.name ?? '',
      type: 'input' as const,
      state: input.state
    }));

    const outputs = Array.from(this.midiAccess.outputs.values()).map(output => ({
      id: output.id,
      manufacturer: output.manufacturer ?? '',
      name: output.name ?? '',
      type: 'output' as const,
      state: output.state
    }));

    return { inputs, outputs };
  }

  // Select MIDI input device
  selectInput(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      if (this.selectedInput) {
        this.selectedInput.onmidimessage = null;
      }
      this.selectedInput = input;
      this.selectedInput.onmidimessage = this.handleMIDIMessage;
      return true;
    }
    return false;
  }

  // Handle incoming MIDI message
  private handleMIDIMessage = (event: MIDIMessageEvent) => {
    // Ensure data exists and is not null
    if (!event.data) return;
    
    const data = Array.from(new Uint8Array(event.data));
    const [status, cc, value] = data;
    
    // Check if it's a CC message (0xB0-0xBF)
    if ((status & 0xF0) === 0xB0) {
      const channel = (status & 0x0F) + 1; // Convert to 1-based channel number
      const key = MIDIHandler.getCCKey(channel, cc);
      const listener = this.ccListeners.get(key);
      
      if (listener) {
        listener(value);
      }
    }
  };

  // Select MIDI output device
  selectOutput(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    const output = this.midiAccess.outputs.get(deviceId);
    if (output) {
      this.selectedOutput = output;
      return true;
    }
    return false;
  }

  // Set state change callback
  setStateChangeCallback(callback: (state: MIDIConnectionState) => void) {
    this.onStateChange = callback;
  }

  // Send MIDI Control Change message
  sendCC(channel: number, cc: number, value: number): boolean {
    if (!this.selectedOutput) {
      console.warn('No MIDI output selected');
      return false;
    }

    try {
      // MIDI CC message: Status byte (0xB0 | channel-1) + CC number + value
      const message = [0xB0 | (channel - 1), cc, value];
      this.selectedOutput.send(message);
      
      // Debug output
      console.log(`Sent MIDI CC - Channel: ${channel}, CC: ${cc}, Value: ${value}`);
      return true;
    } catch (error) {
      console.error('Failed to send MIDI message:', error);
      return false;
    }
  }

  // Send MIDI Note On message
  sendNoteOn(channel: number, note: number, velocity: number): boolean {
    if (!this.selectedOutput) return false;

    try {
      // Note On message: Status byte (0x90 | channel-1) + note + velocity
      this.selectedOutput.send([0x90 | (channel - 1), note, velocity]);
      return true;
    } catch (error) {
      console.error('Failed to send Note On message:', error);
      return false;
    }
  }

  // Send MIDI Note Off message
  sendNoteOff(channel: number, note: number): boolean {
    if (!this.selectedOutput) return false;

    try {
      // Note Off message: Status byte (0x80 | channel-1) + note + velocity 0
      this.selectedOutput.send([0x80 | (channel - 1), note, 0]);
      return true;
    } catch (error) {
      console.error('Failed to send Note Off message:', error);
      return false;
    }
  }

  // Get current connection status
  isConnected(): boolean {
    return this.selectedOutput !== null && this.selectedOutput.state === 'connected';
  }

  // Get currently selected output device
  getSelectedOutput(): MIDIOutput | null {
    return this.selectedOutput;
  }
}

// Types
export interface MIDIDevice {
  id: string;
  manufacturer: string;
  name: string;
  type: MIDIPortType;
  state: MIDIPortDeviceState;
}

export interface MIDIDeviceList {
  inputs: MIDIDevice[];
  outputs: MIDIDevice[];
}

export interface MIDIConnectionState {
  port: {
    id: string;
    manufacturer: string;
    name: string;
    state: MIDIPortDeviceState;
    type: MIDIPortType;
  };
  timestamp: number;
}

// Create singleton instance
export const midiHandler = new MIDIHandler();
