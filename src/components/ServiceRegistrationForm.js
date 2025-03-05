import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AuthForm.css';
import { useNavigate } from "react-router-dom";
import TermsAndConditions from './TermsAndConditions';
import logo from '../components/logo.png';

export default function ServiceRegistrationForm({ supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleServiceSignUp = async () => {
    if (!isChecked) return;
    setError('');
    setShowOtpInput(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/service-dashboard`, // Опционально
        },
      });
      if (authError) throw authError;
    } catch (error) {
      setError(error.message || t('registrationError'));
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });
      if (otpError) throw otpError;

      const { error: profileError } = await supabase.from('profiles').upsert([
        {
          id: data.user.id,
          email,
          service_name: serviceName,
          address,
          phone,
          is_service: true,
        },
      ]);
      if (profileError) throw profileError;

      console.log('Service registered successfully, navigating to /service-dashboard');
      navigate('/service-dashboard', { state: { user: data.user } });
    } catch (error) {
      setError(error.message || t('invalidOTP'));
    }
  };

  const handleAlreadyHaveAccount = () => {
    navigate('/');
  };

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  const areAllFieldsFilled = () => {
    return (
      email.trim() !== '' &&
      password.trim() !== '' &&
      serviceName.trim() !== '' &&
      address.trim() !== '' &&
      phone.trim() !== '' &&
      isChecked
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="language-buttons">
          <button onClick={() => changeLanguage('en')}>English</button>
          <button onClick={() => changeLanguage('ru')}>Русский</button>
          <button onClick={() => changeLanguage('uk')}>Українська</button>
        </div>
        <h2>{t('serviceRegistration')}</h2>

        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <input
          type="text"
          placeholder={t('serviceName')}
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          className="auth-input"
        />
        <input
          type="text"
          placeholder={t('address')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="auth-input"
        />
        <input
          type="text"
          placeholder={t('phone')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="auth-input"
        />
        <br/>
        <label className="terms-checkbox">
          <input 
            type="checkbox" 
            checked={isChecked} 
            onChange={() => setIsChecked(!isChecked)} 
          />
          {t('agreeWithTerms')}{' '}
          <span 
            className="terms-link" 
            onClick={() => setShowModal(true)}
          >
            {t('termsAndConditions')}
          </span>
        </label>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <TermsAndConditions />
              <button onClick={handleModalClose} className="modal-close-button">{t('close')}</button>
            </div>
          </div>
        )}

        {!showOtpInput ? (
          <button
            className={`auth-button secondary ${!areAllFieldsFilled() ? 'disabled' : ''}`}
            disabled={!areAllFieldsFilled()}
            onClick={handleServiceSignUp}
          >
            {t('registerService')}
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder={t('enterOTP')}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="auth-input"
            />
            <button onClick={handleVerifyOtp} className="auth-button">
              {t('verifyOTP')}
            </button>
          </>
        )}
        <img src={logo} alt="Car" className="logo-image" />
        {error && <p className="auth-error">{error}</p>}

        <div className="auth-toggle">
          <button onClick={handleAlreadyHaveAccount} className="auth-toggle-button">
            {t('alreadyHaveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}