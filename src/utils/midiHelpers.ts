export const waitForMidiInit = (timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInit = () => {
      try {
        // Check if navigator.requestMIDIAccess() resolves
        navigator.requestMIDIAccess().then(() => {
          resolve();
        }).catch(() => {
          if (Date.now() - startTime > timeout) {
            reject(new Error('MIDI initialization timeout'));
          } else {
            setTimeout(checkInit, 100);
          }
        });
      } catch (err) {
        if (Date.now() - startTime > timeout) {
          reject(new Error('MIDI initialization timeout'));
        } else {
          setTimeout(checkInit, 100);
        }
      }
    };
    checkInit();
  });
};
