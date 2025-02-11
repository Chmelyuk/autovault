import React, { useState, useEffect } from 'react';
import Header from './Header';
import CarDetails from './CarDetails';
import './Dashboard.css'
import CarTracker from "./CarTracker";
import ProgressBar from './ProgressBar';


export default function Dashboard({ user, supabase, handleLogout }) {
    const [cars, setCars] = useState([]);
const [repairSubcategory, setRepairSubcategory] = useState(""); // 🔹 Для подкатегории
const [customCategory, setCustomCategory] = useState(""); // 🔹 Для "Другое"
const [repairMileage, setRepairMileage] = useState(""); // 🔹 Для пробега
    const [editMaintenance, setEditMaintenance] = useState(null);
const [isEditMaintenanceModalOpen, setIsEditMaintenanceModalOpen] = useState(false);
    const [isEditRepairModalOpen, setIsEditRepairModalOpen] = useState(false);
const [editRepair, setEditRepair] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);// Окно редактирования
  const [editCar, setEditCar] = useState(null);
          const [updateStatus, setUpdateStatus] = useState("");
  const [car, setCar] = useState(null);
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
  });
  
  const fetchCars = async () => {  // 🆕 Теперь fetchCars доступна в компоненте
    if (!user) return;

    const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    console.log("📡 Загруженные машины:", data);

    if (error) {
        console.error("❌ Ошибка при загрузке машин:", error.message);
    } else {
        setCars(data);
        setCar(data.length > 0 ? data[0] : null);
    }
};

useEffect(() => {
    fetchCars(); // ✅ Теперь fetchCars вызывается правильно
}, [user]);

  const updateCar = async () => {
    if (!editCar || !editCar.id) return;

    console.log("🔄 Отправляем обновленные данные:", editCar);

    const { data, error } = await supabase
      .from("cars")
      .update({
        brand: editCar.brand,
        model: editCar.model,
        year: editCar.year,
        engine: editCar.engine,
        mileage: editCar.mileage,
        vin: editCar.vin,
        fuelType: editCar.fuelType,
        transmissionType: editCar.transmissionType,
        turbocharged: editCar.turbocharged,
      })
      .eq("id", editCar.id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Ошибка при обновлении машины:", error.message);
    } else {
      console.log("✅ Успешное обновление машины:", data);
      setCar(data); // Обновляем состояние
      closeEditModal();
    }
};

useEffect(() => {
    const fetchCarDetails = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("cars")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(); // 👈 Добавил `maybeSingle()`, чтобы не было ошибки при пустом ответе

        if (error) {
            console.error("Fetch error:", error.message);
        } else if (data) {
            setCar(data);
        }
    };

    fetchCarDetails();
}, [user]);

// 🔹 Загружаем ремонты только после загрузки машины
useEffect(() => {
    if (car?.id) {
        fetchRepairs(car.id);
        fetchMaintenance(car.id);
    }
}, [car]);


const openEditMaintenanceModal = (maintenanceRecord) => {
  setEditMaintenance({ ...maintenanceRecord });
  setIsEditMaintenanceModalOpen(true);
};
const updateMaintenance = async () => {
  if (!editMaintenance || !editMaintenance.id) return;

  const { data, error } = await supabase
    .from("maintenance")
    .update({
      oil_change: editMaintenance.oil_change,
      filter_change: editMaintenance.filter_change,
      brake_check: editMaintenance.brake_check,
      tire_rotation: editMaintenance.tire_rotation,
      coolant_flush: editMaintenance.coolant_flush,
      oil_change_mileage: editMaintenance.oil_change ? editMaintenance.oil_change_mileage : null,
    })
    .eq("id", editMaintenance.id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating maintenance:", error.message);
  } else {
    setMaintenanceRecords(maintenanceRecords.map((m) => (m.id === data.id ? data : m)));
    setIsEditMaintenanceModalOpen(false);
  }
};

  // Получение списка ремонтов
  const fetchRepairs = async (carId) => {
    console.log("📡 Загружаем ремонты для car_id:", carId, "и user_id:", user.id);

    const { data, error } = await supabase
        .from("repairs")
        .select("*")
        .eq("car_id", carId)
        .eq("user_id", user.id); // 👈 Фильтр по `user_id`

    if (error) {
        console.error("❌ Ошибка при загрузке ремонтов:", error.message);
    } else {
        console.log("✅ Полученные ремонты:", data);
        setRepairs(data);
    }
};
useEffect(() => {
    console.log("🔹 Текущий user.id:", user?.id);
}, [user]);

  // Получение истории ТО
  const fetchMaintenance = async (carId) => {
    const { data, error } = await supabase.from("maintenance").select("*").eq("car_id", carId);
    if (error) console.error("Error fetching maintenance:", error.message);
    else setMaintenanceRecords(data);
  };
const updateRepair = async () => {
  if (!editRepair || !editRepair.id) return;

  const { data, error } = await supabase
    .from("repairs")
    .update({
      category: editRepair.category,
      description: editRepair.description,
    })
    .eq("id", editRepair.id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating repair:", error.message);
  } else {
    setRepairs(repairs.map((r) => (r.id === data.id ? data : r)));
    setIsEditRepairModalOpen(false);
  }
};
const deleteRepair = async (repairId) => {
  if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) return;

  const { error } = await supabase.from("repairs").delete().eq("id", repairId);

  if (error) {
    console.error("Error deleting repair:", error.message);
  } else {
    setRepairs(repairs.filter((r) => r.id !== repairId));
  }
};

  // Добавление ремонта
 const addRepair = async () => {
    if (!car) {
        console.error("Ошибка: Машина не выбрана!");
        return;
    }

    console.log("Добавляем ремонт:", {
        user_id: user.id,
        car_id: car.id,
        category: repairCategory,
        subcategory: repairSubcategory,
        description: repairDescription,
        mileage: parseInt(repairMileage, 10),
        date: new Date().toISOString(),
    });

    try {
        const { data, error } = await supabase.from("repairs").insert([
            {
                user_id: user.id,
                car_id: car.id,
                category: repairCategory,
                subcategory: repairSubcategory || null,
                description: repairDescription,
                mileage: parseInt(repairMileage, 10) || null,
                date: new Date().toISOString(),
            },
        ]).select("*");

        if (error) {
            console.error("Ошибка при добавлении ремонта:", error.message);
            return;
        }

        console.log("✅ Ремонт добавлен:", data);
        setRepairs(prev => [...prev, ...data]); // ✅ Теперь состояние обновляется правильно
        setIsRepairModalOpen(false);
        setRepairCategory("");
        setRepairSubcategory("");
        setRepairDescription("");
        setRepairMileage("");

        // 🔹 Если введён пробег больше текущего, обновляем `car.mileage`
        if (repairMileage && parseInt(repairMileage, 10) > car.mileage) {
            updateCarMileage(parseInt(repairMileage, 10));
        }
    } catch (err) {
        console.error("❌ Ошибка при добавлении ремонта:", err);
    }
};


{updateStatus && <div className="update-status">{updateStatus}</div>}
  // Добавление планового ТО
 const addMaintenance = async () => {
    console.log("Attempting to insert maintenance:", {
        user_id: user.id,
        car_id: car.id,
        oil_change: maintenance.oilChange,
        oil_change_mileage: maintenance.oilChange ? maintenance.oilChangeMileage : null,
        filter_change: maintenance.filterChange,
        brake_check: maintenance.brakeCheck,
        tire_rotation: maintenance.tireRotation,
        coolant_flush: maintenance.coolantFlush,
    });

    try {
        const { data, error } = await supabase.from("maintenance").insert([
            {
                user_id: user.id,
                car_id: car.id,
                oil_change: maintenance.oilChange,
                oil_change_mileage: maintenance.oilChange ? maintenance.oilChangeMileage : null,
                oil_change_date: maintenance.oilChange ? new Date().toISOString() : null,
                filter_change: maintenance.filterChange,
                brake_check: maintenance.brakeCheck,
                tire_rotation: maintenance.tireRotation,
                coolant_flush: maintenance.coolantFlush,
            },
        ]).select("*");

        if (error) {
            console.error("Error adding maintenance:", error.message);
            return;
        }

        console.log("Maintenance added:", data);
        setMaintenanceRecords([...maintenanceRecords, ...data]);
        setIsMaintenanceModalOpen(false);

        // 🔹 Если введён пробег больше текущего, обновляем `car.mileage`
        if (maintenance.oilChange && maintenance.oilChangeMileage > car.mileage) {
            updateCarMileage(maintenance.oilChangeMileage);
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    }
};
const updateCarMileage = async (newMileage) => {
    if (!car || newMileage <= car.mileage) return; // Пробег обновляется только если он выше

    console.log(`🔹 Обновляем пробег: ${car.mileage} → ${newMileage} км`);

    const { data, error } = await supabase
        .from("cars")
        .update({ mileage: newMileage })
        .eq("id", car.id)
        .select("*")
        .single();

    if (error) {
        console.error("❌ Ошибка обновления пробега:", error.message);
    } else {
        console.log("✅ Пробег успешно обновлён:", data);
        setCar(data); // Обновляем машину в `useState`
    }
};

const openEditModal = () => {
    setEditCar({ ...car }); // ✅ Загружаем данные машины в форму
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
   setIsEditModalOpen(false);
  };

 const handleCarUpdate = async (updatedCar) => {
  if (!updatedCar?.id) {
    console.error("Error: Car ID is missing. Trying to insert a new car.");
    return;
  }

  try {
    console.log("Attempting to update car with data:", updatedCar);

    setUpdateStatus("Updating...");

    const { data, error } = await supabase
      .from("cars")
      .update({
        brand: updatedCar.brand,
        model: updatedCar.model,
        year: updatedCar.year,
        engine: updatedCar.engine,
        mileage: updatedCar.mileage,
        vin: updatedCar.vin,
        fuelType: updatedCar.fuelType,
        transmissionType: updatedCar.transmissionType,
        turbocharged: updatedCar.turbocharged,
      })
      .eq("id", updatedCar.id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating car details:", error.message);
      setUpdateStatus("Error updating car");
      return;
    }

    if (data) {
      console.log("Update successful, data received:", data);
      setCar(data); // ✅ Теперь 'data' определено
      setUpdateStatus("Updated");
      setTimeout(() => setUpdateStatus(""), 1000);
      closeEditModal();
    } else {
      console.error("No car data returned from the database");
      setUpdateStatus("Update failed");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    setUpdateStatus("Unexpected error");
  }
};
const deleteMaintenance = async (maintenanceId) => {
  if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) return;

  const { error } = await supabase.from("maintenance").delete().eq("id", maintenanceId);

  if (error) {
    console.error("Error deleting maintenance:", error.message);
  } else {
    setMaintenanceRecords(maintenanceRecords.filter((m) => m.id !== maintenanceId));
  }
};



const calculateOilChangeMileage = (car, maintenanceRecords) => {
  if (!car || !maintenanceRecords.length) return "Нет данных";

  const baseIntervals = {
    Petrol: 10000,
    Diesel: 8000,
    Hybrid: 12000,
    Electric: null, // Электрокару не требуется
  };

  let interval = baseIntervals[car.fuelType] || 10000;
  if (interval === null) return "Не требуется"; // Для электромобилей

  if (car.mileage > 200000) interval *= 0.8;
  else if (car.mileage > 100000) interval *= 0.9;

  switch (car.oilType) {
    case "Semi-Synthetic":
      interval *= 0.85;
      break;
    case "Mineral":
      interval *= 0.75;
      break;
    default:
      break;
  }

  interval = Math.round(interval / 500) * 500;

  // Найти последнюю замену масла
  const lastOilChange = maintenanceRecords
    .filter((record) => record.oil_change && record.oil_change_mileage)
    .sort((a, b) => b.oil_change_mileage - a.oil_change_mileage)[0];

  if (!lastOilChange) return "Нет данных о последней замене";

  console.log("Последняя замена масла:", lastOilChange);

  const lastMileage = lastOilChange.oil_change_mileage;
  const nextChangeAt = lastMileage + interval;
  const remainingMileage = nextChangeAt - car.mileage;
 

  return remainingMileage <= 0
    ? "🔴 Требуется замена!"
    : `🟢 Осталось ${remainingMileage.toLocaleString()} км до замены`;
};


const shouldChangeOil = (currentMileage, lastOilChangeMileage, lastOilChangeDate) => {
    const mileageThreshold = 10000; // например, менять каждые 10 тыс. км
    const timeThreshold = 6 * 30 * 24 * 60 * 60 * 1000; // 6 месяцев в миллисекундах

    const mileageExceeded = currentMileage - lastOilChangeMileage >= mileageThreshold;
    const timeExceeded = new Date() - new Date(lastOilChangeDate) >= timeThreshold;

    return mileageExceeded || timeExceeded;
};

useEffect(() => {
    if (car?.id) {
        fetchRepairs(car.id);
        fetchMaintenance(car.id);
    }
}, [car]);

useEffect(() => {
    if (car?.id) {
        console.log("📡 Загружаем данные для машины:", car.id);

        fetchRepairs(car.id);
        fetchMaintenance(car.id);
    }
}, [car]);

useEffect(() => {
    if (car?.id) {
        fetchRepairs(car.id); // Загружаем ремонты для выбранного автомобиля
        fetchMaintenance(car.id); // Также обновляем данные о ТО, если это необходимо
    }
}, [car]);


const calculateRemainingMileage = (car, maintenanceRecords) => {
  const lastOilChange = maintenanceRecords
    .filter((record) => record.oil_change && record.oil_change_mileage)
    .sort((a, b) => b.oil_change_mileage - a.oil_change_mileage)[0];

  if (!lastOilChange) return 0;

  const lastMileage = lastOilChange.oil_change_mileage;
  const nextChangeAt = lastMileage + calculateTotalMileageInterval(car, maintenanceRecords);
  const remainingMileage = nextChangeAt - car.mileage;

  return remainingMileage > 0 ? remainingMileage : 0;
};

const getProgressColor = (percentage) => {
    if (percentage >= 75) return "green";  // ✅ Хорошее состояние
    if (percentage >= 40) return "orange"; // ⚠️ Пора планировать замену
    return "red";  // 🔴 Срочно менять!
};
const calculateTotalMileageInterval = (car, maintenanceRecords) => {
  const baseIntervals = {
    Petrol: 10000,
    Diesel: 8000,
    Hybrid: 12000,
    Electric: null,
  };

  let interval = baseIntervals[car.fuelType] || 10000;
  if (interval === null) return 0;

  if (car.mileage > 200000) interval *= 0.8;
  else if (car.mileage > 100000) interval *= 0.9;

  switch (car.oilType) {
    case "Semi-Synthetic":
      interval *= 0.85;
      break;
    case "Mineral":
      interval *= 0.75;
      break;
    default:
      break;
  }

  return Math.round(interval / 500) * 500;
};


  return (
    <>
    
    {isEditModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Car Details</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCar();
              }}
            >
              <input
                type="text"
                value={editCar?.brand || ""}
                onChange={(e) => setEditCar({ ...editCar, brand: e.target.value })}
                placeholder="Car Brand"
              />
              <input
                type="text"
                value={editCar?.model || ""}
                onChange={(e) => setEditCar({ ...editCar, model: e.target.value })}
                placeholder="Car Model"
              />
              <input
                type="number"
                value={editCar?.year || ""}
                onChange={(e) => setEditCar({ ...editCar, year: e.target.value })}
                placeholder="Year"
              />
              <input
                type="text"
                value={editCar?.engine || ""}
                onChange={(e) => setEditCar({ ...editCar, engine: e.target.value })}
                placeholder="Engine"
              />
              <input
                type="number"
                value={editCar?.mileage || ""}
                onChange={(e) => setEditCar({ ...editCar, mileage: e.target.value })}
                placeholder="Mileage"
              />
              <input
                type="text"
                value={editCar?.vin || ""}
                onChange={(e) => setEditCar({ ...editCar, vin: e.target.value })}
                placeholder="VIN"
              />
              <select
                value={editCar?.fuelType || ""}
                onChange={(e) => setEditCar({ ...editCar, fuelType: e.target.value })}
              >
                <option value="">Select Fuel Type</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <select
                value={editCar?.transmissionType || ""}
                onChange={(e) => setEditCar({ ...editCar, transmissionType: e.target.value })}
              >
                <option value="">Select Transmission</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="CVT">CVT</option>
                <option value="Dual-clutch">Dual-clutch</option>
              </select>
               
  <label className="checkbox-label">
  <input
    placeholder=""
    type="checkbox"
    checked={editCar?.turbocharged || false}
    onChange={(e) => setEditCar({ ...editCar, turbocharged: e.target.checked })}
  />
  <span>Turbocharged</span>
</label>

              <button type="submit">Save</button>
              <button type="button" onClick={closeEditModal}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )} 

     <Header fetchCars={fetchCars} fetchRepairs={fetchRepairs}
       handleLogout={handleLogout} user={user} openEditModal={openEditModal} />
     
      <div className="dashboard">
       <div className="car-selector-wrapper">
    <select 
        className="car-selector" 
        value={car?.id} 
        onChange={(e) => setCar(cars.find(c => c.id === e.target.value))}
    >
        {cars.map(c => (
            <option key={c.id} value={c.id}>
                {c.brand} {c.model} ({c.year})
            </option>
        ))}
    </select>
</div>
              <CarDetails user={user} supabase={supabase} car={car} setCar={setCar} />
        {car && maintenanceRecords.length > 0 ? (
  <p>{car && maintenanceRecords.length > 0 ? (
  <div>
    <strong> Замена масла:</strong>
    <br/>
    <br/>
    <br/>
    <ProgressBar 
      progress={calculateRemainingMileage(car, maintenanceRecords)} 
      total={calculateTotalMileageInterval(car, maintenanceRecords)} 
    />
  </div>
) : (
  <p>⏳ Загружаем данные...</p>
)}</p>
) : (
  <p>⏳ Загружаем данные...</p>
)}
        {/* Кнопки для добавления ремонтов и ТО */}
        <div className="action-buttons">
    <button className="add-button" onClick={() => setIsRepairModalOpen(true)}>Add Repair</button>
    <button className="add-button" onClick={() => setIsMaintenanceModalOpen(true)}>Add Maintenance</button>
  </div>

        {/* Отображение списка ремонтов */}
        <h3>Repair History</h3>
        <CarTracker user={user} car={car} supabase={supabase} setCar={setCar} />
       
   <div className='repair-history'>    <ul>
  {repairs.length > 0 ? (
    repairs.map((repair) => (
      <li key={repair.id}>
        <strong>{repair.category}</strong> 
        {repair.subcategory && ` Subcategory: ${repair.subcategory}`} 
        <p>{repair.description}</p>
        {repair.mileage && <p>🛠 Пробег на момент ремонта: {repair.mileage} км</p>}

        <div className="button-container">
          <button onClick={() => {
            setEditRepair(repair);
            setIsEditRepairModalOpen(true);
          }}>Edit</button>
          <button onClick={() => deleteRepair(repair.id)}>Delete</button>
        </div>
      </li>
    ))
  ) : (
    <p>Нет данных о ремонтах.</p>
  )}
</ul></div>

        {/* Отображение истории ТО */}
       
<div className="maintenance-history">
<ul >
  {maintenanceRecords.map((record) => (
    <li key={record.id}>
      {new Date(record.date).toLocaleDateString()}<br/> 
      {record.oil_change && `Oil Change on ${record.oil_change_date ? new Date(record.oil_change_date).toLocaleDateString() : "Unknown Date"} at ${record.oil_change_mileage || "Unknown"} km`}
      {record.filter_change && " Filter Change,"}
      {record.brake_check && " Brake Check,"}
      {record.tire_rotation && " Tire Rotation,"}
      {record.coolant_flush && " Coolant Flush"}

      




      <div className="button-container">
        <button onClick={() => openEditMaintenanceModal(record)}>Edit</button>
        <button onClick={() => deleteMaintenance(record.id)}>Delete</button>
        
      </div>
      <br/>
      {record.oil_change && ( 
    <ProgressBar 
      progress={calculateRemainingMileage(car, maintenanceRecords)} 
      total={calculateTotalMileageInterval(car, maintenanceRecords)} 
    />
  

)}
    </li>
  ))}
</ul></div>
      </div>

      {/* Модальное окно для ремонта */}
     {isRepairModalOpen && (
  <div className="modal">
    <div className="modal-content">
      <h3>Add Repair</h3>

      {/* Категория ремонта */}
      <select value={repairCategory} onChange={(e) => setRepairCategory(e.target.value)}>
        <option value="">Select Category</option>
        <option value="Engine">Engine</option>
        <option value="Brakes">Brakes</option>
        <option value="Suspension">Suspension</option>
        <option value="Electronics">Electronics</option>
        <option value="Bodywork">Bodywork</option>
        <option value="Other">Other</option> {/* Добавляем "Другое" */}
      </select>

      {/* Подкатегория ремонта */}
      {repairCategory && repairCategory !== "Other" && (
        <select value={repairSubcategory} onChange={(e) => setRepairSubcategory(e.target.value)}>
          <option value="">Select Subcategory</option>
          {repairCategory === "Engine" && (
            <>
              <option value="Oil Leak">Oil Leak</option>
              <option value="Timing Belt">Timing Belt</option>
              <option value="Cylinder Head">Cylinder Head</option>
              <option value="Piston Rings">Piston Rings</option>
              <option value="Other">Other</option>
            </>
          )}
          {repairCategory === "Brakes" && (
            <>
              <option value="Pads Replacement">Pads Replacement</option>
              <option value="Brake Discs">Brake Discs</option>
              <option value="Brake Fluid">Brake Fluid</option>
              <option value="Other">Other</option>
            </>
          )}
        </select>
      )}

      {/* Поле "Другое", если выбрана "Other" */}
      {(repairCategory === "Other" || repairSubcategory === "Other") && (
        <input
          type="text"
          placeholder="Enter custom category"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
        />
      )}

      {/* Описание ремонта */}
      <textarea 
        placeholder="Description" 
        value={repairDescription} 
        onChange={(e) => setRepairDescription(e.target.value)} 
      />

      {/* Поле пробега */}
      <input 
        type="number" 
        placeholder="Mileage at Repair" 
        value={repairMileage} 
        onChange={(e) => setRepairMileage(e.target.value)} 
      />

      {/* Кнопки */}
      <button onClick={addRepair}>Save</button>
      <button onClick={() => setIsRepairModalOpen(false)}>Cancel</button>
    </div>
  </div>
)}

      {/* Модальное окно для ТО */}
      {isMaintenanceModalOpen && (
       <div className="modal">
  <div className="modal-content">
    <h3>Add Maintenance</h3>

    {/* Кнопка выбора всех чекбоксов */}
   <button
  onClick={() => {
    setMaintenance((prevState) => {
      const allChecked = Object.values(prevState).every((val) => val);
      return {
        oilChange: !allChecked,
        filterChange: !allChecked,
        brakeCheck: !allChecked,
        tireRotation: !allChecked,
        coolantFlush: !allChecked,
      };
    });
  }}
>
  {Object.values(maintenance).every((val) => val) ? "Deselect All" : "Select All"}
</button>
    {/* Чекбоксы */}
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={maintenance.oilChange}
        onChange={(e) => setMaintenance({ ...maintenance, oilChange: e.target.checked })}
      />
      Oil Change
    </label>

    {/* Поле пробега при замене масла (отображается только если oilChange включен) */}
    {maintenance.oilChange && (
      <input
        type="number"
        placeholder="Mileage at Oil Change"
        value={maintenance.oilChangeMileage || ""}
        onChange={(e) => setMaintenance({ ...maintenance, oilChangeMileage: e.target.value })}
      />
    )}

   <label className="checkbox-label">
      <input
        type="checkbox"
        checked={maintenance.filterChange}
        onChange={(e) => setMaintenance({ ...maintenance, filterChange: e.target.checked })}
      />
      Filter Change
    </label>
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={maintenance.brakeCheck}
        onChange={(e) => setMaintenance({ ...maintenance, brakeCheck: e.target.checked })}
      />
      Brake Check
    </label>
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={maintenance.tireRotation}
        onChange={(e) => setMaintenance({ ...maintenance, tireRotation: e.target.checked })}
      />
      Tire Rotation
    </label>
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={maintenance.coolantFlush}
        onChange={(e) => setMaintenance({ ...maintenance, coolantFlush: e.target.checked })}
      />
      Coolant Flush
    </label>

    <button onClick={addMaintenance}>Save</button>
    <button onClick={() => setIsMaintenanceModalOpen(false)}>Cancel</button>
  </div>
</div>

      )}

      {isEditMaintenanceModalOpen && (
  <div className="modal">
    <div className="modal-content">
      <h3>Edit Maintenance</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMaintenance();
        }}
      >
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={editMaintenance?.oil_change || false}
            onChange={(e) => setEditMaintenance({ ...editMaintenance, oil_change: e.target.checked })}
          />
          Oil Change
        </label>

        {editMaintenance?.oil_change && (
          <input
            type="number"
            placeholder="Mileage at Oil Change"
            value={editMaintenance?.oil_change_mileage || ""}
            onChange={(e) => setEditMaintenance({ ...editMaintenance, oil_change_mileage: e.target.value })}
          />
        )}

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={editMaintenance?.filter_change || false}
            onChange={(e) => setEditMaintenance({ ...editMaintenance, filter_change: e.target.checked })}
          />
          Filter Change
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={editMaintenance?.brake_check || false}
            onChange={(e) => setEditMaintenance({ ...editMaintenance, brake_check: e.target.checked })}
          />
          Brake Check
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={editMaintenance?.tire_rotation || false}
            onChange={(e) => setEditMaintenance({ ...editMaintenance, tire_rotation: e.target.checked })}
          />
          Tire Rotation
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={editMaintenance?.coolant_flush || false}
            onChange={(e) => setEditMaintenance({ ...editMaintenance, coolant_flush: e.target.checked })}
          />
          Coolant Flush
        </label>

        <button type="submit">Save</button>
        <button type="button" onClick={() => setIsEditMaintenanceModalOpen(false)}>
          Cancel
        </button>
      </form>
    </div>
  </div>
)} 
{isEditRepairModalOpen && (
  <div className="modal">
    <div className="modal-content">
      <h3>Edit Repair</h3>
      <select
        value={editRepair?.category || ""}
        onChange={(e) => setEditRepair({ ...editRepair, category: e.target.value })}
      >
        <option value="">Select Category</option>
        <option value="Engine">Engine</option>
        <option value="Brakes">Brakes</option>
        <option value="Suspension">Suspension</option>
        <option value="Electronics">Electronics</option>
        <option value="Bodywork">Bodywork</option>
      </select>
      <textarea
        placeholder="Description"
        value={editRepair?.description || ""}
        onChange={(e) => setEditRepair({ ...editRepair, description: e.target.value })}
      />
      <button onClick={updateRepair}>Save</button>
      <button onClick={() => setIsEditRepairModalOpen(false)}>Cancel</button>
    </div>
  </div>
)}

    </>
  );
}