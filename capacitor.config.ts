/// <reference types="@capacitor-firebase/messaging" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.auxilium.guide',
  appName: 'Auxilium',
  webDir: 'dist/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['alert', 'badge', 'sound']
    }
  },
  experimental: {
    ios: {
      spm: {
        packageOptions: {
          '@capacitor-firebase/messaging': {
            symlink: true
          }
        }
      }
    }
  }
};

export default config;
