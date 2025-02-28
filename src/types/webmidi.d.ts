declare global {
  interface MIDIOptions {
    sysex?: boolean;
    software?: boolean;
  }

  interface MIDIMessageEvent extends Event {
    data: Uint8Array;
    receivedTime: number;
    timeStamp: number;
  }

  interface MIDIInputMap {
    forEach(callbackfn: (value: MIDIInput, key: string) => void): void;
    get(key: string): MIDIInput | undefined;
    has(key: string): boolean;
    entries(): IterableIterator<[string, MIDIInput]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<MIDIInput>;
    [Symbol.iterator](): IterableIterator<[string, MIDIInput]>;
    readonly size: number;
  }

  interface MIDIOutputMap {
    forEach(callbackfn: (value: MIDIOutput, key: string) => void): void;
    get(key: string): MIDIOutput | undefined;
    has(key: string): boolean;
    entries(): IterableIterator<[string, MIDIOutput]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<MIDIOutput>;
    [Symbol.iterator](): IterableIterator<[string, MIDIOutput]>;
    readonly size: number;
  }

  interface MIDIPort extends EventTarget {
    readonly id: string;
    readonly manufacturer?: string | null;
    readonly name?: string | null;
    readonly type: "input" | "output";
    readonly version?: string | null;
    readonly state: "disconnected" | "connected";
    readonly connection: "open" | "closed" | "pending";
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
    open(): Promise<MIDIPort>;
    close(): Promise<MIDIPort>;
  }

  interface MIDIInput extends MIDIPort {
    readonly type: "input";
    onmidimessage: ((event: MIDIMessageEvent) => void) | null;
  }

  interface MIDIOutput extends MIDIPort {
    readonly type: "output";
    send(data: Uint8Array | number[], timestamp?: number): void;
    clear(): void;
  }

  interface MIDIAccess extends EventTarget {
    readonly inputs: MIDIInputMap;
    readonly outputs: MIDIOutputMap;
    readonly sysexEnabled: boolean;
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  }

  interface MIDIConnectionEvent extends Event {
    readonly port: MIDIPort;
  }

  interface Navigator {
    requestMIDIAccess(options?: MIDIOptions): Promise<MIDIAccess>;
  }
}

export {};
