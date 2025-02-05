import React, { useState, useEffect } from "react";

export default function EditCarModal({ car, setCars, closeModal, supabase }) {
  const [editedCar, setEditedCar] = useState({ ...car });

  // Обновляем состояние, когда car изменяется
  useEffect(() => {
    setEditedCar({ ...car });
  }, [car]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedCar((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateCarInfo = async (updatedCar) => {
    const { data, error } = await supabase
      .from("cars")
      .update(updatedCar)
      .match({ id: updatedCar.id });

    if (error) {
      console.error("Error updating car:", error.message);
    } else {
      setCars((prev) => prev.map((car) => (car.id === updatedCar.id ? data[0] : car)));
      closeModal(); // Закрыть модальное окно после успешного обновления
    }
  };

  const handleSave = () => {
    updateCarInfo(editedCar);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Edit Car Information</h3>
        <label>
          Model:
          <input
            type="text"
            name="model"
            value={editedCar.model || ""}
            onChange={handleChange}
          />
        </label>
        <label>
          Brand:
          <input
            type="text"
            name="brand"
            value={editedCar.brand || ""}
            onChange={handleChange}
          />
        </label>
        <label>
          Year:
          <input
            type="number"
            name="year"
            value={editedCar.year || ""}
            onChange={handleChange}
          />
        </label>
        <label>
          Mileage:
          <input
            type="number"
            name="mileage"
            value={editedCar.mileage || ""}
            onChange={handleChange}
          />
        </label>
        <button onClick={handleSave}>Save</button>
        <button onClick={closeModal}>Cancel</button>
      </div>
    </div>
  );
}
