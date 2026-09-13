import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: '總覽' },
  { path: '/devices', label: '裝置' },
  { path: '/console', label: '主控台' },
  { path: '/apk', label: 'APK' },
  { path: '/automation', label: '自動化' },
  { path: '/scripts', label: '劇本' },
  { path: '/reports', label: '報表' },
] as const;

export function NavBar() {
  return (
    <nav className="nav-bar" aria-label="主要導航">
      <NavLink className="nav-bar__brand" to="/">
        <span className="nav-bar__brand-title">Ultron ADB QA</span>
        <span className="nav-bar__brand-sub">QA 主控台</span>
      </NavLink>
      <ul className="nav-bar__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'nav-bar__link nav-bar__link--active' : 'nav-bar__link'
              }
              end={item.path === '/'}
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
