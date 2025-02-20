import React, { useState, useEffect } from 'react';
import Header from './Header';
import CarDetails from './CarDetails';
import ProgressBar from './ProgressBar';
import banner from '../components/banner.jpg';
import { useTranslation } from 'react-i18next';
import './Dashboard.css';

export default function Dashboard({ user, supabase, handleLogout }) {
  const { t } = useTranslation();

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCar, setEditCar] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [car, setCar] = useState(() => {
    const savedCarId = localStorage.getItem('selectedCarId');
    return savedCarId ? null : null;
  });
  const [repairs, setRepairs] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [repairCategory, setRepairCategory] = useState("");
  const [repairDescription, setRepairDescription] = useState("");
  const [maintenance, setMaintenance] = useState({
    oilChange: false,
    filterChange: false,
    brakeCheck: false,
    tireRotation: false,
    coolantFlush: false,
    oilChangeMileage: "",
  });
  const [showWarning, setShowWarning] = useState(true);
  const [sortMode, setSortMode] = useState("dateDesc");

  // Загрузка начальных данных
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;

      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (carsError) {
        console.error("❌ Ошибка при загрузке машин:", carsError.message);
        return;
      }

      setCars(carsData);

      // Восстановление выбранного автомобиля из localStorage
      const savedCarId = localStorage.getItem('selectedCarId');
      const selectedCar = savedCarId
        ? carsData.find(c => c.id === savedCarId) || (carsData.length > 0 ? carsData[0] : null)
        : carsData.length > 0 ? carsData[0] : null;

      setCar(selectedCar);
    };

    fetchInitialData();
  }, [user, supabase]);

  // Обновление ремонтов и ТО при смене автомобиля
  useEffect(() => {
    if (car?.id) {
      Promise.all([fetchRepairs(car.id), fetchMaintenance(car.id)])
        .catch(err => console.error("❌ Ошибка при загрузке данных:", err));
    } else {
      setRepairs([]);
      setMaintenanceRecords([]);
    }
  }, [car, supabase]);

  // Сохранение выбранного автомобиля в localStorage
  useEffect(() => {
    if (car) {
      localStorage.setItem('selectedCarId', car.id);
    } else {
      localStorage.removeItem('selectedCarId');
    }
  }, [car]);

  // Загрузка категорий ремонта
  useEffect(() => {
    if (isRepairModalOpen) {
      fetchRepairCategories();
    }
  }, [isRepairModalOpen, supabase]);

  const fetchCars = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Ошибка при загрузке машин:", error.message);
    } else {
      setCars(data);
      const savedCarId = localStorage.getItem('selectedCarId');
      const selectedCar = savedCarId
        ? data.find(c => c.id === savedCarId) || (data.length > 0 ? data[0] : null)
        : data.length > 0 ? data[0] : null;
      setCar(selectedCar);
    }
  };

  const fetchRepairs = async (carId) => {
    if (!carId) return;
    const { data, error } = await supabase
      .from("repairs")
      .select("*, service_id")
      .eq("car_id", carId)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Ошибка при загрузке ремонтов:", error.message);
      setRepairs([]);
      return;
    }

    const repairsWithServiceNames = await Promise.all(
      data.map(async (repair) => {
        if (repair.service_id) {
          const { data: serviceProfile, error: serviceError } = await supabase
            .from("profiles")
            .select("service_name")
            .eq("id", repair.service_id)
            .single();
          if (serviceError) {
            console.error("Ошибка загрузки сервиса:", serviceError.message);
            return { ...repair, serviceName: "Unknown" };
          }
          return { ...repair, serviceName: serviceProfile?.service_name || "" };
        }
        return repair;
      })
    );
    setRepairs(repairsWithServiceNames);
  };

  const fetchMaintenance = async (carId) => {
    if (!carId) return;
    const { data, error } = await supabase
      .from("maintenance")
      .select("id, oil_change, oil_change_mileage, oil_change_date, filter_change, brake_check, tire_rotation, coolant_flush, addbyservice, service_id, user_id")
      .eq("car_id", carId);

    if (error) {
      console.error("❌ Ошибка при загрузке ТО:", error.message);
      setMaintenanceRecords([]);
      return;
    }

    const maintenanceWithServiceNames = await Promise.all(
      data.map(async (maint) => {
        if (maint.service_id) {
          const { data: serviceProfile, error: serviceError } = await supabase
            .from("profiles")
            .select("service_name")
            .eq("id", maint.service_id)
            .single();
          if (serviceError) {
            console.error("Ошибка загрузки сервиса:", serviceError.message);
            return { ...maint, serviceName: "Unknown" };
          }
          return { ...maint, serviceName: serviceProfile?.service_name || "" };
        }
        return maint;
      })
    );
    setMaintenanceRecords(maintenanceWithServiceNames);
  };

  const fetchRepairCategories = async () => {
    const { data, error } = await supabase.from("repair_categories").select("*");
    if (error) {
      console.error("Ошибка при загрузке категорий:", error.message);
    } else {
      setRepairCategories(data.map(cat => ({ ...cat, name: t(cat.name) })));
    }
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
      setRepairSubcategories(data.map(sub => ({ ...sub, name: t(sub.name) })));
    }
  };

  const updateCarMileage = async (newMileage) => {
    if (!car || newMileage <= car.mileage) return;
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
    }
  };

  const updateCar = async () => {
    if (!editCar || !editCar.id) return;
    const { data, error } = await supabase
      .from("cars")
      .update(editCar)
      .eq("id", editCar.id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Ошибка при обновлении машины:", error.message);
    } else {
      setCar(data);
      setIsEditModalOpen(false);
    }
  };

  const addRepair = async () => {
    if (!car || !repairCategory || !repairDescription || !repairMileage) {
      alert(t("fillRequiredFields"));
      return;
    }
    const categoryName = repairCategory === "other"
      ? customCategory || "Other"
      : repairCategories.find(cat => cat.id === repairCategory)?.name || "Other";
    const subcategoryName = repairSubcategory === "other" ? customCategory : repairSubcategory;
    const formattedDate = repairDate || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase.from("repairs").insert([{
      user_id: user.id,
      car_id: car.id,
      category: categoryName,
      subcategory: subcategoryName,
      description: repairDescription,
      mileage: parseInt(repairMileage),
      date: formattedDate,
    }]).select("*");

    if (error) {
      console.error("Ошибка при добавлении ремонта:", error.message);
    } else {
      setRepairs(prev => [...prev, ...data]);
      setIsRepairModalOpen(false);
      setRepairCategory("");
      setRepairSubcategory("");
      setCustomCategory("");
      setRepairDescription("");
      setRepairMileage("");
      setRepairDate("");
      if (parseInt(repairMileage) > car.mileage) updateCarMileage(parseInt(repairMileage));
    }
  };

  const addMaintenance = async () => {
    if (!car) return;
    if (maintenance.oilChange && !maintenance.oilChangeMileage) {
      alert(t("fillOilChangeMileage"));
      return;
    }
    const formattedDate = maintenanceDate || new Date().toISOString().split("T")[0];
    const { data, error } = await supabase.from("maintenance").insert([{
      user_id: user.id,
      car_id: car.id,
      oil_change: maintenance.oilChange,
      oil_change_mileage: maintenance.oilChange ? maintenance.oilChangeMileage : null,
      oil_change_date: formattedDate,
      filter_change: maintenance.filterChange,
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
        filterChange: false,
        brakeCheck: false,
        tireRotation: false,
        coolantFlush: false,
        oilChangeMileage: "",
      });
      setMaintenanceDate("");
      if (maintenance.oilChange && maintenance.oilChangeMileage > car.mileage) {
        updateCarMileage(maintenance.oilChangeMileage);
      }
    }
  };

  const updateMaintenance = async () => {
    if (!editMaintenance || !editMaintenance.id) return;
    const formattedDate = editMaintenance.oil_change_date || new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("maintenance")
      .update({
        oil_change: editMaintenance.oil_change,
        filter_change: editMaintenance.filter_change,
        brake_check: editMaintenance.brake_check,
        tire_rotation: editMaintenance.tire_rotation,
        coolant_flush: editMaintenance.coolant_flush,
        oil_change_mileage: editMaintenance.oil_change ? editMaintenance.oil_change_mileage : null,
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
    }
  };

  const updateRepair = async () => {
    if (!editRepair || !editRepair.id) return;
    const formattedDate = editRepair.date || new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("repairs")
      .update({
        category: editRepair.category,
        subcategory: editRepair.subcategory || null,
        description: editRepair.description,
        mileage: parseInt(editRepair.mileage) || null,
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
      if (parseInt(editRepair.mileage) > car.mileage) updateCarMileage(parseInt(editRepair.mileage));
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
        return combinedRecords.sort((a, b) => new Date(a.date || a.oil_change_date) - new Date(b.date || b.oil_change_date));
      case "dateDesc":
        return combinedRecords.sort((a, b) => new Date(b.date || b.oil_change_date) - new Date(a.date || a.oil_change_date));
      case "repairsFirst":
        return combinedRecords.sort((a, b) => {
          if (a.category && !b.category) return -1;
          if (!a.category && b.category) return 1;
          return new Date(b.date || b.oil_change_date) - new Date(a.date || a.oil_change_date);
        });
      case "maintenanceFirst":
        return combinedRecords.sort((a, b) => {
          if (!a.category && b.category) return -1;
          if (a.category && !b.category) return 1;
          return new Date(b.date || b.oil_change_date) - new Date(a.date || a.oil_change_date);
        });
      default:
        return combinedRecords;
    }
  };

  const openEditModal = () => {
    setEditCar({ ...car });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      {isEditModalOpen && (
        <div className="modal" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('editInfo')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); updateCar(); }}>
              <input type="text" value={editCar?.brand || ""} onChange={(e) => setEditCar({ ...editCar, brand: e.target.value })} placeholder={t('brand')} />
              <input type="text" value={editCar?.model || ""} onChange={(e) => setEditCar({ ...editCar, model: e.target.value })} placeholder={t('model')} />
              <input type="number" value={editCar?.year || ""} onChange={(e) => setEditCar({ ...editCar, year: e.target.value })} placeholder={t('year')} />
              <input type="text" value={editCar?.engine || ""} onChange={(e) => setEditCar({ ...editCar, engine: e.target.value })} placeholder={t('engine')} />
              <input type="number" value={editCar?.mileage || ""} onChange={(e) => setEditCar({ ...editCar, mileage: e.target.value })} placeholder={t('mileage')} />
              <input type="text" value={editCar?.vin || ""} onChange={(e) => setEditCar({ ...editCar, vin: e.target.value })} placeholder={t('vin')} />
              <select value={editCar?.fuelType || ""} onChange={(e) => setEditCar({ ...editCar, fuelType: e.target.value })}>
                <option value="">{t('selectFuelType')}</option>
                <option value="Petrol">{t('petrol')}</option>
                <option value="Diesel">{t('diesel')}</option>
                <option value="Electric">{t('electric')}</option>
                <option value="Hybrid">{t('hybrid')}</option>
              </select>
              <select value={editCar?.transmissionType || ""} onChange={(e) => setEditCar({ ...editCar, transmissionType: e.target.value })}>
                <option value="">{t('selectTransmission')}</option>
                <option value="Manual">{t('manual')}</option>
                <option value="Automatic">{t('automatic')}</option>
                <option value="CVT">{t('cvt')}</option>
                <option value="Dual-clutch">{t('dualClutch')}</option>
              </select>
              <label className="checkbox-label">
                <input type="checkbox" checked={editCar?.turbocharged || false} onChange={(e) => setEditCar({ ...editCar, turbocharged: e.target.checked })} />
                <span>{t('turbocharged')}</span>
              </label>
              <button type="submit">{t('save')}</button>
              <button type="button" onClick={closeEditModal}>{t('cancel')}</button>
            </form>
          </div>
        </div>
      )}

      <Header
        fetchCars={fetchCars}
        handleLogout={handleLogout}
        user={user}
        openEditModal={openEditModal}
        fetchRepairs={fetchRepairs}
        fetchMaintenance={fetchMaintenance}
        selectedCar={car}
      />

      <div className="dashboard">
        <div className="car-selector-wrapper">
          <select
            className="car-selector"
            value={car?.id || ""}
            onChange={(e) => setCar(cars.find(c => c.id === e.target.value) || null)}
          >
            {cars.map(c => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.model} ({c.year})
              </option>
            ))}
          </select>
        </div>
        <CarDetails user={user} supabase={supabase} car={car} setCar={setCar} />

        <div className="car-details-container">
          {car && maintenanceRecords.length > 0 ? (
            <div className="oil-change-section">
              <strong className="oil-change">{t('oilChange')}:</strong>
              <ProgressBar progress={calculateRemainingMileage(car, maintenanceRecords)} total={calculateTotalMileageInterval(car)} />
            </div>
          ) : (
            <p>⏳ {t('loading')}</p>
          )}
        </div>

        <div className="action-buttons">
          <button className="add-button" onClick={() => setIsRepairModalOpen(true)}>{t('addRepair')}</button>
          <button className="add-button" onClick={() => setIsMaintenanceModalOpen(true)}>{t('addMaintenance')}</button>
        </div>

        <h3>{t('repairHistory')}</h3>
        <div className="sort-selector">
  <label>{t("sortBy")}:</label>
  <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
    <option value="dateAsc">{t("dateOldToNew")}</option>
    <option value="dateDesc">{t("dateNewToOld")}</option>
    <option value="repairsFirst">{t("repairsThenMaintenance")}</option>
    <option value="maintenanceFirst">{t("maintenanceThenRepairs")}</option>
  </select>
</div>


        <div className="repair-history">
          <ul>
            {getSortedRecords().length > 0 ? (
              getSortedRecords().map(record => (
                <li key={record.category ? `repair-${record.id}` : `maintenance-${record.id}`}>
                  {record.category ? (
                    <>
                      <strong>🛠 {t(record.category)}</strong>
                      <p>{record.subcategory && ` ${t('subcategory')}: ${t(record.subcategory)}`}</p>
                      <p>{record.description}</p>
                      {record.mileage && <p>{t('mileageAtRepair')}: {record.mileage} км</p>}
                      {record.date && <p>📅 {t('date')}: {new Date(record.date).toLocaleDateString()}</p>}
                      {record.addbyservice && <p className="added-by-service">{t('addedByService')} {record.serviceName && `(${record.serviceName})`}</p>}
                      <div className="button-container">
                        <button onClick={() => { setEditRepair(record); setIsEditRepairModalOpen(true); }}>{t('edit')}</button>
                        <button onClick={() => deleteRepair(record.id)}>{t('delete')}</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <strong>
                        
                        {!record.oil_change && !record.coolant_flush && !record.tire_rotation && !record.filter_change && !record.brake_check && '🔧'}
                      </strong>
                      {record.oil_change ? (
                        <>
                          🛢️{t('oilChange')}
                          {record.oil_change_date
                            ? ` ${t('at')} ${record.oil_change_mileage || t('unknown')} км ${new Date(record.oil_change_date).toLocaleDateString()}`
                            : ` (${t('unknownDate')})`}
                        </>
                      ) : (
                        record.oil_change_date && ` 📅 ${new Date(record.oil_change_date).toLocaleDateString()}`
                      )}
                      <p>{record.filter_change && `🌀${t('filterChange')}`}</p>
                      <p>{record.brake_check && ` 🛑${t('brakeCheck')}`}</p>
                      <p>{record.tire_rotation && ` 🛞${t('tireRotation')}`}</p>
                      <p>{record.coolant_flush && ` ❄️${t('coolantFlush')}`}</p>
                      {record.addbyservice && <p className="added-by-service">{t('addedByService')} {record.serviceName && `(${record.serviceName})`}</p>}
                      <div className="button-container">
                        <button onClick={() => { setEditMaintenance(record); setIsEditMaintenanceModalOpen(true); }}>{t('edit')}</button>
                        <button onClick={() => deleteMaintenance(record.id)}>{t('delete')}</button>
                      </div>
                      {record.oil_change && (
                        <>
                        <br/>
                          <ProgressBar progress={calculateRemainingMileage(car, maintenanceRecords)} total={calculateTotalMileageInterval(car)} />
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
                  <option key={sub.id} value={sub.name}>{t(sub.name)}</option>
                ))}
                <option value="other">{t('other')}</option>
              </select>
            )}
            {(repairCategory === "other" || repairSubcategory === "other") && (
              <input type="text" placeholder={repairCategory === "other" ? t('enterCustomCategory') : t('enterCustomSubcategory')} value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
            )}
            <textarea placeholder={t('description')} value={repairDescription} onChange={(e) => setRepairDescription(e.target.value)} />
            <input type="number" placeholder={t('mileageAtRepair')} value={repairMileage} onChange={(e) => setRepairMileage(e.target.value)} />
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
              <button className="select-all-btn" onClick={() => setMaintenance(prev => {
                const allChecked = Object.values(prev).every(val => val);
                return { oilChange: !allChecked, filterChange: !allChecked, brakeCheck: !allChecked, tireRotation: !allChecked, coolantFlush: !allChecked, oilChangeMileage: prev.oilChangeMileage };
              })}>
                {Object.values(maintenance).every(val => val) ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={maintenance.oilChange} onChange={(e) => setMaintenance({ ...maintenance, oilChange: e.target.checked })} />
                {t('oilChange')}
              </label>
              {maintenance.oilChange && (
                <input className="input-mileage" type="number" placeholder={t('mileageAtOilChange')} value={maintenance.oilChangeMileage} onChange={(e) => setMaintenance({ ...maintenance, oilChangeMileage: e.target.value })} />
              )}
              <label className="checkbox-label">
                <input type="checkbox" checked={maintenance.filterChange} onChange={(e) => setMaintenance({ ...maintenance, filterChange: e.target.checked })} />
                {t('filterChange')}
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={maintenance.brakeCheck} onChange={(e) => setMaintenance({ ...maintenance, brakeCheck: e.target.checked })} />
                {t('brakeCheck')}
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={maintenance.tireRotation} onChange={(e) => setMaintenance({ ...maintenance, tireRotation: e.target.checked })} />
                {t('tireRotation')}
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={maintenance.coolantFlush} onChange={(e) => setMaintenance({ ...maintenance, coolantFlush: e.target.checked })} />
                {t('coolantFlush')}
              </label>
            </div>
            <input type="date" value={maintenanceDate || ""} onChange={(e) => setMaintenanceDate(e.target.value)} />
            <div className="modal-buttons">
              <button className="save-btn" onClick={addMaintenance} disabled={maintenance.oilChange && !maintenance.oilChangeMileage}>{t('save')}</button>
              <button className="cancel-btn" onClick={() => setIsMaintenanceModalOpen(false)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {isEditMaintenanceModalOpen && (
        <div className="modal" onClick={() => setIsEditMaintenanceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('editMaintenance')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); updateMaintenance(); }}>
              <label className="checkbox-label">
                <input type="checkbox" checked={editMaintenance?.oil_change || false} onChange={(e) => setEditMaintenance({ ...editMaintenance, oil_change: e.target.checked })} />
                {t('oilChange')}
              </label>
              {editMaintenance?.oil_change && (
                <>
                  <input type="number" placeholder={t('mileageAtOilChange')} value={editMaintenance?.oil_change_mileage || ""} onChange={(e) => setEditMaintenance({ ...editMaintenance, oil_change_mileage: e.target.value })} />
                  <input type="date" value={editMaintenance?.oil_change_date?.split("T")[0] || ""} onChange={(e) => setEditMaintenance({ ...editMaintenance, oil_change_date: e.target.value })} />
                </>
              )}
              <label className="checkbox-label">
                <input type="checkbox" checked={editMaintenance?.filter_change || false} onChange={(e) => setEditMaintenance({ ...editMaintenance, filter_change: e.target.checked })} />
                {t('filterChange')}
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={editMaintenance?.brake_check || false} onChange={(e) => setEditMaintenance({ ...editMaintenance, brake_check: e.target.checked })} />
                {t('brakeCheck')}
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={editMaintenance?.tire_rotation || false} onChange={(e) => setEditMaintenance({ ...editMaintenance, tire_rotation: e.target.checked })} />
                {t('tireRotation')}
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={editMaintenance?.coolant_flush || false} onChange={(e) => setEditMaintenance({ ...editMaintenance, coolant_flush: e.target.checked })} />
                {t('coolantFlush')}
              </label>
              <button type="submit" disabled={editMaintenance?.oil_change && !editMaintenance?.oil_change_mileage}>{t('save')}</button>
              <button type="button" onClick={() => setIsEditMaintenanceModalOpen(false)}>{t('cancel')}</button>
            </form>
          </div>
        </div>
      )}

      {isEditRepairModalOpen && (
        <div className="modal" onClick={() => setIsEditRepairModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('editRepair')}</h3>
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
            <input type="number" placeholder={t('mileageAtRepair')} value={editRepair?.mileage || ""} onChange={(e) => setEditRepair({ ...editRepair, mileage: e.target.value })} />
            <input type="date" value={editRepair?.date?.split("T")[0] || ""} onChange={(e) => setEditRepair({ ...editRepair, date: e.target.value })} />
            <textarea placeholder={t('description')} value={editRepair?.description || ""} onChange={(e) => setEditRepair({ ...editRepair, description: e.target.value })} />
            <button onClick={updateRepair}>{t('save')}</button>
            <button onClick={() => setIsEditRepairModalOpen(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}
    </>
  );
}