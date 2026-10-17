import { Link, NavLink } from 'react-router-dom';

function navClass(isActive: boolean): string {
  return isActive ? 'nav-link active' : 'nav-link';
}

export function AppHeader() {
  return (
    <header className="app-header no-print">
      <Link to="/" className="brand-link">
        <h1 className="brand">Shared spending</h1>
      </Link>
      <nav className="nav" aria-label="Primary">
        <NavLink to="/qr" className={({ isActive }) => navClass(isActive)}>
          QR codes
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => navClass(isActive)}>
          Settings
        </NavLink>
      </nav>
    </header>
  );
}
