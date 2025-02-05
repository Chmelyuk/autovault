// CarDetails.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Подключаем настроенный клиент
 

export default function CarDetails({ user, car, setCar }) {
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

  return car ? (
    <div className="car-details">
  <img src="/logo_car.png" alt="Car" />
  <div className="info">
    <h3>Your Car</h3>
    <p>{car.brand} {car.model} ({car.year})</p>
    <p>Engine: {car.engine} {car.turbocharged && <span className="turbo">(Turbocharged)</span>}</p>
    <p>Mileage: {car.mileage} km</p>
    <p>Fuel Type: {car.fuelType}</p>
    <p>Transmission: {car.transmissionType}</p>
    <p>VIN: {car.vin}</p>
  </div>
</div>
  ) : (
    <div>
      <p>You have not added a car yet.</p>

      {/* Поле ввода бренда */}
      <input 
        type="text" 
        placeholder="Brand" 
        value={brand} 
        onChange={handleBrandChange} 
        onBlur={handleBlur} 
      />
      {suggestedBrands.length > 0 && (
        <ul>
          {suggestedBrands.map((suggestion, index) => (
            <li key={index} onClick={() => handleBrandSelect(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      {/* Поле ввода модели */}
      <input 
        type="text" 
        placeholder="Model" 
        value={model} 
        onChange={handleModelChange} 
        onBlur={handleBlur} 
      />
      {suggestedModels.length > 0 && (
        <ul>
          {suggestedModels.map((suggestion, index) => (
            <li key={index} onClick={() => handleModelSelect(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      <input type="number" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
      <input type="text" placeholder="Engine" value={engine} onChange={(e) => setEngine(e.target.value)} />
      <input type="number" placeholder="Mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} />
      <input type="text" placeholder="VIN" value={vin} onChange={(e) => setVin(e.target.value)} />
<label>
  <input
    placeholder="Turbocharged"
    type="checkbox"
    checked={turbocharged}
    onChange={(e) => setTurbocharged(e.target.checked)}
  />
  
</label>

      {/* Поле выбора типа топлива */}
      <select value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
        <option value="">Select Fuel Type</option>
        <option value="Petrol">Petrol</option>
        <option value="Diesel">Diesel</option>
        <option value="Electric">Electric</option>
        <option value="Hybrid">Hybrid</option>
      </select>

      <select value={transmissionType} onChange={(e) => setTransmissionType(e.target.value)}>
        <option value="">Select Transmission</option>
        <option value="Manual">Manual</option>
        <option value="Automatic">Automatic</option>
        <option value="CVT">CVT</option>
        <option value="Dual-clutch">Dual-clutch</option>
      </select>

      <button onClick={addCar}>Add Car</button>
    </div>
  );
}
