// ResetPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword({ supabase }) {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleReset = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('Password updated successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setMessage(error.message || 'Error updating password');
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleReset}>Update Password</button>
      {message && <p>{message}</p>}
    </div>
  );
}