// Header.js
import React, { useState } from 'react';
import './Header.css'

export default function Header({ user, handleLogout, openEditModal }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const firstLetter = user?.email?.charAt(0).toUpperCase();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="header">
      <div className="user-icon" onClick={toggleDropdown}>
        {firstLetter}
      </div>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <button onClick={handleLogout}>Logout</button>
          <button onClick={openEditModal}>Edit Info</button>
        </div>
      )}
    </header>
  );
}
