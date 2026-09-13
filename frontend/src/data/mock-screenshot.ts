/** Placeholder TV screenshot as SVG data URL for demo mode */
export const MOCK_SCREENSHOT_DATA_URL =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#0b0f14"/>
  <rect x="20" y="20" width="600" height="320" rx="8" fill="#1a2230" stroke="#334155"/>
  <text x="320" y="140" fill="#64b5f6" font-family="sans-serif" font-size="28" text-anchor="middle">Ultron Player</text>
  <text x="320" y="180" fill="#a8b3c5" font-family="sans-serif" font-size="16" text-anchor="middle">Demo Mode · Mock STB Preview</text>
  <rect x="40" y="220" width="120" height="80" rx="4" fill="#243041"/>
  <rect x="180" y="220" width="120" height="80" rx="4" fill="#243041"/>
  <rect x="320" y="220" width="120" height="80" rx="4" fill="#3d5afe"/>
  <rect x="460" y="220" width="120" height="80" rx="4" fill="#243041"/>
  <text x="320" y="330" fill="#4caf50" font-family="monospace" font-size="12" text-anchor="middle">1920×1080 · com.ultron.player</text>
</svg>`);

export function mockScreenshotBase64(): string {
  const prefix = 'data:image/svg+xml;base64,';
  if (MOCK_SCREENSHOT_DATA_URL.startsWith(prefix)) {
    return MOCK_SCREENSHOT_DATA_URL.slice(prefix.length);
  }
  return '';
}
