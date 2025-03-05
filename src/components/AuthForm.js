import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AuthForm.css';
import TermsAndConditions from './TermsAndConditions';
import { useNavigate } from 'react-router-dom';
import logo from '../components/logo.png';

export default function AuthForm({ setUser, supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  const handleLogin = async () => {
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      navigate('/');
    } catch (error) {
      setError(error.message || t('loginError'));
    }
  };

  const handleOtpSignUp = async () => {
    setError('');
    if (!email || !password || !isChecked) {
      setError(t('enterEmailPasswordAnd Agree'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      // Регистрация с отправкой OTP
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`, // Опционально: куда перенаправить после подтверждения
        },
      });
      if (error) throw error;
      setShowOtpInput(true);
      setIsOtpSent(true);
      setTimeout(() => setIsOtpSent(false), 60000);
    } catch (error) {
      setError(error.message || t('registrationError'));
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup', // Тип OTP для регистрации
      });
      if (error) throw error;
      setUser(data.user);
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: data.user.id, is_service: false });
      if (profileError) throw profileError;
      console.log('OTP verified, navigating to dashboard');
      navigate('/');
    } catch (error) {
      setError(error.message || t('invalidOTP'));
    }
  };

  const navigateToServiceRegistration = () => {
    navigate('/service-registration');
  };

  return (
    <div className="auth-container">
      <img src={logo} alt="Car" className="logo-image" />
      <div className="language-auth-buttons">
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('ru')}>Русский</button>
        <button onClick={() => changeLanguage('uk')}>Українська</button>
      </div>
      <div className="auth-box">
        <h2 className="auth-title">{t('signInSignUp')}</h2>
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

        {!showOtpInput ? (
          <>
            <button type="button" onClick={handleLogin} className="auth-button">
              {t('signIn')}
            </button>
            <button
              type="button"
              onClick={handleOtpSignUp}
              className={`auth-button secondary ${!isChecked ? 'disabled' : ''}`}
              disabled={!isChecked || isOtpSent}
            >
              {isOtpSent ? t('otpSent') : t('registerWithOTP')}
            </button>
            <button
              type="button"
              onClick={navigateToServiceRegistration}
              className="auth-button secondary"
            >
              {t('registerService')}
            </button>
          </>
        ) : (
          <div className="otp-container">
            <input
              type="text"
              placeholder={t('enterOTP')}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="auth-input"
            />
            <button type="button" onClick={handleVerifyOtp} className="auth-button">
              {t('verifyOTP')}
            </button>
          </div>
        )}

        {error && <p className="auth-error">{error}</p>}

        <div className="terms-checkbox-container">
          <input
            type="checkbox"
            id="terms"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
            className="terms-checkbox"
          />
          <label htmlFor="terms" className="terms-label">
            {t('agreeWithTerms')}{' '}
            <span className="terms-link" onClick={() => setShowModal(true)}>
              <strong>{t('termsAndConditions')}</strong>
            </span>
          </label>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <TermsAndConditions />
            <button onClick={() => setShowModal(false)} className="modal-close-button">
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}