// Platform polyfill for web compatibility
import { Platform as RNPlatform } from 'react-native';

export const Platform = {
  ...RNPlatform,
  OS: RNPlatform.OS || 'web',
  select: RNPlatform.select || ((specifics: any) => {
    return specifics.web || specifics.default;
  }),
};