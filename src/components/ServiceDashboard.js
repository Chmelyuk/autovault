import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ServiceHeader from './ServiceHeader';
import './ServiceDashboard.css';
import { useTranslation } from 'react-i18next';

export default function ServiceDashboard({ user, handleLogout }) {
  const [cars, setCars] = useState([]);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [repairCategories, setRepairCategories] = useState([]);
  const [repairSubcategories, setRepairSubcategories] = useState([]);
  const { t } = useTranslation();

  // Получение ID владельца автомобиля
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

  // Загрузка автомобилей сервиса
  const fetchCars = async () => {
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
      repairs (id, category, subcategory, description, mileage, date, addbyservice, service_id),
      maintenance (id, oil_change, oil_change_mileage, oil_change_date, filter_change, brake_check, tire_rotation, coolant_flush, addbyservice, service_id)
    `)
    .in('id', carIds);

  if (detailsError) {
    console.error('Ошибка загрузки данных автомобилей:', detailsError.message);
    return;
  }

  // Добавляем название сервиса к каждому ремонту и ТО
  const carsWithServiceNames = await Promise.all(
    carsWithDetails.map(async (car) => {
      const repairsWithServiceNames = await Promise.all(
        car.repairs.map(async (repair) => {
          if (repair.addbyservice && repair.service_id) {
            const { data: serviceProfile } = await supabase
              .from('profiles')
              .select('service_name')
              .eq('id', repair.service_id)
              .single();
            return { ...repair, serviceName: serviceProfile?.service_name || '' };
          }
          return repair;
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
};


  // Загрузка категорий ремонта
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

  // Загрузка подкатегорий ремонта
  const fetchRepairSubcategories = async () => {
    const { data, error } = await supabase
      .from('repair_subcategories')
      .select('*');

    if (error) {
      console.error('Ошибка при загрузке подкатегорий:', error.message);
    } else {
      setRepairSubcategories(data);
    }
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    if (user?.id) {
      fetchCars();
    }
    fetchRepairCategories();
    fetchRepairSubcategories();
  }, [user]);

  // Добавление ремонта
  const addRepair = async (carId, repairData, isAddedByService = false) => {
    const ownerId = await getCarOwnerId(carId);
    if (!ownerId) return;

    try {
      const { data, error } = await supabase
        .from('repairs')
        .insert([{ ...repairData, car_id: carId, user_id: ownerId, addbyservice: isAddedByService, service_id: user.id }])
        .select('*');

      if (error) {
        console.error('Ошибка при добавлении ремонта:', error.message);
        return;
      }

      fetchCars();
    } catch (err) {
      console.error('Ошибка при добавлении ремонта:', err);
    }
  };

  // Добавление ТО
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

  // Удаление автомобиля
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
    } catch (err) {
      console.error('Ошибка при удалении автомобиля:', err);
    }
  };

  return (
    <>
      <ServiceHeader user={user} handleLogout={handleLogout} fetchCars={fetchCars} />

      <div className="dashboard">
        <h2>{t('serviceDashboard')}</h2>

        {/* Выбор автомобиля */}
        <div className="car-selector-wrapper">
          <select
            className="car-selector"
            onChange={(e) => setSelectedCar(cars.find(car => car.id === e.target.value))}
          >
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.brand} {car.model} ({car.year})
              </option>
            ))}
          </select>
        </div>

        {/* Отображение данных об автомобилях */}
        {cars.length > 0 ? (
          cars.map((car) => (
            <div key={car.id} className="car-item">
              <h3>{car.brand} {car.model} ({car.year})</h3>
              <p>{t('mileage')}: {car.mileage} км</p>
              <p>{t('vin')}: {car.vin}</p>

              {/* Кнопки действий */}
              <div className="action-buttons">
                <button className="add-button" onClick={() => { setSelectedCar(car); setIsRepairModalOpen(true); }}>
                  {t('addRepair')}
                </button>
                <button className="add-button" onClick={() => { setSelectedCar(car); setIsMaintenanceModalOpen(true); }}>
                  {t('addMaintenance')}
                </button>
                <button className="delete-button" onClick={() => deleteCar(car.id)}>{t('deleteCar')}</button>
              </div>

              {/* История ремонтов */}
              <div className="repair-history">
                <div className="repairs">
                  <h4>{t('repairHistory')}</h4>
                  {car.repairs.length > 0 ? (
                    car.repairs.map((r) => (
                      <div key={r.id} className="repair-entry">
                        <p><strong>{t(r.category)}</strong>: {r.description}</p>
                        <p>{t('mileage')}: {r.mileage} км</p>
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

              {/* История ТО */}
              <div className="maintenance-history">
                <h4>{t('maintenanceHistory')}</h4>
                {car.maintenance.length > 0 ? (
                  car.maintenance.map((m) => (
                    <div key={m.id} className="maintenance-entry">
                      {m.oil_change && <p>{t('oilChange')}: {m.oil_change_mileage} км</p>}
                      {m.oil_change_date && <p>{t('oilChangeDate')}: {new Date(m.oil_change_date).toLocaleDateString()}</p>}
                      {m.filter_change && <p>{t('filterChange')}</p>}
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
          ))
        ) : (
          <p>{t('noCarsLinked')}</p>
        )}

        {/* Модальное окно добавления ремонта */}
        {isRepairModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>{t('addRepair')}</h3>
              <form onSubmit={(e) => {
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
              }}>
                <select name="category" required>
                  <option value="">{t('selectCategory')}</option>
                  {repairCategories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select name="subcategory">
                  <option value="">{t('selectSubcategory')}</option>
                  {repairSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.name}>
                      {subcategory.name}
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

        {/* Модальное окно добавления ТО */}
        {isMaintenanceModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>{t('addMaintenance')}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const maintenanceData = {
                  oil_change: formData.get('oil_change') === 'on',
                  oil_change_mileage: formData.get('oil_change_mileage'),
                  oil_change_date: formData.get('oil_change_date'),
                  filter_change: formData.get('filter_change') === 'on',
                  brake_check: formData.get('brake_check') === 'on',
                  tire_rotation: formData.get('tire_rotation') === 'on',
                  coolant_flush: formData.get('coolant_flush') === 'on',
                };
                addMaintenance(selectedCar.id, maintenanceData, true);
                setIsMaintenanceModalOpen(false);
              }}>
                <label><input type="checkbox" name="oil_change" /> {t('oilChange')}</label>
                <input type="number" name="oil_change_mileage" placeholder={t('mileageAtOilChange')} />
                <input type="date" name="oil_change_date" />
                <label><input type="checkbox" name="filter_change" /> {t('filterChange')}</label>
                <label><input type="checkbox" name="brake_check" /> {t('brakeCheck')}</label>
                <label><input type="checkbox" name="tire_rotation" /> {t('tireRotation')}</label>
                <label><input type="checkbox" name="coolant_flush" /> {t('coolantFlush')}</label>
                <button type="submit">{t('save')}</button>
                <button type="button" onClick={() => setIsMaintenanceModalOpen(false)}>{t('cancel')}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}