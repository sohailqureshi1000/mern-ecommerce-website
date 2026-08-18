import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const emptyAddress = {
  street: '',
  city: '',
  postalCode: '',
  country: '',
};

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(emptyAddress);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setAddress({ ...emptyAddress, ...user.address });
  }, [user]);

  function patchAddress(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = { name, email, phone, address };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await updateProfile(payload);
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Profile saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <p className="page-kicker">Account</p>
      <h1 className="page-title">Settings</h1>
      <p className="page-lede">
        Update your profile, contact details, and shipping address. Password
        changes require your current password.
      </p>

      <form onSubmit={handleSubmit}>
        {error ? <div className="alert alert-error">{error}</div> : null}
        {success ? <div className="alert alert-ok">{success}</div> : null}

        <div className="card">
          <h2>Profile</h2>
          <div className="form-grid two">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field span-2">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Shipping</h2>
          <div className="form-grid two">
            <div className="field span-2">
              <label htmlFor="street">Street</label>
              <input
                id="street"
                autoComplete="street-address"
                value={address.street}
                onChange={(e) => patchAddress('street', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                autoComplete="address-level2"
                value={address.city}
                onChange={(e) => patchAddress('city', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="postalCode">Postal code</label>
              <input
                id="postalCode"
                autoComplete="postal-code"
                value={address.postalCode}
                onChange={(e) => patchAddress('postalCode', e.target.value)}
              />
            </div>
            <div className="field span-2">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                autoComplete="country-name"
                value={address.country}
                onChange={(e) => patchAddress('country', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Password</h2>
          <div className="form-grid two">
            <div className="field">
              <label htmlFor="currentPassword">Current password</label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </section>
  );
}
