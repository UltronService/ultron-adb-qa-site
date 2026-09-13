export const MOCK_LOGCAT_LINES: string[] = [
  '[Info] ActivityManager: Start proc com.ultron.player for activity com.ultron.player/.MainActivity',
  '[Debug] UltronPlayer: onCreate — flavor=demo apiHost=https://ultrontest.ddns.net',
  '[Info] UltronPlayer: MainActivity resumed',
  '[Debug] ExoPlayer: buffer ready, duration=7200000ms',
  '[Warn] UltronPlayer: network latency spike 420ms',
  '[Info] UltronPlayer: channel list loaded (24 items)',
  '[Debug] OkHttp: GET /api/channels 200 (312ms)',
  '[Info] UltronPlayer: playback started — channel=CTiNews',
  '[Error] UltronPlayer: HTTP 503 on /api/epg/retry scheduled',
  '[Info] UltronPlayer: retry succeeded',
  '[Debug] Glide: image loaded banner_hero.webp',
  '[Info] ActivityManager: Displayed com.ultron.player/.MainActivity +1s842ms',
];

export function buildMockLogcatExport(packageName: string, logLevel: string): string {
  const header = `# Mock logcat export\n# package=${packageName}\n# level=${logLevel}\n# generated=${new Date().toISOString()}\n\n`;
  return header + MOCK_LOGCAT_LINES.join('\n');
}
