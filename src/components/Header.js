import React, { useState } from 'react';
import './Header.css';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from './QRScanner';
import { useTranslation } from 'react-i18next';

export default function Header({ user, handleLogout, openEditModal, fetchCars, fetchRepairs,fetchMaintenance }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const firstLetter = user?.email?.charAt(0).toUpperCase();
  const { t, i18n } = useTranslation();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  /** 📌 Функция генерации QR-кода вместо JSON-файла */
  const handleGenerateQRCode = async () => {
  try {
    const { data: cars, error: carError } = await supabase
      .from("cars")
      .select("*")
      .eq("user_id", user.id);

    if (carError || !cars.length) {
      console.error("❌ Ошибка загрузки машины:", carError || "Машины не найдены");
      return;
    }

    const car = cars[0]; // Берем первую машину пользователя
    setQrData(car.id); // Передаем только car_id
    setShowQRCode(true); // Показываем QR-код
  } catch (error) {
    console.error("❌ Ошибка генерации QR-кода:", error);
  }
};

  /** 📌 Функция сканирования QR-кода */
const handleScanSuccess = async (data) => {
  try {
    // Очистка и проверка carId
    const carId = data.trim();
    if (!/^[0-9a-fA-F-]{36}$/.test(carId)) {
      console.error("❌ Некорректный формат carId:", carId);
      return;
    }

    // Проверяем, существует ли автомобиль с таким car_id
    const { data: existingCar, error: carCheckError } = await supabase
      .from("cars")
      .select("*")
      .eq("id", carId)
      .maybeSingle();

    console.log("Результат запроса:", { existingCar, carCheckError });

    if (carCheckError) {
      console.error("❌ Ошибка при проверке автомобиля:", carCheckError.message);
      return;
    }

    if (!existingCar) {
      console.error("❌ Автомобиль не найден");
      return;
    }

    // Обновляем user_id для нового владельца в таблице cars
    const { error: carUpdateError } = await supabase
      .from("cars")
      .update({ user_id: user.id })
      .eq("id", carId);

    if (carUpdateError) {
      console.error("❌ Ошибка при обновлении владельца автомобиля:", carUpdateError);
      return;
    }

    // Обновляем user_id для всех ремонтов, связанных с этим автомобилем
    const { error: repairsUpdateError } = await supabase
      .from("repairs")
      .update({ user_id: user.id })
      .eq("car_id", carId);

    if (repairsUpdateError) {
      console.error("❌ Ошибка при обновлении ремонтов:", repairsUpdateError);
      return;
    }

    // Обновляем user_id для всех записей ТО, связанных с этим автомобилем
    const { error: maintenanceUpdateError } = await supabase
      .from("maintenance")
      .update({ user_id: user.id })
      .eq("car_id", carId);

    if (maintenanceUpdateError) {
      console.error("❌ Ошибка при обновлении записей ТО:", maintenanceUpdateError);
      return;
    }

    console.log("✅ Автомобиль, ремонты и записи ТО успешно переданы новому владельцу!");

    // Обновляем данные на фронтенде
    fetchCars();
    fetchRepairs(carId);
    fetchMaintenance(carId); // Обновляем данные о ТО
    setShowQRScanner(false);

  } catch (error) {
    console.error("❌ Ошибка при обработке данных из QR-кода:", error);
  }
};

  const handleScanError = (error) => {
    console.error("❌ Ошибка сканирования QR-кода:", error);
  };

  return (
    <header className="header">
      <div className="user-icon" onClick={toggleDropdown}>
        {firstLetter}
      </div>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <div className='language-buttons'>
            <span>{t('language')}: </span>
            <button onClick={() => i18n.changeLanguage('en')}>🇬🇧</button>
            <button onClick={() => i18n.changeLanguage('ru')}>🇷🇺</button>
            <button onClick={() => i18n.changeLanguage('uk')}>🇺🇦</button>
          </div>
          <button onClick={handleLogout}>{t('logout')}</button>
          <button onClick={openEditModal}>{t('editInfo')}</button>
          <button onClick={handleGenerateQRCode}>{t('generateQRCode')}</button>
          <button onClick={() => setShowQRScanner(true)}>{t('scanQRCode')}</button>
        </div>
      )}

      {showQRCode && (
        <div className="qr-modal">
          <div className="qr-content">
            <QRCodeSVG
              value={qrData}
              size={312}
              level="H"
              margin={20}
            />
            <button onClick={() => setShowQRCode(false)}>Close</button>
          </div>
        </div>
      )}

      {showQRScanner && (
        <div className="qr-scanner-modal">
          <div className="qr-scanner-content">
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
            <button onClick={() => setShowQRScanner(false)}>Close</button>
          </div>
        </div>
      )}
    </header>
  );
}
