import React from 'react';

export default function AddMaintenanceModal({ isMaintenanceModalOpen, maintenance, setMaintenance, addMaintenance, closeModal }) {
  return (
    isMaintenanceModalOpen && (
      <div className="modal">
        <div className="modal-content">
          <h3>Add Maintenance</h3>
          <button
            onClick={() => {
              const allChecked = Object.values(maintenance).every((val) => val);
              setMaintenance({
                oilChange: !allChecked,
                filterChange: !allChecked,
                brakeCheck: !allChecked,
                tireRotation: !allChecked,
                coolantFlush: !allChecked,
              });
            }}
          >
            {Object.values(maintenance).every((val) => val) ? "Deselect All" : "Select All"}
          </button>
          <label>
            <input
              type="checkbox"
              checked={maintenance.oilChange}
              onChange={(e) => setMaintenance({ ...maintenance, oilChange: e.target.checked })}
            />
            Oil Change
          </label>
          {maintenance.oilChange && (
            <input
              type="number"
              placeholder="Mileage at Oil Change"
              value={maintenance.oilChangeMileage || ""}
              onChange={(e) => setMaintenance({ ...maintenance, oilChangeMileage: e.target.value })}
            />
          )}
          {/* Add other checkboxes for Filter Change, Brake Check, etc. */}
          <button onClick={addMaintenance}>Save</button>
          <button onClick={closeModal}>Cancel</button>
        </div>
      </div>
    )
  );
}
