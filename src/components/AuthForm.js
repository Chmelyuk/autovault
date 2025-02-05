import { useState } from 'react';
import './AuthForm.css';

export default function AuthForm({ setUser, supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else setUser(data.user);
  };

  const handleOtpSignUp = async () => {
    setError('');
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const { otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) throw otpError;
      setShowOtpInput(true);
      setIsOtpSent(true);
      setTimeout(() => {
        setIsOtpSent(false);
        setError('');
      }, 60000);
    } catch (error) {
      setError(error.message || 'Произошла ошибка при регистрации.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
      if (error) throw error;
      setUser(data.user);
    } catch (error) {
      setError(error.message || 'Неверный OTP. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <button onClick={handleLogin} className="auth-button">Login</button>
        <button onClick={handleOtpSignUp} className="auth-button secondary">Register with OTP</button>
        {showOtpInput && (
          <div className="otp-container">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="auth-input"
            />
            <button onClick={handleVerifyOtp} className="auth-button">Verify OTP</button>
          </div>
        )}
        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  );
}
