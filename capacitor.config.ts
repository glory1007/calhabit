import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.calhabit.app',
  appName: 'CalHabit',
  webDir: 'dist',
  server: {
    url: 'https://calhabit-sage.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true
    }
  }
};

export default config;
