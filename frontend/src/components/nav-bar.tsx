const NAV_ITEMS = [
  { id: 'devices', label: 'Devices' },
  { id: 'console', label: 'Console' },
  { id: 'apk', label: 'APK' },
  { id: 'automation', label: 'Automation' },
  { id: 'reports', label: 'Reports' },
] as const;

export function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <span className="nav-bar__brand">Ultron ADB QA Site</span>
      <ul className="nav-bar__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <a className="nav-bar__link" href={`#${item.id}`}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
