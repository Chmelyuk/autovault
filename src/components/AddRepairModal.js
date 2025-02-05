import React from 'react';

export default function AddRepairModal({ isEditRepairModalOpen, editRepair, setEditRepair, updateRepair, closeModal }) {
  return (
    isEditRepairModalOpen && (
      <div className="modal">
        <div className="modal-content">
          <h3>Edit Repair</h3>
          <select
            value={editRepair.category}
            onChange={(e) => setEditRepair({ ...editRepair, category: e.target.value })}
          >
            <option value="Engine">Engine</option>
            <option value="Brakes">Brakes</option>
            <option value="Suspension">Suspension</option>
            <option value="Electronics">Electronics</option>
            <option value="Bodywork">Bodywork</option>
          </select>
          <textarea
            value={editRepair.description}
            onChange={(e) => setEditRepair({ ...editRepair, description: e.target.value })}
          />
          <button onClick={updateRepair}>Save</button>
          <button onClick={closeModal}>Cancel</button>
        </div>
      </div>
    )
  );
}
