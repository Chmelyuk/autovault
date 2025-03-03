import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import ServiceHeader from './ServiceHeader';
import './ServiceDashboard.css';
import { useTranslation } from 'react-i18next';
import loadimg from '../components/loadimg.PNG';

export default function ServiceDashboard({ user, handleLogout }) {
  const [cars, setCars] = useState([]);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [repairCategories, setRepairCategories] = useState([]);
  const [repairSubcategories, setRepairSubcategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const dropdownRef = useRef(null);
  const { t } = useTranslation();
  const [maintenance, setMaintenance] = useState({
    oilChange: false,
    oilChangeMileage: '',
    oilChangeDate: '',
    airFilterChange: false, // Заменяем filterChange на airFilterChange
    oilFilterChange: false, // Добавляем oilFilterChange
    brakeCheck: false,
    tireRotation: false,
    coolantFlush: false,
    allSelected: false, // Добавляем для кнопки "Выбрать все"
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleMaintenanceChange = (e) => {
    const { name, type, checked, value } = e.target;
    setMaintenance((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      allSelected: false, // Сбрасываем allSelected при индивидуальном изменении
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (maintenance.oilChange && (!maintenance.oilChangeMileage || !maintenance.oilChangeDate)) {
      setErrorMessage(t('fillOilChangeFields')); // Обновляем сообщение об ошибке
      return;
    }

    const maintenanceData = {
      oil_change: maintenance.oilChange,
      oil_change_mileage: maintenance.oilChange ? maintenance.oilChangeMileage || null : null,
      oil_change_date: maintenance.oilChange ? maintenance.oilChangeDate || null : null,
      air_filter_change: maintenance.airFilterChange, // Обновляем поля
      oil_filter_change: maintenance.oilFilterChange, // Обновляем поля
      brake_check: maintenance.brakeCheck,
      tire_rotation: maintenance.tireRotation,
      coolant_flush: maintenance.coolantFlush,
    };

    addMaintenance(selectedCar.id, maintenanceData, true);
    setIsMaintenanceModalOpen(false);
    setErrorMessage('');
    setMaintenance({
      oilChange: false,
      oilChangeMileage: '',
      oilChangeDate: '',
      airFilterChange: false,
      oilFilterChange: false,
      brakeCheck: false,
      tireRotation: false,
      coolantFlush: false,
      allSelected: false,
    });
  };

  const getCarOwnerId = async (carId) => {
    const { data, error } = await supabase
      .from('cars')
      .select('user_id')
      .eq('id', carId)
      .single();

    if (error) {
      console.error('Ошибка при получении владельца автомобиля:', error.message);
      return null;
    }
    return data.user_id;
  };

  const fetchCars = async () => {
    setIsLoadingCars(true);
    try {
      const { data, error } = await supabase
        .from('service_cars')
        .select('car_id')
        .eq('service_id', user?.id);

      if (error) {
        console.error('Ошибка загрузки автомобилей сервиса:', error.message);
        return;
      }

      const carIds = data?.map((item) => item.car_id);
      if (!carIds || carIds.length === 0) return;

      const { data: carsWithDetails, error: detailsError } = await supabase
        .from('cars')
        .select(`
          id, brand, model, year, mileage, vin,
          fuelType, transmissionType, engine, turbocharged,
          repairs (
            id, category, subcategory, description, mileage, date, addbyservice, service_id
          ),
          maintenance (
            id, oil_change, oil_change_mileage, oil_change_date, air_filter_change, oil_filter_change, brake_check, tire_rotation, coolant_flush, addbyservice, service_id
          )
        `)
        .in('id', carIds);

      if (detailsError) {
        console.error('Ошибка загрузки данных автомобилей:', detailsError.message);
        return;
      }

      const carsWithServiceNames = await Promise.all(
        carsWithDetails.map(async (car) => {
          const repairsWithServiceNames = await Promise.all(
            car.repairs.map(async (repair) => {
              let serviceName = '';
              const subcategoryName = repair.subcategory || '';

              if (repair.addbyservice && repair.service_id) {
                const { data: serviceProfile } = await supabase
                  .from('profiles')
                  .select('service_name')
                  .eq('id', repair.service_id)
                  .single();
                serviceName = serviceProfile?.service_name || '';
              }

              return { ...repair, serviceName, subcategoryName };
            })
          );

          const maintenanceWithServiceNames = await Promise.all(
            car.maintenance.map(async (maintenance) => {
              if (maintenance.addbyservice && maintenance.service_id) {
                const { data: serviceProfile } = await supabase
                  .from('profiles')
                  .select('service_name')
                  .eq('id', maintenance.service_id)
                  .single();
                return { ...maintenance, serviceName: serviceProfile?.service_name || '' };
              }
              return maintenance;
            })
          );

          return {
            ...car,
            repairs: repairsWithServiceNames,
            maintenance: maintenanceWithServiceNames,
          };
        })
      );

      setCars(carsWithServiceNames);

      const savedCarId = localStorage.getItem('selectedCarId');
      if (savedCarId) {
        const savedCar = carsWithServiceNames.find((car) => car.id === savedCarId);
        if (savedCar) {
          setSelectedCar(savedCar);
        } else if (carsWithServiceNames.length > 0) {
          setSelectedCar(carsWithServiceNames[0]);
        }
      } else if (carsWithServiceNames.length > 0) {
        setSelectedCar(carsWithServiceNames[0]);
      }
    } finally {
      setIsLoadingCars(false);
    }
  };

  const fetchRepairCategories = async () => {
    const { data, error } = await supabase
      .from('repair_categories')
      .select('*');

    if (error) {
      console.error('Ошибка при загрузке категорий:', error.message);
    } else {
      setRepairCategories(data);
    }
  };

  const fetchRepairSubcategories = async (categoryId) => {
    if (!categoryId) {
      setRepairSubcategories([]);
      return;
    }

    const { data, error } = await supabase
      .from('repair_subcategories')
      .select('*')
      .eq('category_id', categoryId);

    if (error) {
      console.error('Ошибка при загрузке подкатегорий:', error.message);
    } else {
      setRepairSubcategories(data);
    }
  };

  const fetchAnalytics = async () => {
    if (isLoadingAnalytics) return;

    setIsLoadingAnalytics(true);
    try {
      setAnalyticsData(null);

      const allRepairs = cars.flatMap((car) => car.repairs);
      const allMaintenance = cars.flatMap((car) => car.maintenance);

      const validRepairs = allRepairs.filter((repair) =>
        repair.category && typeof repair.category === 'string' && repair.category.trim() && !['1', 'фв'].includes(repair.category.toLowerCase())
      );

      const repairCategoriesCount = {};
      const repairSubcategoriesCount = {};
      validRepairs.forEach((repair) => {
        if (repair.category) {
          repairCategoriesCount[repair.category] = (repairCategoriesCount[repair.category] || 0) + 1;
        }
        if (repair.subcategory && typeof repair.subcategory === 'string' && repair.subcategory.trim() && !['1'].includes(repair.subcategory.toLowerCase())) {
          repairSubcategoriesCount[repair.subcategory] = (repairSubcategoriesCount[repair.subcategory] || 0) + 1;
        }
      });

      const oilChanges = allMaintenance
        .filter((m) => m.oil_change && m.oil_change_mileage && m.oil_change_date)
        .sort((a, b) => new Date(a.oil_change_date) - new Date(b.oil_change_date));

      let avgMileageInterval = 0;
      let avgMonthsInterval = 0;
      let validOilChangesCount = 0;

      if (oilChanges.length > 1) {
        for (let i = 1; i < oilChanges.length; i++) {
          const prev = oilChanges[i - 1];
          const curr = oilChanges[i];
          const mileageDiff = curr.oil_change_mileage - prev.oil_change_mileage;
          const dateDiff = (new Date(curr.oil_change_date) - new Date(prev.oil_change_date)) / (1000 * 60 * 60 * 24 * 30);
          if (mileageDiff > 0 && dateDiff > 0) {
            avgMileageInterval += mileageDiff;
            avgMonthsInterval += dateDiff;
            validOilChangesCount++;
          }
        }
        if (validOilChangesCount > 0) {
          avgMileageInterval /= validOilChangesCount;
          avgMonthsInterval /= validOilChangesCount;
        }
      }

      const newAnalyticsData = {
        popularRepairs: {
          categories: Object.entries(repairCategoriesCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
          subcategories: Object.entries(repairSubcategoriesCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
        },
        oilChangeIntervals: {
          mileage: avgMileageInterval ? Math.round(avgMileageInterval) : 0,
          months: avgMonthsInterval ? Math.round(avgMonthsInterval) : 0,
        },
      };

      setAnalyticsData(newAnalyticsData);
      setIsAnalyticsModalOpen(true);
    } catch (err) {
      console.error('Ошибка при загрузке аналитики:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (user?.id && cars.length === 0) {
      fetchCars();
    }
  }, [user?.id]);

  useEffect(() => {
    if (cars.length > 0) {
      const savedCarId = localStorage.getItem('selectedCarId');
      if (savedCarId) {
        const savedCar = cars.find((car) => car.id === savedCarId);
        setSelectedCar(savedCar || cars[0]);
      } else {
        setSelectedCar(cars[0]);
      }
    }
  }, [cars]);

  useEffect(() => {
    if (selectedCar) {
      localStorage.setItem('selectedCarId', selectedCar.id);
    }
  }, [selectedCar]);

  const addRepair = async (carId, repairData, isAddedByService = false) => {
    const ownerId = await getCarOwnerId(carId);
    if (!ownerId) return;

    const { data: categoryData } = await supabase
      .from('repair_categories')
      .select('name')
      .eq('id', repairData.category)
      .single();
    const { data: subcategoryData } = await supabase
      .from('repair_subcategories')
      .select('name')
      .eq('id', repairData.subcategory)
      .single();

    const updatedRepairData = {
      ...repairData,
      category: categoryData?.name || repairData.category,
      subcategory: subcategoryData?.name || repairData.subcategory,
    };

    try {
      const { data, error } = await supabase
        .from('repairs')
        .insert([{ ...updatedRepairData, car_id: carId, user_id: ownerId, addbyservice: isAddedByService, service_id: user.id }])
        .select('*');
      console.log('Добавленный ремонт:', data);
      if (error) {
        console.error('Ошибка при добавлении ремонта:', error.message);
        return;
      }
      fetchCars();
    } catch (err) {
      console.error('Ошибка при добавлении ремонта:', err);
    }
  };

  const addMaintenance = async (carId, maintenanceData, isAddedByService = false) => {
    const ownerId = await getCarOwnerId(carId);
    if (!ownerId) return;

    try {
      const { data, error } = await supabase
        .from('maintenance')
        .insert([{ ...maintenanceData, car_id: carId, user_id: ownerId, addbyservice: isAddedByService, service_id: user.id }])
        .select('*');

      if (error) {
        console.error('Ошибка при добавлении ТО:', error.message);
        return;
      }
      fetchCars();
    } catch (err) {
      console.error('Ошибка при добавлении ТО:', err);
    }
  };

  const deleteCar = async (carId) => {
    if (!window.confirm(t('confirmDeleteCar'))) return;

    try {
      const { error } = await supabase
        .from('service_cars')
        .delete()
        .eq('car_id', carId)
        .eq('service_id', user.id);

      if (error) {
        console.error('Ошибка при удалении автомобиля:', error.message);
        return;
      }
      fetchCars();
      if (selectedCar && selectedCar.id === carId) {
        setSelectedCar(null);
        localStorage.removeItem('selectedCarId');
      }
    } catch (err) {
      console.error('Ошибка при удалении автомобиля:', err);
    }
  };

  const openRepairModal = () => {
    fetchRepairCategories();
    setIsRepairModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <ServiceHeader user={user} handleLogout={handleLogout} fetchCars={fetchCars} />

      <div className="dashboard">
        <h2>{t('serviceDashboard')}</h2>

        {isLoadingCars && (
          <div className="car-loader">
            <div className="car-container">
              <img src={loadimg} alt="Loading car" className="car-image" />
              <h3>{t('loading')}</h3>
              <div className="exhaust">
                <div className="smoke smoke1"></div>
                <div className="smoke smoke2"></div>
                <div className="smoke smoke3"></div>
              </div>
            </div>
          </div>
        )}

        <div className="car-selector-wrapper" ref={dropdownRef}>
          <div
            className={`custom-car-selector-header ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => !isLoadingCars && setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="selector-label">{t('fleet')}:</span>
            <span className="selected-option">
              {selectedCar ? `${selectedCar.brand} ${selectedCar.model} (${selectedCar.year})` : t('selectCar')}
            </span>
            <span className="dropdown-icon">▼</span>
          </div>
          {isDropdownOpen && !isLoadingCars && (
            <ul className="dropdown-options">
              <li
                key="none"
                className="dropdown-option"
                onClick={() => {
                  setSelectedCar(null);
                  setIsDropdownOpen(false);
                }}
              >
                {t('selectCar')}
              </li>
              {cars.map((car) => (
                <li
                  key={car.id}
                  className="dropdown-option"
                  onClick={() => {
                    setSelectedCar(car);
                    setIsDropdownOpen(false);
                  }}
                >
                  {car.brand} {car.model} ({car.year})
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedCar ? (
          <div className="car-item">
            <p>{selectedCar.brand} {selectedCar.model} ({selectedCar.year})</p>
            <p>{t('mileage')}: {selectedCar.mileage} {t('km')}</p>
            <p>{t('fuelType')}: {t(selectedCar.fuelType)}</p>
            <p>{t('transmission')}: {t(selectedCar.transmissionType)}</p>
            <p>{t('engine')}: {selectedCar.engine} L {selectedCar.turbocharged && <span className="turbo">({t('turbocharged')})</span>}</p>
            <p>{t('vin')}: {selectedCar.vin}</p>

            <div className="action-buttons">
              <button className="add-button" onClick={() => { setSelectedCar(selectedCar); openRepairModal(); }}>
                {t('addRepair')}
              </button>
              <button className="add-button" onClick={() => { setSelectedCar(selectedCar); setIsMaintenanceModalOpen(true); }}>
                {t('addMaintenance')}
              </button>
              <button className="add-button" onClick={() => deleteCar(selectedCar.id)}>{t('deleteCar')}</button>
              <button className="analytics-button" onClick={fetchAnalytics}>
                {isLoadingAnalytics ? t('loadingAnalytics') : t('viewAnalytics')}
              </button>
            </div>

            <div className="repair-history">
              <div className="repairs">
                <h4>{t('repairHistory')}</h4>
                {selectedCar.repairs.length > 0 ? (
                  selectedCar.repairs.map((r) => (
                    <div className="repair-entry" key={r.id}>
                      <p>
                        <strong>{t(r.category) || r.category}</strong> {r.subcategoryName && `- ${t(r.subcategoryName) || r.subcategoryName}`}
                      </p>
                      <p>{t('description')}: {r.description}</p>
                      <p>{t('mileage')}: {r.mileage ? `${r.mileage} км` : t('null')}</p>
                      <p>{t('date')}: {new Date(r.date).toLocaleDateString()}</p>
                      {r.addbyservice && (
                        <p className="added-by-service">
                          {t('addedByService')} {r.serviceName && `(${r.serviceName})`}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>{t('noRepairData')}</p>
                )}
              </div>
            </div>

            <div className="maintenance-history">
              <h4>{t('maintenanceHistory')}</h4>
              {selectedCar.maintenance.length > 0 ? (
                selectedCar.maintenance.map((m) => (
                  <div key={m.id} className="maintenance-entry">
                    {m.oil_change && <p>{t('oilChange')}: {m.oil_change_mileage} км</p>}
                    {(m.oil_change_date) && (
                      <p>
                        {t('oilChangeDate')}: {new Date(m.oil_change_date).toLocaleDateString()}
                      </p>
                    )}
                    {m.air_filter_change && <p>{t('airFilterChange')}</p>}
                    {m.oil_filter_change && <p>{t('oilFilterChange')}</p>}
                    {m.brake_check && <p>{t('brakeCheck')}</p>}
                    {m.tire_rotation && <p>{t('tireRotation')}</p>}
                    {m.coolant_flush && <p>{t('coolantFlush')}</p>}
                    {m.addbyservice && (
                      <p className="added-by-service">
                        {t('addedByService')} {m.serviceName && `(${m.serviceName})`}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p>{t('noMaintenanceData')}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="no-car-selected">{t('noCarSelected')}</p>
        )}

        {isAnalyticsModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content analytics-modal">
              <h3>{t('analytics')}</h3>
              {analyticsData ? (
                <div className="analytics-content">
                  <div className="analytics-section">
                    <h4>{t('popularRepairs')}</h4>
                    <div className="analytics-item">
                      <p>{t('topRepairCategories')}:</p>
                      <ul className="analytics-list">
                        {analyticsData.popularRepairs.categories.map(([category, count]) => (
                          <li key={category} className="analytics-entry">
                            {t(category) || category}: {t('times', { count })}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="analytics-item">
                      <p>{t('topRepairSubcategories')}:</p>
                      <ul className="analytics-list">
                        {analyticsData.popularRepairs.subcategories.map(([subcategory, count]) => (
                          <li key={subcategory} className="analytics-entry">
                            {t(subcategory) || subcategory}: {t('times', { count })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="analytics-section">
                    <h4>{t('oilChangeIntervals')}</h4>
                    <p>{t('avgMileageInterval')}: {analyticsData.oilChangeIntervals.mileage} {t('km')}</p>
                    <p>{t('avgMonthsInterval')}: {analyticsData.oilChangeIntervals.months} {t('months')}</p>
                  </div>
                  <button className="modal-close-button" onClick={() => setIsAnalyticsModalOpen(false)}>
                    {t('close')}
                  </button>
                </div>
              ) : (
                <p className="no-analytics-data">{t('noAnalyticsData')}</p>
              )}
            </div>
          </div>
        )}

        {isRepairModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>{t('addRepair')}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const repairData = {
                    category: formData.get('category'),
                    subcategory: formData.get('subcategory'),
                    description: formData.get('description'),
                    mileage: formData.get('mileage'),
                    date: formData.get('date'),
                  };
                  addRepair(selectedCar.id, repairData, true);
                  setIsRepairModalOpen(false);
                  e.target.reset();
                  setRepairSubcategories([]);
                }}
              >
                <select
                  name="category"
                  required
                  onChange={(e) => {
                    const selectedCategory = e.target.value;
                    fetchRepairSubcategories(selectedCategory);
                  }}
                >
                  <option value="">{t('selectCategory')}</option>
                  {repairCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {t(category.name)}
                    </option>
                  ))}
                </select>

                <select name="subcategory">
                  <option value="">{t('selectSubcategory')}</option>
                  {repairSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {t(subcategory.name)}
                    </option>
                  ))}
                </select>

                <textarea name="description" placeholder={t('description')} required />
                <input type="number" name="mileage" placeholder={t('mileage')} required />
                <input type="date" name="date" required />
                <button type="submit">{t('save')}</button>
                <button type="button" onClick={() => setIsRepairModalOpen(false)}>{t('cancel')}</button>
              </form>
            </div>
          </div>
        )}

        {isMaintenanceModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{t('addMaintenance')}</h3>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
              <form onSubmit={handleSubmit}>
                <div className="modal-actions">
                  <button
                    className="select-all-btn"
                    type="button"
                    onClick={() => {
                      const newValue = !maintenance.allSelected;
                      setMaintenance((prev) => ({
                        ...prev,
                        oilChange: newValue,
                        airFilterChange: newValue,
                        oilFilterChange: newValue,
                        brakeCheck: newValue,
                        tireRotation: newValue,
                        coolantFlush: newValue,
                        allSelected: newValue,
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
                      name="oilChange"
                      checked={maintenance.oilChange}
                      onChange={handleMaintenanceChange}
                    />
                    {t('oilChange')}
                  </label>
                  {maintenance.oilChange && (
                    <>
                      <input
                        type="number"
                        name="oilChangeMileage"
                        value={maintenance.oilChangeMileage}
                        onChange={handleMaintenanceChange}
                        placeholder={t('mileageAtOilChange')}
                        className="form-input"
                        required
                      />
                      <input
                        type="date"
                        name="oilChangeDate"
                        value={maintenance.oilChangeDate}
                        onChange={handleMaintenanceChange}
                        className="form-input"
                        required
                      />
                    </>
                  )}
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="airFilterChange"
                      checked={maintenance.airFilterChange}
                      onChange={handleMaintenanceChange}
                    />
                    {t('airFilterChange')}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="oilFilterChange"
                      checked={maintenance.oilFilterChange}
                      onChange={handleMaintenanceChange}
                    />
                    {t('oilFilterChange')}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="brakeCheck"
                      checked={maintenance.brakeCheck}
                      onChange={handleMaintenanceChange}
                    />
                    {t('brakeCheck')}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="tireRotation"
                      checked={maintenance.tireRotation}
                      onChange={handleMaintenanceChange}
                    />
                    {t('tireRotation')}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="coolantFlush"
                      checked={maintenance.coolantFlush}
                      onChange={handleMaintenanceChange}
                    />
                    {t('coolantFlush')}
                  </label>
                </div>
                <div className="form-buttons">
                  <button
                    type="submit"
                    className="form-button submit-button"
                    disabled={maintenance.oilChange && (!maintenance.oilChangeMileage || !maintenance.oilChangeDate)}
                  >
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMaintenanceModalOpen(false)}
                    className="form-button cancel-button"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}