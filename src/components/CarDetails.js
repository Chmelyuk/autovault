import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Подключаем настроенный клиент
import { useTranslation } from "react-i18next"; // Импортируем хук для перевода
import './CarDetails.css';
import logo_car from '../components/logo_car.png';

export default function CarDetails({ user, car, setCar }) {
  const { t } = useTranslation(); // Используем хук для перевода
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [mileage, setMileage] = useState("");
  const [vin, setVin] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmissionType, setTransmissionType] = useState("");
  const [suggestedBrands, setSuggestedBrands] = useState([]);
  const [suggestedModels, setSuggestedModels] = useState([]);
  const [turbocharged, setTurbocharged] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [carImage, setCarImage] = useState(
  car ? localStorage.getItem(`carImage_${car.id}`) || logo_car : logo_car
);

  // Функция для получения брендов
  const fetchBrands = async (input) => {
    const trimmedInput = input.trim();
    if (trimmedInput.length < 2) return;

    try {
      const { data, error } = await supabase
        .from("car_list")
        .select("brand")
        .ilike("brand", `%${trimmedInput}%`);

      if (error) throw error;

      if (data.length > 0) {
        const uniqueBrands = [...new Set(data.map((item) => item.brand))];
        setSuggestedBrands(uniqueBrands);
      }
    } catch (error) {
      console.error("Ошибка при загрузке брендов:", error.message);
    }
  };

  // Функция для получения моделей
  const fetchModels = async (input) => {
    const trimmedInput = input.trim();
    if (trimmedInput.length < 2) return;

    try {
      const { data, error } = await supabase
        .from("car_list")
        .select("model")
        .ilike("model", `%${trimmedInput}%`);

      if (error) throw error;

      if (data.length > 0) {
        const uniqueModels = [...new Set(data.map((item) => item.model))];
        setSuggestedModels(uniqueModels);
      }
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error.message);
    }
  };

  // Обработчики выбора
  const handleBrandSelect = (selectedBrand) => {
    setBrand(selectedBrand);
    setSuggestedBrands([]);
  };

  const handleModelSelect = (selectedModel) => {
    setModel(selectedModel);
    setSuggestedModels([]);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setSuggestedBrands([]);
      setSuggestedModels([]);
    }, 200);
  };

  // Обработчики ввода
  const handleBrandChange = (e) => {
    const value = e.target.value;
    setBrand(value);
    fetchBrands(value);
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    setModel(value);
    fetchModels(value);
  };

  // Функция для добавления машины
  const addCar = async () => {
    const newCar = { 
      brand, 
      model, 
      year, 
      engine, 
      mileage, 
      vin, 
      fuelType: fuelType,
      transmissionType: transmissionType,
      turbocharged,
      user_id: user.id 
    };

    const { data, error } = await supabase.from("cars").insert([newCar]).select("*").single();
    
    if (error) {
      console.error("Car insert error:", error.message);
    } else {
      setCar(data);
    }
  };
 const handleImageClick = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        localStorage.setItem(`carImage_${car.id}`, result); // ✅ Сохраняем с ID машины
        setCarImage(result);
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
};


useEffect(() => {
  if (car) {
    setCarImage(localStorage.getItem(`carImage_${car.id}`) || logo_car);
  }
}, [car]);

    return car ? (
    <div className="car-details">
      <h3 className="car-title">{t('yourCar')}</h3>
      <img
        src={carImage}
        alt="Car"
        onClick={handleImageClick}
        className="car-image"
      />
      <div className="info">
        <p className="car-text">{car.brand} {car.model} ({car.year})</p>
        <p className="car-text">{t('mileage')}: {car.mileage} {t('km')}</p>
        <p className="car-text">{t('fuelType')}: {t(car.fuelType)}</p>
        <p className="car-text">{t('transmission')}: {t(car.transmissionType)}</p>
        <button className="details-button" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? t('hideDetails') : t('showDetails')}
        </button>
        {showDetails && (
          <>
            <p className="car-text">{t('engine')}: {car.engine} L {car.turbocharged && <span className="turbo">({t('turbocharged')})</span>}</p>
            <p className="car-text">{t('vin')}: {car.vin}</p>
          </>
        )}
      </div>
    </div>
  ) : (
    <div className="add-car-form">
      <p className="no-car-message">{t('noCarMessage')}</p>
      <input 
        type="text" 
        placeholder={t('brand')} 
        value={brand} 
        onChange={handleBrandChange} 
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
      <input 
        type="text" 
        placeholder={t('model')} 
        value={model} 
        onChange={handleModelChange} 
        onBlur={handleBlur} 
        className="input-field"
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
      <input type="number" placeholder={t('year')} value={year} onChange={(e) => setYear(e.target.value)} className="input-field" />
      <input type="text" placeholder={t('engine')} value={engine} onChange={(e) => setEngine(e.target.value)} className="input-field" />
      <input type="number" placeholder={t('mileage')} value={mileage} onChange={(e) => setMileage(e.target.value)} className="input-field" />
      <input type="text" placeholder={t('vin')} value={vin} onChange={(e) => setVin(e.target.value)} className="input-field" />
      <label className="turbo-checkbox">
        <input
          type="checkbox"
          checked={turbocharged}
          onChange={(e) => setTurbocharged(e.target.checked)}
          className="checkbox"
        />
        {t('turbocharged')}
      </label>
      <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="dropdown">
        <option value="">{t('selectFuelType')}</option>
        <option value="Petrol">{t('petrol')}</option>
        <option value="Diesel">{t('diesel')}</option>
        <option value="Electric">{t('electric')}</option>
        <option value="Hybrid">{t('hybrid')}</option>
      </select>
      <select value={transmissionType} onChange={(e) => setTransmissionType(e.target.value)} className="dropdown">
        <option value="">{t('selectTransmission')}</option>
        <option value="Manual">{t('manual')}</option>
        <option value="Automatic">{t('automatic')}</option>
        <option value="CVT">{t('cvt')}</option>
        <option value="Dual-clutch">{t('dualClutch')}</option>
      </select>
      <button onClick={addCar} className="submit-button">{t('addCar')}</button>
    </div>
  );
}