export interface DeviceProps {
  product_brand: string;
  product_manufacturer: string;
  product_model: string;
  android_version: string;
  serial: string;
  sdk_version: string;
}

export interface DevicePropsResponse {
  props: DeviceProps;
  mock: string;
}

export interface ShellCommandResponse {
  output: string;
  mock: string;
}

export interface AdbActionResponse {
  status: string;
  mock: string;
  message?: string;
}

export interface InstallApkOptions {
  replace: boolean;
  allowDowngrade: boolean;
}
