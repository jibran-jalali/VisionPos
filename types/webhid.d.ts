interface Navigator {
  hid?: {
    requestDevice(options: { filters: any[] }): Promise<any>;
    getDevices(): Promise<any[]>;
  };
}
