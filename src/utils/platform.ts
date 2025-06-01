import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobile = isIOS || isAndroid;

export const platformSelect = <T>(options: {
  web?: T;
  ios?: T;
  android?: T;
  mobile?: T;
  default?: T;
}): T | undefined => {
  if (isWeb && options.web !== undefined) {return options.web;}
  if (isIOS && options.ios !== undefined) {return options.ios;}
  if (isAndroid && options.android !== undefined) {return options.android;}
  if (isMobile && options.mobile !== undefined) {return options.mobile;}
  return options.default;
};
