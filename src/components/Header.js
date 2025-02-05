// Header.js
import React, { useState } from 'react';
import './Header.css'
import { supabase } from '../supabaseClient';

export default function Header({ user, handleLogout, openEditModal, fetchCars, fetchRepairs,fetchMaintenance }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const firstLetter = user?.email?.charAt(0).toUpperCase();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
const handleDownloadRepairs = async () => {
    try {
        // Загружаем данные о машине и ремонтах из Supabase
        const { data: car, error: carError } = await supabase.from("cars").select("*").single();
        const { data: repairs, error: repairsError } = await supabase.from("repairs").select("*");

        if (carError || repairsError) {
            console.error("Ошибка при загрузке данных:", carError || repairsError);
            return;
        }

        // Формируем объект с данными
        const exportData = {
            car,
            repairs,
        };

        // Преобразуем в JSON и создаем файл
        const fileData = JSON.stringify(exportData, null, 2);
        const blob = new Blob([fileData], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `repair_history_${car.vin || "car"}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Ошибка при скачивании файла:", error);
    }
};

const handleUploadRepairs = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileData = JSON.parse(e.target.result);

            console.log("📂 Данные из файла:", fileData);

            let newCarId;

            // 🟢 Проверяем, принадлежит ли авто текущему пользователю
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

            // 🟢 Создаем или обновляем машину
            await supabase
                .from("cars")
                .upsert([{ ...fileData.car, id: newCarId, user_id: user.id }]);

            // 🟢 Обновляем ремонты
            if (fileData.repairs) {
                const formattedRepairs = fileData.repairs.map(repair => ({
                    ...repair,
                    user_id: user.id,
                    car_id: newCarId,
                }));

                await supabase.from("repairs").insert(formattedRepairs);
            }

            console.log("✅ Данные загружены, обновляем UI...");
            fetchCars(); // 🆕 Загружаем список машин после загрузки файла
            fetchRepairs(newCarId); // 🆕 Загружаем ремонты

        };

        reader.readAsText(file);
    } catch (error) {
        console.error("❌ Ошибка при загрузке файла:", error);
    }
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
    <button onClick={handleDownloadRepairs}>Download car info</button>
    
    {/* Кастомная кнопка для загрузки файла */}
    <label htmlFor="file-upload" className="custom-file-upload">
        Upload car info
    </label>
    <input 
        id="file-upload" 
        type="file" 
        accept=".json" 
        onChange={handleUploadRepairs} 
        className="file-input"
    />
</div>
      )}
    </header>
  );
}
