import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="nav">
        <NavLink to="/" className="logo">
          SOHAIL
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/">Shop</NavLink>
          {user ? (
            <>
              <NavLink to="/settings">Settings</NavLink>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register">Join</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
