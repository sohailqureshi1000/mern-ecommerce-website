import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { checkDuplicateEmail } from '../utils/checkDuplicateEmail.js';
import {
  isPasswordChangeAttempt,
  validateSettingsForm,
} from '../utils/validateSettingsForm.js';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  country: '',
  password: '',
  confirmPassword: '',
  currentPassword: '',
};

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}

function TextField({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  onChange,
  error,
  span2 = false,
}) {
  const errorId = `${id}-error`;
  return (
    <div className={span2 ? 'field span-2' : 'field'}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setValues((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || '',
    }));
  }, [user]);

  function patch(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  const changingPassword = isPasswordChangeAttempt(values);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    const nextErrors = validateSettingsForm(values, { currentEmail: user?.email });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const emailChanged =
      String(values.email).trim().toLowerCase() !== String(user?.email || '').toLowerCase();

    setSaving(true);
    try {
      if (emailChanged) {
        const taken = await checkDuplicateEmail(values.email);
        if (taken) {
          setErrors({ email: 'This email is already in use' });
          return;
        }
      }

      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: {
          street: values.street.trim(),
          city: values.city.trim(),
          postalCode: values.postalCode.trim(),
          country: values.country.trim(),
        },
      };

      if (changingPassword) {
        payload.currentPassword = values.currentPassword;
        payload.newPassword = values.password;
      }

      await updateProfile(payload);
      setValues((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
        currentPassword: '',
      }));
      setSuccess('Profile saved.');
    } catch (err) {
      if (err.status === 409 || /already in use/i.test(err.message || '')) {
        setErrors({ email: err.message || 'This email is already in use' });
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <p className="page-kicker">Account</p>
      <h1 className="page-title">Settings</h1>
      <p className="page-lede">
        Update your profile, contact details, and shipping address. Leave password
        blank unless you want to change it.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {formError ? (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        ) : null}
        {success ? (
          <div className="alert alert-ok" role="status">
            {success}
          </div>
        ) : null}

        <div className="card">
          <h2>Profile</h2>
          <div className="form-grid two">
            <TextField
              id="name"
              label="Name"
              autoComplete="name"
              value={values.name}
              onChange={(e) => patch('name', e.target.value)}
              error={errors.name}
            />
            <TextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => patch('email', e.target.value)}
              error={errors.email}
            />
            <TextField
              id="phone"
              label="Phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => patch('phone', e.target.value)}
              error={errors.phone}
              span2
            />
          </div>
        </div>

        <div className="card">
          <h2>Shipping</h2>
          <div className="form-grid two">
            <TextField
              id="street"
              label="Street"
              autoComplete="street-address"
              value={values.street}
              onChange={(e) => patch('street', e.target.value)}
              error={errors.street}
              span2
            />
            <TextField
              id="city"
              label="City"
              autoComplete="address-level2"
              value={values.city}
              onChange={(e) => patch('city', e.target.value)}
              error={errors.city}
            />
            <TextField
              id="postalCode"
              label="Postal code"
              autoComplete="postal-code"
              value={values.postalCode}
              onChange={(e) => patch('postalCode', e.target.value)}
              error={errors.postalCode}
            />
            <TextField
              id="country"
              label="Country"
              autoComplete="country-name"
              value={values.country}
              onChange={(e) => patch('country', e.target.value)}
              error={errors.country}
              span2
            />
          </div>
        </div>

        <div className="card">
          <h2>Password</h2>
          <div className="form-grid two">
            <TextField
              id="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(e) => patch('password', e.target.value)}
              error={errors.password}
            />
            <TextField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(e) => patch('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
            />
            {changingPassword ? (
              <TextField
                id="currentPassword"
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={values.currentPassword}
                onChange={(e) => patch('currentPassword', e.target.value)}
                error={errors.currentPassword}
                span2
              />
            ) : null}
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
