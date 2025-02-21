import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from './QRScanner';
import { useTranslation } from 'react-i18next';
import CarTracker from './CarTracker';
import { supabase } from "../supabaseClient";
import logo from '../components/logo.png';

export default function Header({ user, handleLogout, openEditModal, fetchCars, fetchRepairs, fetchMaintenance, selectedCar, cars = [] }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditCarModal, setShowEditCarModal] = useState(false);
  const [newCar, setNewCar] = useState({
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
  const [editCar, setEditCar] = useState(null);
  const [suggestedBrands, setSuggestedBrands] = useState([]);
  const [suggestedModels, setSuggestedModels] = useState([]);
  const { t, i18n } = useTranslation();
  const [car, setCar] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const fetchBrands = async (input) => {
    const trimmedInput = input.trim();
    if (trimmedInput.length < 2) {
      setSuggestedBrands([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("car_list")
        .select("brand")
        .ilike("brand", `%${trimmedInput}%`);

      if (error) throw error;

      if (data.length > 0) {
        const uniqueBrands = [...new Set(data.map((item) => item.brand))];
        setSuggestedBrands(uniqueBrands);
      } else {
        setSuggestedBrands([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке брендов:", error.message);
      setSuggestedBrands([]);
    }
  };

  const fetchModels = async (input, brand) => {
    const trimmedInput = input.trim();
    if (trimmedInput.length < 2 || !brand) {
      setSuggestedModels([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("car_list")
        .select("model")
        .eq("brand", brand)
        .ilike("model", `%${trimmedInput}%`);

      if (error) throw error;

      if (data.length > 0) {
        const uniqueModels = [...new Set(data.map((item) => item.model))];
        setSuggestedModels(uniqueModels);
      } else {
        setSuggestedModels([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error.message);
      setSuggestedModels([]);
    }
  };

  const handleBrandSelect = (selectedBrand, isEdit = false) => {
    if (isEdit) {
      setEditCar({ ...editCar, brand: selectedBrand, model: '' });
    } else {
      setNewCar({ ...newCar, brand: selectedBrand, model: '' });
    }
    setSuggestedBrands([]);
    setSuggestedModels([]);
  };

  const handleModelSelect = (selectedModel, isEdit = false) => {
    if (isEdit) {
      setEditCar({ ...editCar, model: selectedModel });
    } else {
      setNewCar({ ...newCar, model: selectedModel });
    }
    setSuggestedModels([]);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setSuggestedBrands([]);
      setSuggestedModels([]);
    }, 200);
  };

  const handleNewCarChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCar((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'brand') fetchBrands(value);
    if (name === 'model' && newCar.brand) fetchModels(value, newCar.brand);
  };

  const handleEditCarChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditCar((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'brand') fetchBrands(value);
    if (name === 'model' && editCar.brand) fetchModels(value, editCar.brand);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation(); // Предотвращаем всплытие события клика
    setIsDropdownOpen((prev) => !prev); // Переключаем состояние дропдауна
  };

  const openAddCarModal = () => {
    setShowAddCarModal(true);
    setIsDropdownOpen(false); // Закрываем дропдаун при открытии модала
  };

  const closeAddCarModal = () => {
    setShowAddCarModal(false);
  };

  const openSettingsModal = () => {
    setShowSettingsModal(true);
    setIsDropdownOpen(false); // Закрываем дропдаун при открытии модала
  };

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
  };

  const handleEditModalOpen = () => {
    setShowEditCarModal(true);
    setShowSettingsModal(false); // Закрываем настройки при открытии редактирования
  };

  const closeEditCarModal = () => {
    setShowEditCarModal(false);
    setEditCar(null);
  };

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
        fetchCars();
        closeAddCarModal();
        setNewCar({
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
      }
    } catch (err) {
      console.error('Ошибка при добавлении автомобиля:', err);
    }
  };

  const handleGenerateQRCode = () => {
    if (!selectedCar) {
      console.error("❌ Нет выбранного автомобиля для генерации QR-кода");
      return;
    }
    setQrData(selectedCar.id);
    setShowQRCode(true);
    setIsDropdownOpen(false); // Закрываем дропдаун при открытии QR-кода
  };

  const handleScanSuccess = async (data) => {
    try {
      const carId = data.trim();
      if (!/^[0-9a-fA-F-]{36}$/.test(carId)) {
        console.error("❌ Некорректный формат carId:", carId);
        return;
      }

      const { data: existingCar, error: carCheckError } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .maybeSingle();

      if (carCheckError) {
        console.error("❌ Ошибка при проверке автомобиля:", carCheckError.message);
        return;
      }

      if (!existingCar) {
        console.error("❌ Автомобиль не найден");
        return;
      }

      const { error: carUpdateError } = await supabase
        .from("cars")
        .update({ user_id: user.id })
        .eq("id", carId);

      if (carUpdateError) {
        console.error("❌ Ошибка при обновлении владельца автомобиля:", carUpdateError);
        return;
      }

      const { error: repairsUpdateError } = await supabase
        .from("repairs")
        .update({ user_id: user.id })
        .eq("car_id", carId);

      if (repairsUpdateError) {
        console.error("❌ Ошибка при обновлении ремонтов:", repairsUpdateError);
        return;
      }

      const { error: maintenanceUpdateError } = await supabase
        .from("maintenance")
        .update({ user_id: user.id })
        .eq("car_id", carId);

      if (maintenanceUpdateError) {
        console.error("❌ Ошибка при обновлении записей ТО:", maintenanceUpdateError);
        return;
      }

      console.log("✅ Автомобиль, ремонты и записи ТО успешно переданы новому владельцу!");
      fetchCars();
      fetchRepairs(carId);
      fetchMaintenance(carId);
      setShowQRScanner(false);
      setIsDropdownOpen(false); // Закрываем дропдаун после успешного сканирования
    } catch (error) {
      console.error("❌ Ошибка при обработке данных из QR-кода:", error);
    }
  };

  const handleScanError = (error) => {
    console.error("❌ Ошибка сканирования QR-кода:", error);
  };

  const handleCarSelect = (carId) => {
    const selected = cars.find(c => c.id === carId);
    setEditCar(selected ? { ...selected } : null);
  };

  const updateCar = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .update({ ...editCar })
        .eq('id', editCar.id)
        .select('*')
        .single();

      if (error) {
        console.error('Ошибка при обновлении автомобиля:', error.message);
      } else {
        console.log('Автомобиль успешно обновлен:', data);
        fetchCars();
        closeEditCarModal();
      }
    } catch (err) {
      console.error('Ошибка при обновлении автомобиля:', err);
    }
  };

  const deleteCar = async () => {
    if (!window.confirm(t('confirmDeleteCar'))) return;

    try {
      await supabase
        .from('maintenance')
        .delete()
        .eq('car_id', editCar.id);

      await supabase
        .from('repairs')
        .delete()
        .eq('car_id', editCar.id);

      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', editCar.id);

      if (error) {
        console.error('Ошибка при удалении автомобиля:', error.message);
      } else {
        console.log('Автомобиль и связанные записи успешно удалены');
        fetchCars();
        closeEditCarModal();
      }
    } catch (err) {
      console.error('Ошибка при удалении автомобиля:', err);
    }
  };

  return (
    <header className="header">
      <div className={`burger-menu ${isDropdownOpen ? 'open' : ''}`} onClick={toggleDropdown}>
        <span className="burger-line"></span>
        <span className="burger-line"></span>
        <span className="burger-line"></span>
      </div>
      
      <img src={logo} alt="Car" className="logo-image" />

      {isDropdownOpen && (
        <div className="dropdown-menu" ref={dropdownRef}>
          <CarTracker user={user} car={car} supabase={supabase} setCar={setCar} />
          <button onClick={openSettingsModal}>{t('settings')}</button>
          <button onClick={handleGenerateQRCode}>{t('generateQRCode')}</button>
          <button onClick={() => { setShowQRScanner(true); setIsDropdownOpen(false); }}>{t('scanQRCode')}</button>
          <button onClick={handleLogout}>{t('logout')}</button>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal" onClick={closeSettingsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('settings')}</h3>
            <div className="settings-content">
              <div className="language-buttons">
                <span>{t('language')}: </span>
                <button 
                  className={i18n.language === 'en' ? 'active' : ''} 
                  onClick={() => i18n.changeLanguage('en')}
                >
                  🇬🇧
                </button>
                <button 
                  className={i18n.language === 'ru' ? 'active' : ''} 
                  onClick={() => i18n.changeLanguage('ru')}
                >
                  🇷🇺
                </button>
                <button 
                  className={i18n.language === 'uk' ? 'active' : ''} 
                  onClick={() => i18n.changeLanguage('uk')}
                >
                  🇺🇦
                </button>
              </div>
              <div className='settings-edit-btns'>
                <button onClick={handleEditModalOpen}>{t('editInfo')}</button>
                <button onClick={openAddCarModal}>{t('addCar')}</button>
              </div>
            </div>
            <button onClick={closeSettingsModal}>{t('close')}</button>
          </div>
        </div>
      )}

      {showAddCarModal && (
        <div className="modal" onClick={closeAddCarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('addCar')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); addNewCar(); }}>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="brand"
                  placeholder={t('brand')}
                  value={newCar.brand}
                  onChange={handleNewCarChange}
                  onBlur={handleBlur}
                  className="input-field"
                />
                {suggestedBrands.length > 0 && (
                  <ul className="suggestions">
                    {suggestedBrands.map((suggestion, index) => (
                      <li key={index} className="suggestion-item" onClick={() => handleBrandSelect(suggestion)}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="model"
                  placeholder={t('model')}
                  value={newCar.model}
                  onChange={handleNewCarChange}
                  onBlur={handleBlur}
                  className="input-field"
                  disabled={!newCar.brand}
                />
                {suggestedModels.length > 0 && (
                  <ul className="suggestions">
                    {suggestedModels.map((suggestion, index) => (
                      <li key={index} className="suggestion-item" onClick={() => handleModelSelect(suggestion)}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="number"
                name="year"
                placeholder={t('year')}
                value={newCar.year}
                onChange={handleNewCarChange}
                className="input-field"
              />
              <input
                type="text"
                name="engine"
                placeholder={t('engine')}
                value={newCar.engine}
                onChange={handleNewCarChange}
                className="input-field"
              />
              <input
                type="number"
                name="mileage"
                placeholder={t('mileage')}
                value={newCar.mileage}
                onChange={handleNewCarChange}
                className="input-field"
              />
              <input
                type="text"
                name="vin"
                placeholder={t('vin')}
                value={newCar.vin}
                onChange={handleNewCarChange}
                className="input-field"
              />
              <select
                name="fuelType"
                value={newCar.fuelType}
                onChange={handleNewCarChange}
                className="dropdown"
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
                className="dropdown"
              >
                <option value="">{t('selectTransmission')}</option>
                <option value="Manual">{t('manual')}</option>
                <option value="Automatic">{t('automatic')}</option>
                <option value="CVT">{t('cvt')}</option>
                <option value="Dual-clutch">{t('dualClutch')}</option>
              </select>
              <label className="checkbox-label">
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

      {showEditCarModal && (
        <div className="modal" onClick={closeEditCarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('editCar')}</h3>
            <select
              onChange={(e) => handleCarSelect(e.target.value)}
              value={editCar?.id || ''}
              className="dropdown"
            >
              <option value="">{t('selectCar')}</option>
              {cars && cars.length > 0 ? (
                cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} ({car.year})
                  </option>
                ))
              ) : (
                <option value="" disabled>{t('noCarsAvailable')}</option>
              )}
            </select>

            {editCar && (
              <form onSubmit={(e) => { e.preventDefault(); updateCar(); }}>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="brand"
                    placeholder={t('brand')}
                    value={editCar.brand}
                    onChange={handleEditCarChange}
                    onBlur={handleBlur}
                    className="input-field"
                  />
                  {suggestedBrands.length > 0 && (
                    <ul className="suggestions">
                      {suggestedBrands.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className="suggestion-item" 
                          onClick={() => handleBrandSelect(suggestion, true)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="model"
                    placeholder={t('model')}
                    value={editCar.model}
                    onChange={handleEditCarChange}
                    onBlur={handleBlur}
                    className="input-field"
                  />
                  {suggestedModels.length > 0 && (
                    <ul className="suggestions">
                      {suggestedModels.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className="suggestion-item" 
                          onClick={() => handleModelSelect(suggestion, true)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  type="number"
                  name="year"
                  placeholder={t('year')}
                  value={editCar.year}
                  onChange={handleEditCarChange}
                  className="input-field"
                />
                <input
                  type="text"
                  name="engine"
                  placeholder={t('engine')}
                  value={editCar.engine}
                  onChange={handleEditCarChange}
                  className="input-field"
                />
                <input
                  type="number"
                  name="mileage"
                  placeholder={t('mileage')}
                  value={editCar.mileage}
                  onChange={handleEditCarChange}
                  className="input-field"
                />
                <input
                  type="text"
                  name="vin"
                  placeholder={t('vin')}
                  value={editCar.vin}
                  onChange={handleEditCarChange}
                  className="input-field"
                />
                <select
                  name="fuelType"
                  value={editCar.fuelType}
                  onChange={handleEditCarChange}
                  className="dropdown"
                >
                  <option value="">{t('selectFuelType')}</option>
                  <option value="Petrol">{t('petrol')}</option>
                  <option value="Diesel">{t('diesel')}</option>
                  <option value="Electric">{t('electric')}</option>
                  <option value="Hybrid">{t('hybrid')}</option>
                </select>
                <select
                  name="transmissionType"
                  value={editCar.transmissionType}
                  onChange={handleEditCarChange}
                  className="dropdown"
                >
                  <option value="">{t('selectTransmission')}</option>
                  <option value="Manual">{t('manual')}</option>
                  <option value="Automatic">{t('automatic')}</option>
                  <option value="CVT">{t('cvt')}</option>
                  <option value="Dual-clutch">{t('dualClutch')}</option>
                </select>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="turbocharged"
                    checked={editCar.turbocharged}
                    onChange={handleEditCarChange}
                  />
                  {t('turbocharged')}
                </label>
                <div className="button-group">
                  <button type="submit">{t('save')}</button>
                  <button type="button" onClick={deleteCar} className="delete-button">
                    {t('delete')}
                  </button>
                  <button type="button" onClick={closeEditCarModal}>{t('cancel')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showQRCode && (
        <div className="qr-modal" onClick={() => setShowQRCode(false)}>
          <div className="qr-content" onClick={(e) => e.stopPropagation()}>
            <QRCodeSVG value={qrData} size={312} level="H" margin={20} />
            <button onClick={() => setShowQRCode(false)}>Close</button>
          </div>
        </div>
      )}

      {showQRScanner && (
        <div className="qr-scanner-modal" onClick={() => setShowQRScanner(false)}>
          <div className="qr-scanner-content" onClick={(e) => e.stopPropagation()}>
            <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
            <button onClick={() => setShowQRScanner(false)}>Close</button>
          </div>
        </div>
      )}
    </header>
  );
}