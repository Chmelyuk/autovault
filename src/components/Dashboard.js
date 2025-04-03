import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './Header';
import CarDetails from './CarDetails';
import ProgressBar from './ProgressBar';
import banner from '../components/banner.jpg';
import { useTranslation } from 'react-i18next';
import './Dashboard.css';
import CircularProgressBar from './CircularProgressBar';

export default function Dashboard({ user, supabase, handleLogout, isDarkTheme = true }) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState("tile");
  const [repairDate, setRepairDate] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [repairCategories, setRepairCategories] = useState([]);
  const [repairSubcategories, setRepairSubcategories] = useState([]);
  const [cars, setCars] = useState([]);
  const [repairSubcategory, setRepairSubcategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [repairMileage, setRepairMileage] = useState("");
  const [editMaintenance, setEditMaintenance] = useState(null);
  const [isEditMaintenanceModalOpen, setIsEditMaintenanceModalOpen] = useState(false);
  const [isEditRepairModalOpen, setIsEditRepairModalOpen] = useState(false);
  const [editRepair, setEditRepair] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false); // Новое состояние для страховки
  const [repairCategory, setRepairCategory] = useState("");
  const [repairDescription, setRepairDescription] = useState("");
  const [maintenance, setMaintenance] = useState({
    oilChange: false,
    airFilterChange: false,
    oilFilterChange: false,
    brakeCheck: false,
    tireRotation: false,
    coolantFlush: false,
    oilChangeMileage: "",
    allSelected: false
  });
  const [insuranceCompany, setInsuranceCompany] = useState(""); // Новое состояние для названия страховой
  const [insuranceDate, setInsuranceDate] = useState(""); // Новое состояние для даты договора
  const [insuranceRecords, setInsuranceRecords] = useState([]); // Новое состояние для записей о страховке
  const [showWarning, setShowWarning] = useState(true);
  const [sortMode, setSortMode] = useState("dateDesc");
  const [car, setCar] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState(() => {
    return localStorage.getItem('selectedCarId') || null;
  });
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsSelectorOpen(false);
      }
    };

    if (isSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelectorOpen]);

  const isAnyMaintenanceSelected = () => {
    return (
      maintenance.oilChange ||
      maintenance.airFilterChange ||
      maintenance.oilFilterChange ||
      maintenance.brakeCheck ||
      maintenance.tireRotation ||
      maintenance.coolantFlush
    );
  };

  const handleCustomCarSelection = async (carId) => {
    const selected = cars.find(c => c.id === carId) || null;
    setSelectedCarId(carId);
    setCar(selected);
    setIsSelectorOpen(false);
    if (selected) {
      localStorage.setItem('selectedCarId', selected.id);
      await Promise.all([fetchRepairs(selected.id), fetchMaintenance(selected.id), fetchInsurance(selected.id)]);
    } else {
      localStorage.removeItem('selectedCarId');
    }
  };

  const fetchRepairs = useCallback(async (carId) => {
    if (!carId) return;
    const { data, error } = await supabase
      .from("repairs")
      .select(`
        id, 
        category, 
        subcategory, 
        description, 
        mileage, 
        date, 
        addbyservice, 
        service_id, 
        user_id, 
        car_id, 
        profiles:service_id (service_name)
      `)
      .eq("car_id", carId)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Ошибка при загрузке ремонтов:", error.message);
      setRepairs([]);
      return;
    }

    const repairsWithServiceNames = data.map(repair => ({
      ...repair,
      serviceName: repair.profiles?.service_name || "Unknown",
    }));
    setRepairs(repairsWithServiceNames || []);
  }, [supabase, user]);

  const fetchMaintenance = useCallback(async (carId) => {
    if (!carId) return;
    const { data, error } = await supabase
      .from("maintenance")
      .select(`
        id, 
        oil_change, 
        oil_change_mileage, 
        oil_change_date, 
        air_filter_change, 
        oil_filter_change, 
        brake_check, 
        tire_rotation, 
        coolant_flush, 
        addbyservice, 
        service_id, 
        user_id, 
        car_id, 
        profiles:service_id (service_name)
      `)
      .eq("car_id", carId);

    if (error) {
      console.error("❌ Ошибка при загрузке ТО:", error.message);
      setMaintenanceRecords([]);
      return;
    }

    const maintenanceWithServiceNames = data.map(maint => ({
      ...maint,
      serviceName: maint.profiles?.service_name || "Unknown",
    }));
    setMaintenanceRecords(maintenanceWithServiceNames || []);
  }, [supabase, user]);

  const fetchInsurance = useCallback(async (carId) => {
    if (!carId) return;
    const { data, error } = await supabase
      .from("insurance")
      .select("*")
      .eq("car_id", carId)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Ошибка при загрузке страховок:", error.message);
      setInsuranceRecords([]);
      return;
    }

    setInsuranceRecords(data || []);
  }, [supabase, user]);

  const fetchRepairCategories = useCallback(async () => {
  if (repairCategories.length > 0) return;
  const { data, error } = await supabase.from("repair_categories").select("id, name");
  if (error) {
    console.error("Ошибка при загрузке категорий:", error.message);
  } else {
    console.log("Raw repairCategories:", data); // Отладка
    setRepairCategories(data || []);
  }
}, [supabase, repairCategories.length]);

  const fetchCars = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Ошибка при загрузке машин:", error.message);
      setCars([]);
      setCar(null);
      setSelectedCarId(null);
      localStorage.removeItem('selectedCarId');
    } else {
      setCars(data || []);
      const savedCarId = localStorage.getItem('selectedCarId');
      let selectedCar = null;

      if (savedCarId) {
        selectedCar = data.find(c => c.id === savedCarId);
      }
      if (!selectedCar && data.length > 0) {
        selectedCar = data[0];
      }

      if (selectedCar) {
        setCar(selectedCar);
        setSelectedCarId(selectedCar.id);
        localStorage.setItem('selectedCarId', selectedCar.id);
        await Promise.all([fetchRepairs(selectedCar.id), fetchMaintenance(selectedCar.id), fetchInsurance(selectedCar.id)]);
      } else {
        setCar(null);
        setSelectedCarId(null);
        localStorage.removeItem('selectedCarId');
      }
    }
  }, [user, supabase, fetchRepairs, fetchMaintenance, fetchInsurance]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      await fetchCars();
      await fetchRepairCategories();
    };
    fetchInitialData();
  }, [user, fetchCars, fetchRepairCategories]);

  const toggleViewMode = () => {
    setViewMode(viewMode === "tile" ? "list" : "tile");
  };

  const fetchRepairSubcategories = async (categoryId) => {
  if (!categoryId || categoryId === "other") return;
  const { data, error } = await supabase
    .from("repair_subcategories")
    .select("*")
    .eq("category_id", categoryId);

  if (error) {
    console.error("Ошибка при загрузке подкатегорий:", error.message);
  } else {
    console.log("Raw repairSubcategories:", data); // Отладка
    setRepairSubcategories(data || []);
  }
};

  const updateCarMileage = async (newMileage) => {
    if (!car || !newMileage || newMileage <= car.mileage) return;
    const { data, error } = await supabase
      .from("cars")
      .update({ mileage: newMileage })
      .eq("id", car.id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Ошибка обновления пробега:", error.message);
    } else {
      setCar(data);
      setCars(prev => prev.map(c => c.id === data.id ? data : c));
    }
  };

  const addRepair = async () => {
  if (!car || !repairCategory) {
    alert(t("fillRequiredFields"));
    return;
  }

  if (repairMileage && (isNaN(parseInt(repairMileage)) || parseInt(repairMileage) < 0)) {
    alert(t("mileageMustBeNonNegative"));
    return;
  }

  console.log("repairCategory:", repairCategory); // Отладка
  const selectedCategory = repairCategories.find(cat => String(cat.id) === String(repairCategory));
  const categoryName = repairCategory === "other"
    ? customCategory || "Other"
    : selectedCategory ? selectedCategory.name : "Other";
  console.log("categoryName:", categoryName); // Отладка

  console.log("repairSubcategory:", repairSubcategory); // Отладка
  const selectedSubcategory = repairSubcategories.find(sub => String(sub.id) === String(repairSubcategory));
  const subcategoryName = repairSubcategory === "other"
    ? customCategory
    : selectedSubcategory ? selectedSubcategory.name : null;
  console.log("subcategoryName:", subcategoryName); // Отладка

  const today = new Date().toISOString().split("T")[0];
  const formattedDate = repairDate || today;

  const { data, error } = await supabase.from("repairs").insert([{
    user_id: user.id,
    car_id: car.id,
    category: categoryName,
    subcategory: subcategoryName || null,
    description: repairDescription || null,
    mileage: repairMileage ? parseInt(repairMileage) : null,
    date: formattedDate,
  }]).select("*");

  if (error) {
    console.error("Ошибка при добавлении ремонта:", error.message);
  } else {
    console.log("Записанные данные:", data); // Отладка
    setRepairs(prev => [...prev, ...data]);
    setIsRepairModalOpen(false);
    setRepairCategory("");
    setRepairSubcategory("");
    setCustomCategory("");
    setRepairDescription("");
    setRepairMileage("");
    setRepairDate("");
    if (repairMileage && parseInt(repairMileage) > car.mileage) updateCarMileage(parseInt(repairMileage));
  }
};

  const addMaintenance = async () => {
    if (!car) return;

    if (!isAnyMaintenanceSelected()) {
      alert(t("selectAtLeastOneMaintenance"));
      return;
    }

    if (maintenance.oilChange) {
      if (!maintenance.oilChangeMileage || (isNaN(parseInt(maintenance.oilChangeMileage)) || parseInt(maintenance.oilChangeMileage) < 0)) {
        alert(t("oilChangeMileageMustBeNonNegative"));
        return;
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const formattedDate = maintenanceDate || today;

    const { data, error } = await supabase.from("maintenance").insert([{
      user_id: user.id,
      car_id: car.id,
      oil_change: maintenance.oilChange,
      oil_change_mileage: maintenance.oilChange ? parseInt(maintenance.oilChangeMileage) : null,
      oil_change_date: formattedDate,
      air_filter_change: maintenance.airFilterChange,
      oil_filter_change: maintenance.oilFilterChange,
      brake_check: maintenance.brakeCheck,
      tire_rotation: maintenance.tireRotation,
      coolant_flush: maintenance.coolantFlush,
    }]).select("*");

    if (error) {
      console.error("Ошибка при добавлении ТО:", error.message);
    } else {
      setMaintenanceRecords(prev => [...prev, ...data]);
      setIsMaintenanceModalOpen(false);
      setMaintenance({
        oilChange: false,
        airFilterChange: false,
        oilFilterChange: false,
        brakeCheck: false,
        tireRotation: false,
        coolantFlush: false,
        oilChangeMileage: "",
        allSelected: false
      });
      setMaintenanceDate("");
      if (maintenance.oilChange && maintenance.oilChangeMileage && parseInt(maintenance.oilChangeMileage) > car.mileage) {
        updateCarMileage(parseInt(maintenance.oilChangeMileage));
      }
    }
  };

 const addInsurance = async () => {
  if (!car || !insuranceCompany || !insuranceDate) {
    alert(t("fillRequiredFields"));
    return;
  }

  const contractDateObj = new Date(insuranceDate);
  const expirationDate = new Date(contractDateObj);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1); // Страховка действует 1 год

  const { data, error } = await supabase.from("insurance").insert([{
    user_id: user.id,
    car_id: car.id,
    insurance_company: insuranceCompany,
    contract_date: insuranceDate,
    expiration_date: expirationDate.toISOString().split("T")[0], // Сохраняем в формате YYYY-MM-DD
  }]).select("*");

  if (error) {
    console.error("Ошибка при добавлении страховки:", error.message);
  } else {
    setInsuranceRecords(prev => [...prev, ...data]);
    setIsInsuranceModalOpen(false);
    setInsuranceCompany("");
    setInsuranceDate("");
  }
};
  const updateMaintenance = async () => {
    if (!editMaintenance || !editMaintenance.id) return;
    const formattedDate = editMaintenance.oil_change_date || null;
    const { data, error } = await supabase
      .from("maintenance")
      .update({
        oil_change: editMaintenance.oil_change,
        air_filter_change: editMaintenance.air_filter_change,
        oil_filter_change: editMaintenance.oil_filter_change,
        brake_check: editMaintenance.brake_check,
        tire_rotation: editMaintenance.tire_rotation,
        coolant_flush: editMaintenance.coolant_flush,
        oil_change_mileage: editMaintenance.oil_change ? (editMaintenance.oil_change_mileage || null) : null,
        oil_change_date: formattedDate,
      })
      .eq("id", editMaintenance.id)
      .select("*")
      .single();

    if (error) {
      console.error("Ошибка при обновлении ТО:", error.message);
    } else {
      setMaintenanceRecords(prev => prev.map(m => m.id === data.id ? data : m));
      setIsEditMaintenanceModalOpen(false);
      setEditMaintenance(null);
    }
  };

  const updateRepair = async () => {
    if (!editRepair || !editRepair.id || !editRepair.category) {
      alert(t("fillRequiredFields"));
      return;
    }
    const formattedDate = editRepair.date || null;
    const { data, error } = await supabase
      .from("repairs")
      .update({
        category: editRepair.category,
        subcategory: editRepair.subcategory || null,
        description: editRepair.description || null,
        mileage: editRepair.mileage ? parseInt(editRepair.mileage) : null,
        date: formattedDate,
      })
      .eq("id", editRepair.id)
      .select("*")
      .single();

    if (error) {
      console.error("Ошибка при обновлении ремонта:", error.message);
    } else {
      setRepairs(prev => prev.map(r => r.id === data.id ? data : r));
      setIsEditRepairModalOpen(false);
      if (editRepair.mileage && parseInt(editRepair.mileage) > car.mileage) updateCarMileage(parseInt(editRepair.mileage));
    }
  };

  const deleteRepair = async (repairId) => {
    if (!window.confirm(t("confirmDelete"))) return;
    const { error } = await supabase.from("repairs").delete().eq("id", repairId);
    if (error) {
      console.error("Ошибка при удалении ремонта:", error.message);
    } else {
      setRepairs(prev => prev.filter(r => r.id !== repairId));
    }
  };

  const deleteMaintenance = async (maintenanceId) => {
    if (!window.confirm(t("confirmDelete"))) return;
    const { error } = await supabase.from("maintenance").delete().eq("id", maintenanceId);
    if (error) {
      console.error("Ошибка при удалении ТО:", error.message);
    } else {
      setMaintenanceRecords(prev => prev.filter(m => m.id !== maintenanceId));
    }
  };

  const calculateRemainingMileage = (car, records) => {
    if (!car) return 0;
    const lastOilChange = records
      .filter(r => r.oil_change && r.oil_change_mileage)
      .sort((a, b) => b.oil_change_mileage - a.oil_change_mileage)[0];
    if (!lastOilChange) return 0;
    const interval = calculateTotalMileageInterval(car);
    return Math.max((lastOilChange.oil_change_mileage + interval) - car.mileage, 0);
  };

  const calculateTotalMileageInterval = (car) => {
    if (!car) return 0;
    const baseIntervals = { Petrol: 10000, Diesel: 8000, Hybrid: 12000, Electric: null };
    let interval = baseIntervals[car.fuelType] || 10000;
    if (!interval) return 0;
    if (car.mileage > 200000) interval *= 0.8;
    else if (car.mileage > 100000) interval *= 0.9;
    switch (car.oilType) {
      case "Semi-Synthetic": interval *= 0.85; break;
      case "Mineral": interval *= 0.75; break;
      default: break;
    }
    return Math.round(interval / 500) * 500;
  };

  const getSortedRecords = () => {
    const combinedRecords = [...repairs, ...maintenanceRecords];
    switch (sortMode) {
      case "dateAsc":
        return combinedRecords.sort((a, b) => new Date(a.date || a.oil_change_date || 0) - new Date(b.date || b.oil_change_date || 0));
      case "dateDesc":
        return combinedRecords.sort((a, b) => new Date(b.date || b.oil_change_date || 0) - new Date(a.date || a.oil_change_date || 0));
      case "repairsFirst":
        return combinedRecords.sort((a, b) => {
          if (a.category && !b.category) return -1;
          if (!a.category && b.category) return 1;
          return new Date(b.date || b.oil_change_date || 0) - new Date(a.date || a.oil_change_date || 0);
        });
      case "maintenanceFirst":
        return combinedRecords.sort((a, b) => {
          if (!a.category && b.category) return -1;
          if (a.category && !b.category) return 1;
          return new Date(b.date || b.oil_change_date || 0) - new Date(a.date || a.oil_change_date || 0);
        });
      default:
        return combinedRecords;
    }
  };

  const handleCarSelection = async (e) => {
    const newSelectedCarId = e.target.value;
    const selected = cars.find(c => c.id === newSelectedCarId) || null;
    setSelectedCarId(newSelectedCarId);
    setCar(selected);
    if (selected) {
      localStorage.setItem('selectedCarId', selected.id);
      await Promise.all([fetchRepairs(selected.id), fetchMaintenance(selected.id), fetchInsurance(selected.id)]);
    } else {
      localStorage.removeItem('selectedCarId');
    }
  };
const handleInsuranceDelete = (deletedInsuranceId) => {
  setInsuranceRecords((prevRecords) =>
    prevRecords.filter((record) => record.id !== deletedInsuranceId)
  );
};
  return (
    <>
     <Header
  fetchCars={fetchCars}
  handleLogout={handleLogout}
  user={user}
  fetchRepairs={fetchRepairs}
  fetchMaintenance={fetchMaintenance}
  fetchInsurance={fetchInsurance}  
  selectedCar={car}
  cars={cars}
/>

      <div className="dashboard">
        <div className="custom-selector-wrapper">
          <div
            className="custom-selector-selected"
            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
          >
            <span>
              {selectedCarId
                ? `${cars.find(c => c.id === selectedCarId)?.brand} ${cars.find(c => c.id === selectedCarId)?.model} (${cars.find(c => c.id === selectedCarId)?.year})`
                : t('selectCar')}
            </span>
            <span className={`arrow ${isSelectorOpen ? 'open' : ''}`}>&#9660;</span>
          </div>
          {isSelectorOpen && (
            <ul className="custom-selector-options">
              {cars.length === 0 ? (
                <li className="no-options">{t('noCarsAvailable')}</li>
              ) : (
                cars.map(c => (
                  <li
                    key={c.id}
                    className={`option ${selectedCarId === c.id ? 'selected' : ''}`}
                    onClick={() => handleCustomCarSelection(c.id)}
                  >
                    {c.brand} {c.model} ({c.year})
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <CarDetails
          user={user}
          supabase={supabase}
          car={car}
          setCar={setCar}
          insuranceRecords={insuranceRecords} 
          onInsuranceDelete={handleInsuranceDelete}
        />

        <div className="car-details-container">
          {car && maintenanceRecords.length > 0 ? (
            <div className="oil-change-section">
              <strong className="oil-change">{t('oilChange')}:</strong>
              <ProgressBar progress={calculateRemainingMileage(car, maintenanceRecords)} total={calculateTotalMileageInterval(car)} />
            </div>
          ) : (
            car && <p>{t('noMaintenanceData')}</p>
          )}
        </div>

        <div className="action-buttons">
          <div>
          <button className="add-button" onClick={() => setIsRepairModalOpen(true)}>{t('addRepair')}</button>
          <button className="add-button" onClick={() => setIsMaintenanceModalOpen(true)}>{t('addMaintenance')}</button>
          </div>
          <button className="add-button" onClick={() => setIsInsuranceModalOpen(true)}>{t('addInsurance')}</button>
        </div>

        <div className="sort-selector">
          <h3>{t('repairHistory')}</h3>
        </div>
        <div className='view'>
          <div>
            <label>{t("sortBy")}:</label>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
              <option value="dateAsc">{t("dateOldToNew")}</option>
              <option value="dateDesc">{t("dateNewToOld")}</option>
              <option value="repairsFirst">{t("repairsThenMaintenance")}</option>
              <option value="maintenanceFirst">{t("maintenanceThenRepairs")}</option>
            </select>
          </div>
          <div className='view-text'>
            <h3>{t('view')}</h3>
            <select onChange={toggleViewMode} value={viewMode}>
              <option value="tile">{t('tileView')}</option>
              <option value="list">{t('listView')}</option>
            </select>
          </div>
        </div>

        <div className={`repair-history ${viewMode}`}>
          <ul>
            {getSortedRecords().length > 0 ? (
              getSortedRecords().map(record => (
                <li key={record.category ? `repair-${record.id}` : `maintenance-${record.id}`}>
                  {record.category ? (
                    <>
                      <div className="record-group">
                        <strong className='repair-icon'>{t(record.category)}</strong>
                        {record.subcategory && <p>{t('subcategory')}: {t(record.subcategory)}</p>}
                        {record.description && <p>{record.description}</p>}
                        {record.mileage && <p>{t('mileageAtRepair')}: {record.mileage} км</p>}
                        {record.date && <p key="date" className="date-with-icon">{t('date')}: {new Date(record.date).toLocaleDateString()}</p>}
                      </div>
                      {record.addbyservice && (
                        <p className="added-by-service">
                          {t('addedByService')} {record.serviceName && `(${record.serviceName})`}
                        </p>
                      )}
                      <div className="button-container">
                        <button onClick={() => { setEditRepair(record); setIsEditRepairModalOpen(true); }}>{t('edit')}</button>
                        <button onClick={() => deleteRepair(record.id)}>{t('delete')}</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="record-group">
                        {(() => {
                          const workTypes = [];
                          if (record.oil_change) {
                            workTypes.push(
                              <p key="oil_change" className="work-type oil-change">
                                {t('oilChange')}
                                {record.oil_change_mileage ? ` ${t('at')} ${record.oil_change_mileage} км` : ''}
                              </p>
                            );
                          }
                          if (record.air_filter_change) workTypes.push(
                            <p key="air_filter_change" className="work-type air-filter-change">{t('airFilterChange')}</p>
                          );
                          if (record.oil_filter_change) workTypes.push(
                            <p key="oil_filter_change" className="work-type oil-filter-change">{t('oilFilterChange')}</p>
                          );
                          if (record.brake_check) workTypes.push(
                            <p key="brake_check" className="work-type brake-check">{t('brakeCheck')}</p>
                          );
                          if (record.tire_rotation) workTypes.push(
                            <p key="tire_rotation" className="work-type tire-rotation">{t('tireRotation')}</p>
                          );
                          if (record.coolant_flush) workTypes.push(
                            <p key="coolant_flush" className="work-type coolant-flush">{t('coolantFlush')}</p>
                          );

                          if (record.oil_change_date) {
                            workTypes.push(
                              <p key="date" className="date-with-icon">{t('date')}: {new Date(record.oil_change_date).toLocaleDateString()}</p>
                            );
                          }

                          return workTypes.length > 0 ? workTypes : <p>🔧 {t('noMaintenanceSelected')}</p>;
                        })()}
                      </div>
                      {record.addbyservice && (
                        <p className="added-by-service">
                          {t('addedByService')} {record.serviceName && `(${record.serviceName})`}
                        </p>
                      )}
                      {record.oil_change && record.oil_change_mileage && (
                        <div className={`circular-progress-wrapper ${
                          (calculateRemainingMileage(car, maintenanceRecords) / calculateTotalMileageInterval(car)) * 100 < 30
                            ? 'low'
                            : (calculateRemainingMileage(car, maintenanceRecords) / calculateTotalMileageInterval(car)) * 100 < 60
                            ? 'medium'
                            : ''
                        }`}>
                          <CircularProgressBar progress={calculateRemainingMileage(car, maintenanceRecords)} total={calculateTotalMileageInterval(car)} />
                        </div>
                      )}
                      <div className="button-container">
                        <button onClick={() => { setEditMaintenance({ ...record, allSelected: false }); setIsEditMaintenanceModalOpen(true); }}>{t('edit')}</button>
                        <button onClick={() => deleteMaintenance(record.id)}>{t('delete')}</button>
                      </div>
                      {calculateRemainingMileage(car, maintenanceRecords) < 2000 && showWarning && (
                        <div className="oil-warning">
                          <a href="https://dok.ua" target="_blank" rel="noopener noreferrer">
                            <img src={banner} alt={t('oilChangeWarning')} />
                          </a>
                          <button className="close-button" onClick={() => setShowWarning(false)}>×</button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))
            ) : (
              <p>{t('noRepairData')}</p>
            )}
          </ul>
        </div>
      </div>

      {isRepairModalOpen && (
        <div className="modal" onClick={() => setIsRepairModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('addRepair')}</h3>
            <select value={repairCategory} onChange={(e) => { setRepairCategory(e.target.value); fetchRepairSubcategories(e.target.value); }}>
  <option value="">{t('selectCategory')}</option>
  {repairCategories.map(cat => (
    <option key={cat.id} value={cat.id}>{t(cat.name)}</option>
  ))}
  <option value="other">{t('other')}</option>
</select>
            {repairCategory && repairCategory !== "other" && (
              <select value={repairSubcategory} onChange={(e) => setRepairSubcategory(e.target.value)}>
  <option value="">{t('selectSubcategory')}</option>
  {repairSubcategories.map(sub => (
    <option key={sub.id} value={sub.id}>{t(sub.name)}</option>
  ))}
  <option value="other">{t('other')}</option>
</select>
            )}
            {(repairCategory === "other" || repairSubcategory === "other") && (
              <input type="text" placeholder={repairCategory === "other" ? t('enterCustomCategory') : t('enterCustomSubcategory')} value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
            )}
            <textarea placeholder={t('description')} value={repairDescription} onChange={(e) => setRepairDescription(e.target.value)} />
            <input
              type="number"
              placeholder={t('mileageAtRepair')}
              value={repairMileage}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || (parseInt(value) >= 0 && !isNaN(parseInt(value)))) {
                  setRepairMileage(value);
                }
              }}
            />
            <input type="date" value={repairDate || ""} onChange={(e) => setRepairDate(e.target.value)} />
            <button onClick={addRepair}>{t('save')}</button>
            <button onClick={() => setIsRepairModalOpen(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {isMaintenanceModalOpen && (
        <div className="modal" onClick={() => setIsMaintenanceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{t('addMaintenance')}</h3>
            <div className="modal-actions">
              <button
                className="select-all-btn"
                onClick={() => {
                  const newValue = !maintenance.allSelected;
                  setMaintenance(prev => ({
                    ...prev,
                    oilChange: newValue,
                    airFilterChange: newValue,
                    oilFilterChange: newValue,
                    brakeCheck: newValue,
                    tireRotation: newValue,
                    coolantFlush: newValue,
                    allSelected: newValue
                  }));
                }}
              >
                {maintenance.allSelected ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={maintenance.oilChange}
                  onChange={(e) => setMaintenance({ ...maintenance, oilChange: e.target.checked, allSelected: false })}
                />
                {t('oilChange')}
              </label>
              {maintenance.oilChange && (
                <input
                  className="input-mileage"
                  type="number"
                  placeholder={t('mileageAtOilChange')}
                  value={maintenance.oilChangeMileage}
                  min="0"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (parseInt(value) >= 0 && !isNaN(parseInt(value)))) {
                      setMaintenance({ ...maintenance, oilChangeMileage: value });
                    }
                  }}
                />
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={maintenance.airFilterChange}
                  onChange={(e) => setMaintenance({ ...maintenance, airFilterChange: e.target.checked, allSelected: false })}
                />
                {t('airFilterChange')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={maintenance.oilFilterChange}
                  onChange={(e) => setMaintenance({ ...maintenance, oilFilterChange: e.target.checked, allSelected: false })}
                />
                {t('oilFilterChange')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={maintenance.brakeCheck}
                  onChange={(e) => setMaintenance({ ...maintenance, brakeCheck: e.target.checked, allSelected: false })}
                />
                {t('brakeCheck')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={maintenance.tireRotation}
                  onChange={(e) => setMaintenance({ ...maintenance, tireRotation: e.target.checked, allSelected: false })}
                />
                {t('tireRotation')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={maintenance.coolantFlush}
                  onChange={(e) => setMaintenance({ ...maintenance, coolantFlush: e.target.checked, allSelected: false })}
                />
                {t('coolantFlush')}
              </label>
            </div>
            <input
              type="date"
              value={maintenanceDate || ""}
              onChange={(e) => setMaintenanceDate(e.target.value)}
            />
            <div className="modal-buttons">
              <button
                className="save-btn"
                onClick={addMaintenance}
                disabled={!isAnyMaintenanceSelected() || (maintenance.oilChange && !maintenance.oilChangeMileage)}
              >
                {t('save')}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setIsMaintenanceModalOpen(false)}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isInsuranceModalOpen && (
        <div className="modal" onClick={() => setIsInsuranceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('addInsurance')}</h3>
            <input
              type="text"
              placeholder={t('insuranceCompany')}
              value={insuranceCompany}
              onChange={(e) => setInsuranceCompany(e.target.value)}
            />
            <input
              type="date"
              value={insuranceDate || ""}
              onChange={(e) => setInsuranceDate(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="save-btn" onClick={addInsurance}>{t('save')}</button>
              <button className="cancel-btn" onClick={() => setIsInsuranceModalOpen(false)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {isEditMaintenanceModalOpen && (
        <div className="modal" onClick={() => setIsEditMaintenanceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('editMaintenance')}</h3>
            <div className="modal-actions">
              <button
                className="select-all-btn"
                onClick={() => {
                  const newValue = !editMaintenance?.allSelected;
                  setEditMaintenance(prev => ({
                    ...prev,
                    oil_change: newValue,
                    air_filter_change: newValue,
                    oil_filter_change: newValue,
                    brake_check: newValue,
                    tire_rotation: newValue,
                    coolant_flush: newValue,
                    allSelected: newValue
                  }));
                }}
              >
                {editMaintenance?.allSelected ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editMaintenance?.oil_change && editMaintenance?.oil_change_mileage &&
                  (isNaN(parseInt(editMaintenance.oil_change_mileage)) || parseInt(editMaintenance.oil_change_mileage) < 0)) {
                alert(t("oilChangeMileageMustBeNonNegative"));
                return;
              }
              updateMaintenance();
            }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editMaintenance?.oil_change || false}
                  onChange={(e) => setEditMaintenance({ ...editMaintenance, oil_change: e.target.checked, allSelected: false })}
                />
                {t('oilChange')}
              </label>
              {editMaintenance?.oil_change && (
                <>
                  <input
                    type="number"
                    placeholder={t('mileageAtOilChange')}
                    value={editMaintenance?.oil_change_mileage || ""}
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || (parseInt(value) >= 0 && !isNaN(parseInt(value)))) {
                        setEditMaintenance({ ...editMaintenance, oil_change_mileage: value });
                      }
                    }}
                  />
                  <input
                    type="date"
                    value={editMaintenance?.oil_change_date?.split("T")[0] || ""}
                    onChange={(e) => setEditMaintenance({ ...editMaintenance, oil_change_date: e.target.value })}
                  />
                </>
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editMaintenance?.air_filter_change || false}
                  onChange={(e) => setEditMaintenance({ ...editMaintenance, air_filter_change: e.target.checked, allSelected: false })}
                />
                {t('airFilterChange')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editMaintenance?.oil_filter_change || false}
                  onChange={(e) => setEditMaintenance({ ...editMaintenance, oil_filter_change: e.target.checked, allSelected: false })}
                />
                {t('oilFilterChange')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editMaintenance?.brake_check || false}
                  onChange={(e) => setEditMaintenance({ ...editMaintenance, brake_check: e.target.checked, allSelected: false })}
                />
                {t('brakeCheck')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editMaintenance?.tire_rotation || false}
                  onChange={(e) => setEditMaintenance({ ...editMaintenance, tire_rotation: e.target.checked, allSelected: false })}
                />
                {t('tireRotation')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editMaintenance?.coolant_flush || false}
                  onChange={(e) => setEditMaintenance({ ...editMaintenance, coolant_flush: e.target.checked, allSelected: false })}
                />
                {t('coolantFlush')}
              </label>
              <button type="submit">{t('save')}</button>
              <button type="button" onClick={() => setIsEditMaintenanceModalOpen(false)}>{t('cancel')}</button>
            </form>
          </div>
        </div>
      )}

      {isEditRepairModalOpen && (
        <div className="modal" onClick={() => setIsEditRepairModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('editRepair')}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editRepair?.mileage && (isNaN(parseInt(editRepair.mileage)) || parseInt(editRepair.mileage) < 0)) {
                alert(t("mileageMustBeNonNegative"));
                return;
              }
              updateRepair();
            }}>
              <select value={editRepair?.category || ""} onChange={(e) => setEditRepair({ ...editRepair, category: e.target.value })}>
                <option value="">{t('selectCategory')}</option>
                <option value="Engine">{t('engine')}</option>
                <option value="Brakes">{t('brakes')}</option>
                <option value="Suspension">{t('suspension')}</option>
                <option value="Electronics">{t('electronics')}</option>
                <option value="Bodywork">{t('bodywork')}</option>
              </select>
              {editRepair?.category && editRepair.category !== "Other" && (
                <select value={editRepair?.subcategory || ""} onChange={(e) => setEditRepair({ ...editRepair, subcategory: e.target.value })}>
                  <option value="">{t('selectSubcategory')}</option>
                  {editRepair.category === "Engine" && (
                    <>
                      <option value="Oil Leak">{t('oilLeak')}</option>
                      <option value="Timing Belt">{t('timingBelt')}</option>
                      <option value="Cylinder Head">{t('cylinderHead')}</option>
                      <option value="Piston Rings">{t('pistonRings')}</option>
                      <option value="Other">{t('other')}</option>
                    </>
                  )}
                  {editRepair.category === "Brakes" && (
                    <>
                      <option value="Pads Replacement">{t('padsReplacement')}</option>
                      <option value="Brake Discs">{t('brakeDiscs')}</option>
                      <option value="Brake Fluid">{t('brakeFluid')}</option>
                      <option value="Other">{t('other')}</option>
                    </>
                  )}
                </select>
              )}
              <input
                type="number"
                placeholder={t('mileageAtRepair')}
                value={editRepair?.mileage || ""}
                min="0"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (parseInt(value) >= 0 && !isNaN(parseInt(value)))) {
                    setEditRepair({ ...editRepair, mileage: value });
                  }
                }}
              />
              <input
                type="date"
                value={editRepair?.date?.split("T")[0] || ""}
                onChange={(e) => setEditRepair({ ...editRepair, date: e.target.value })}
              />
              <textarea
                placeholder={t('description')}
                value={editRepair?.description || ""}
                onChange={(e) => setEditRepair({ ...editRepair, description: e.target.value })}
              />
              <button type="submit">{t('save')}</button>
              <button type="button" onClick={() => setIsEditRepairModalOpen(false)}>{t('cancel')}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}