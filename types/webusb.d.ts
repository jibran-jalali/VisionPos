interface Navigator {
  usb?: {
    requestDevice(options: { filters: any[] }): Promise<any>;
    getDevices(): Promise<any[]>;
  };
}
