export const ULTRON_PLAYER_APK_SOURCE = {
  appName: 'Ultron Player',
  packageName: 'com.ultron.player',
  versionCode: 10042,
  launchActivity: 'com.ultron.player/.MainActivity',
  repoUrl: 'https://github.com/AaronKuan/UltronProject-copy20260425',
  branch: 'develop',
  buildCommand: './gradlew assembleDemoRelease',
  outputPath: 'app/build/outputs/apk/demo/release/',
  apiHost: 'https://ultrontest.ddns.net',
  recommendedFlavor: 'demo',
} as const;
