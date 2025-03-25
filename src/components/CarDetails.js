import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useTranslation } from "react-i18next";
import './CarDetails.css';
import logo_car from '../components/logo_car.png';
import imageCompression from 'browser-image-compression';

export default function CarDetails({ user, car, setCar }) {
  const { t } = useTranslation();
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
  const [carImage, setCarImage] = useState(logo_car);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    console.log("Car prop updated:", car);
    if (car && car.id) {
      fetchImage(car.id);
    } else {
      setCarImage(logo_car);
    }
  }, [car]);

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

  const fetchModels = async (input) => {
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

  const handleBrandSelect = (selectedBrand) => {
    setBrand(selectedBrand);
    setModel("");
    setSuggestedBrands([]);
    setSuggestedModels([]);
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

  const handleBrandChange = (e) => {
    const value = e.target.value;
    setBrand(value);
    fetchBrands(value);
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    setModel(value);
    if (brand) {
      fetchModels(value);
    } else {
      setSuggestedModels([]);
    }
  };

  const addCar = async () => {
    if (mileage && (isNaN(parseInt(mileage)) || parseInt(mileage) < 0)) {
      alert(t("mileageMustBeNonNegative"));
      return;
    }

    const newCar = {
      brand,
      model,
      year,
      engine,
      mileage: mileage ? parseInt(mileage) : null,
      vin,
      fuelType,
      transmissionType,
      turbocharged,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("cars")
      .insert([newCar])
      .select("*")
      .single();

    if (!error) {
      setCar(data);
    } else {
      console.error("Ошибка при добавлении автомобиля:", error.message);
    }
  };

  const fetchImage = async (carId) => {
    if (!carId) {
      setCarImage(logo_car);
      return;
    }

    const possibleExtensions = ['jpg', 'png', 'jpeg', 'webp'];
    let publicUrl = null;

    for (const ext of possibleExtensions) {
      const filePath = `${carId}/car_${carId}.${ext}`;
      const { data } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      try {
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          publicUrl = `${data.publicUrl}?v=${Date.now()}`;
          break;
        }
      } catch (fetchError) {
        console.log(`File at ${filePath} not accessible:`, fetchError.message);
      }
    }

    if (publicUrl) {
      setCarImage(publicUrl);
    } else {
      setCarImage(logo_car);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !car || !car.id) {
      console.error("Нет файла или car.id");
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
      console.error("Пользователь не авторизован:", authError?.message);
      alert("Пожалуйста, войдите в систему для загрузки изображения");
      return;
    }

    setIsUploading(true);
    try {
      const options = {
        maxSizeMB: 0.05,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.7,
      };

      console.log("Original file size:", (file.size / 1024).toFixed(2), "KB");
      const compressedFile = await imageCompression(file, options);
      console.log("Compressed file size:", (compressedFile.size / 1024).toFixed(2), "KB");

      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `car_${car.id}.${fileExt}`;
      const filePath = `${car.id}/${fileName}`;

      if (car.image_path) {
        const { error: removeError } = await supabase.storage
          .from('car-images')
          .remove([car.image_path]);
        if (removeError) {
          console.warn("Не удалось удалить старое изображение:", removeError.message);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error("Ошибка загрузки:", uploadError.message);
        throw uploadError;
      }

      const { data: updatedCar, error: updateError } = await supabase
        .from('cars')
        .update({ image_path: filePath })
        .eq('id', car.id)
        .select("*")
        .single();

      if (updateError) {
        console.error("Ошибка сохранения пути:", updateError.message);
        throw updateError;
      }

      const { data: urlData } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      const freshUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      setCar(updatedCar);
      setCarImage(freshUrl);
    } catch (error) {
      console.error("Ошибка при обработке изображения:", error.message);
      setCarImage(logo_car);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageError = () => {
    console.error("Image failed to load:", carImage);
    setCarImage(logo_car);
  };

  return car ? (
    <div className="car-details">
      <h3 className="car-title">{t('yourCar')}</h3>
      <div className="car-image-container">
        {isUploading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <label className="car-image-button">
            <img
              src={carImage}
              alt="Car"
              onError={handleImageError}
              className="car-image"
            />
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
      <div className="info">
        <button className="details-button" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? t('hideDetails') : t('showDetails')}
        </button>
        {showDetails && (
          <>
            <p className="car-text">{t('engine')}: {car.engine} L {car.turbocharged && <span className="turbo">({t('turbocharged')})</span>}</p>
            <p className="car-text">{t('vin')}: {car.vin}</p>
            <p className="car-text">{car.brand} {car.model} ({car.year})</p>
            <p className="car-text">{t('mileage')}: {car.mileage} {t('km')}</p>
            <p className="car-text">{t('fuelType')}: {t(car.fuelType)}</p>
            <p className="car-text">{t('transmission')}: {t(car.transmissionType)}</p>
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
        disabled={!brand}
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
      <input
        type="number"
        placeholder={t('year')}
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder={t('engine')}
        value={engine}
        onChange={(e) => setEngine(e.target.value)}
        className="input-field"
      />
      <input
        type="number"
        placeholder={t('mileage')}
        value={mileage}
        min="0"
        onChange={(e) => {
          const value = e.target.value;
          if (value === "" || (parseInt(value) >= 0 && !isNaN(parseInt(value)))) {
            setMileage(value);
          }
        }}
        className="input-field"
      />
      <input
        type="text"
        placeholder={t('vin')}
        value={vin}
        onChange={(e) => setVin(e.target.value)}
        className="input-field"
      />
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