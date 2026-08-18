import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <section className="hero">
      <p className="page-kicker">Streetwear</p>
      <h1>SOHAIL</h1>
      <p>
        Dark drops. Limited runs. Update your profile in Settings so checkout
        has your name and shipping details ready.
      </p>
      <div className="actions">
        {user ? (
          <Link className="btn btn-primary" to="/settings">
            Edit profile
          </Link>
        ) : (
          <Link className="btn btn-primary" to="/register">
            Create account
          </Link>
        )}
      </div>
    </section>
  );
}
