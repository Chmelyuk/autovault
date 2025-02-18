import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AuthForm.css';
import { useNavigate } from "react-router-dom";

export default function AuthForm({ supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isRegistering, setIsRegistering] = useState(true); // Для выбора между входом и регистрацией
  const [error, setError] = useState('');
  const { t, i18n } = useTranslation();
  const navigate = useNavigate(); 

  // Обработчик для регистрации сервиса
  const handleServiceSignUp = async () => {
    setError('');
    setShowOtpInput(true); // Показываем поле OTP сразу после нажатия
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) throw otpError;
    } catch (error) {
      setError(error.message || t('registrationError'));
    }
  };

  // Обработчик для подтверждения OTP
  const handleVerifyOtp = async () => {
    try {
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });
      if (otpError) throw otpError;

      const { error: profileError } = await supabase.from('profiles').insert([
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

      console.log('Service registered successfully');
    } catch (error) {
      setError(error.message || t('invalidOTP'));
    }
  };

  // Обработчик для входа пользователя
  const handleLogin = async () => {
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      console.log('User logged in successfully');
    } catch (error) {
      setError(error.message || t('loginError'));
    }
  };

   const handleAlreadyHaveAccount = () => {
    navigate('/autovault/'); // Редирект на главную страницу (компонент AuthForm)
  };
 const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="language-buttons">
          <button onClick={() => changeLanguage('en')}>English</button>
          <button onClick={() => changeLanguage('ru')}>Русский</button>
          <button onClick={() => changeLanguage('uk')}>Українська</button>
        </div>
        <h2>{isRegistering ? t('serviceRegistration') : t('login')}</h2>

        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        {isRegistering && (
          <>
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
          </>
        )}

        {!showOtpInput ? (
          <button
            onClick={isRegistering ? handleServiceSignUp : handleLogin}
            className="auth-button"
          >
            {isRegistering ? t('registerService') : t('login')}
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

        {error && <p className="auth-error">{error}</p>}

        {/* Кнопка для переключения между входом и регистрацией */}
        <div className="auth-toggle">
          <button onClick={handleAlreadyHaveAccount} className="auth-toggle-button">
            {t('alreadyHaveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
