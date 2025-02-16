import React, { useState } from 'react';
import './Header.css';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from './QRScanner';
import { useTranslation } from 'react-i18next';
import CarTracker from './CarTracker';

export default function Header({ user, handleLogout, openEditModal, fetchCars, fetchRepairs, fetchMaintenance }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAddCarModal, setShowAddCarModal] = useState(false); // Состояние для модального окна добавления автомобиля
  const [newCar, setNewCar] = useState({ // Состояние для данных нового автомобиля
    brand: '',
    model: '',
    year: '',
    engine: '',
    mileage: '',
    vin: '',
    fuelType: '',
    transmissionType: '',
    turbocharged: false,
  });
  const firstLetter = user?.email?.charAt(0).toUpperCase();
  const { t, i18n } = useTranslation();
  const [car, setCar] = useState(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Функция для открытия модального окна добавления автомобиля
  const openAddCarModal = () => {
    setShowAddCarModal(true);
  };

  // Функция для закрытия модального окна добавления автомобиля
  const closeAddCarModal = () => {
    setShowAddCarModal(false);
  };

  // Функция для обработки изменений в форме добавления автомобиля
  const handleNewCarChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCar({
      ...newCar,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Функция для добавления нового автомобиля
  const addNewCar = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .insert([{ ...newCar, user_id: user.id }])
        .select('*')
        .single();

      if (error) {
        console.error('Ошибка при добавлении автомобиля:', error.message);
      } else {
        console.log('Автомобиль успешно добавлен:', data);
        fetchCars(); // Обновляем список автомобилей
        closeAddCarModal(); // Закрываем модальное окно
      }
    } catch (err) {
      console.error('Ошибка при добавлении автомобиля:', err);
    }
  };
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
          <CarTracker user={user} car={car} supabase={supabase} setCar={setCar} />
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
          <button onClick={openAddCarModal}>{t('addCar')}</button> {/* Кнопка для добавления автомобиля */}
        </div>
      )}

      {showAddCarModal && ( // Модальное окно для добавления автомобиля
        <div className="modal">
          <div className="modal-content">
            <h3>{t('addCar')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); addNewCar(); }}>
              <input
                type="text"
                name="brand"
                placeholder={t('brand')}
                value={newCar.brand}
                onChange={handleNewCarChange}
              />
              <input
                type="text"
                name="model"
                placeholder={t('model')}
                value={newCar.model}
                onChange={handleNewCarChange}
              />
              <input
                type="number"
                name="year"
                placeholder={t('year')}
                value={newCar.year}
                onChange={handleNewCarChange}
              />
              <input
                type="text"
                name="engine"
                placeholder={t('engine')}
                value={newCar.engine}
                onChange={handleNewCarChange}
              />
              <input
                type="number"
                name="mileage"
                placeholder={t('mileage')}
                value={newCar.mileage}
                onChange={handleNewCarChange}
              />
              <input
                type="text"
                name="vin"
                placeholder={t('vin')}
                value={newCar.vin}
                onChange={handleNewCarChange}
              />
              <select
                name="fuelType"
                value={newCar.fuelType}
                onChange={handleNewCarChange}
              >
                <option value="">{t('selectFuelType')}</option>
                <option value="Petrol">{t('petrol')}</option>
                <option value="Diesel">{t('diesel')}</option>
                <option value="Electric">{t('electric')}</option>
                <option value="Hybrid">{t('hybrid')}</option>
              </select>
              <select
                name="transmissionType"
                value={newCar.transmissionType}
                onChange={handleNewCarChange}
              >
                <option value="">{t('selectTransmission')}</option>
                <option value="Manual">{t('manual')}</option>
                <option value="Automatic">{t('automatic')}</option>
                <option value="CVT">{t('cvt')}</option>
                <option value="Dual-clutch">{t('dualClutch')}</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  name="turbocharged"
                  checked={newCar.turbocharged}
                  onChange={handleNewCarChange}
                />
                {t('turbocharged')}
              </label>
              <button type="submit">{t('save')}</button>
              <button type="button" onClick={closeAddCarModal}>{t('cancel')}</button>
            </form>
          </div>
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