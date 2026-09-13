import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/devices', label: 'Devices' },
  { path: '/console', label: 'Console' },
  { path: '/apk', label: 'APK' },
  { path: '/automation', label: 'Automation' },
  { path: '/scripts', label: '劇本' },
  { path: '/reports', label: 'Reports' },
] as const;

export function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <NavLink className="nav-bar__brand" to="/devices">
        Ultron ADB QA Site
      </NavLink>
      <ul className="nav-bar__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'nav-bar__link nav-bar__link--active' : 'nav-bar__link'
              }
              to={item.path}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
