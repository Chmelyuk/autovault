import React, { useState } from 'react';
import './Header.css';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from './QRScanner'; // Импортируем компонент сканера

export default function Header({ user, handleLogout, openEditModal, fetchCars, fetchRepairs, fetchMaintenance }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const firstLetter = user?.email?.charAt(0).toUpperCase();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDownloadRepairs = async () => {
    try {
      // Загружаем данные о машинах
      const { data: cars, error: carError } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id); // Фильтр по пользователю

      if (carError) {
        console.error("Ошибка при загрузке данных о машинах:", carError);
        return;
      }

      if (cars.length === 0) {
        console.error("Машины не найдены");
        return;
      }

      const car = cars[0]; // Выбираем первую машину из списка

      // Загружаем данные о ремонтах
      const { data: repairs, error: repairsError } = await supabase
        .from("repairs")
        .select("*")
        .eq("car_id", car.id); // Фильтр по машине

      if (repairsError) {
        console.error("Ошибка при загрузке данных о ремонтах:", repairsError);
        return;
      }

      // Формируем данные для QR-кода
      const exportData = {
        car,
        repairs,
      };

      setQrData(JSON.stringify(exportData));
      setShowQRCode(true);
    } catch (error) {
      console.error("Ошибка при формировании QR-кода:", error);
    }
  };

  const handleScanSuccess = async (data) => {
  try {
    // Парсим данные из QR-кода
    const fileData = JSON.parse(data);

    console.log("📂 Данные из QR-кода:", fileData);

    let newCarId;

    // Проверяем, существует ли машина с таким VIN
    const { data: existingCar, error: carCheckError } = await supabase
      .from("cars")
      .select("id, user_id")
      .eq("vin", fileData.car.vin)
      .maybeSingle();

    if (carCheckError) {
      console.error("❌ Ошибка при проверке VIN:", carCheckError.message);
      return;
    }

    if (existingCar) {
      if (existingCar.user_id === user.id) {
        console.log("✅ Обновляем существующую машину");
        newCarId = existingCar.id;
      } else {
        console.warn("⚠️ VIN уже у другого пользователя. Создаем копию.");
        newCarId = crypto.randomUUID();
        fileData.car.vin = `NEW-${fileData.car.vin}`;
      }
    } else {
      newCarId = crypto.randomUUID();
      console.log("🚗 Создаем новый автомобиль с ID:", newCarId);
    }

    // Создаем или обновляем машину
    const { error: carUpsertError } = await supabase
      .from("cars")
      .upsert([{ ...fileData.car, id: newCarId, user_id: user.id }]);

    if (carUpsertError) {
      console.error("❌ Ошибка при обновлении машины:", carUpsertError);
      return;
    }

    // Обновляем ремонты
    if (fileData.repairs) {
      const formattedRepairs = fileData.repairs.map(repair => ({
        ...repair,
        user_id: user.id,
        car_id: newCarId,
      }));

      const { error: repairsInsertError } = await supabase
        .from("repairs")
        .insert(formattedRepairs);

      if (repairsInsertError) {
        console.error("❌ Ошибка при добавлении ремонтов:", repairsInsertError);
        return;
      }
    }

    console.log("✅ Данные загружены, обновляем UI...");
    fetchCars(); // Обновляем список машин
    fetchRepairs(newCarId); // Обновляем список ремонтов

    setShowQRScanner(false); // Закрываем сканер
  } catch (error) {
    console.error("❌ Ошибка при обработке данных из QR-кода:", error);
  }
};
  const handleScanError = (error) => {
    console.error("Ошибка при сканировании QR-кода:", error);
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
          <button onClick={handleDownloadRepairs}>Generate QR Code</button>
          <button onClick={() => setShowQRScanner(true)}>Scan QR Code</button>
        </div>
      )}

      {showQRCode && (
        <div className="qr-modal">
          <div className="qr-content">
            <QRCodeSVG value={qrData} />
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