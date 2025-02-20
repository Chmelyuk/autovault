import React, { useState, useEffect } from 'react';
import './Header.css';
import { supabase } from '../supabaseClient';
import QRScanner from './QRScanner';
import { useTranslation } from 'react-i18next';
import logo from '../components/logo.png';

export default function ServiceHeader({ user, handleLogout, fetchCars }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedCars, setScannedCars] = useState([]);
  const { t, i18n } = useTranslation();

  // Переключаем выпадающее меню
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Функция сканирования QR-кода
  const handleScanSuccess = async (data) => {
  const carId = data.trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(carId)) {
    alert(t('invalidQrCode'));
    return;
  }

  // Проверяем, существует ли автомобиль
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('*')
    .eq('id', carId)
    .maybeSingle();

  if (carError || !car) {
    alert(t('carNotFound'));
    return;
  }

  // Привязываем автомобиль к автосервису
  const { error: linkError } = await supabase
    .from('service_cars')
    .insert([{ service_id: user.id, car_id: carId }], { upsert: true });

  if (linkError) {
    alert(t('carLinkError'));
    return;
  }

  // Загружаем данные о ремонтах и ТО для этого автомобиля
  const { data: repairs, error: repairsError } = await supabase
    .from('repairs')
    .select('*')
    .eq('car_id', carId);

  const { data: maintenance, error: maintenanceError } = await supabase
    .from('maintenance')
    .select('*')
    .eq('car_id', carId);

  if (repairsError || maintenanceError) {
    console.error('Ошибка при загрузке данных о ремонтах и ТО:', repairsError || maintenanceError);
    return;
  }

  // Обновляем состояние с данными о ремонтах и ТО
  setScannedCars((prevCars) => {
    const updatedCars = prevCars.map((c) => {
      if (c.id === carId) {
        return {
          ...c,
          repairs: repairs || [],
          maintenance: maintenance || [],
        };
      }
      return c;
    });

    // Если автомобиль еще не в списке, добавляем его
    if (!updatedCars.some((c) => c.id === carId)) {
      updatedCars.push({
        ...car,
        repairs: repairs || [],
        maintenance: maintenance || [],
      });
    }

    return updatedCars;
  });

  // Обновляем список машин на дашборде
  fetchCars();
  setShowQRScanner(false);
};
  return (
    <header className="header">
      <div className="user-icon" onClick={toggleDropdown}>
        {user?.email?.charAt(0).toUpperCase()}
      </div>

<img
        src={logo}
        alt="Car"
        className="logo-image"
      />

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <button onClick={handleLogout}>{t('logout')}</button>
          <button onClick={() => setShowQRScanner(true)}>{t('scanQRCode')}</button>
          <div className="language-buttons">
            <button onClick={() => i18n.changeLanguage('en')}>🇬🇧</button>
            <button onClick={() => i18n.changeLanguage('ru')}>🇷🇺</button>
            <button onClick={() => i18n.changeLanguage('uk')}>🇺🇦</button>
          </div>
        </div>
      )}

      {showQRScanner && (
        <div className="qr-scanner-modal">
          <div className="qr-scanner-content">
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={(err) => console.error(t('scanError'), err)}
            />
            <button onClick={() => setShowQRScanner(false)}>{t('close')}</button>
          </div>
        </div>
      )}

      
    </header>
  );
}
