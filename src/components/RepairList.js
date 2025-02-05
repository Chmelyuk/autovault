import React from 'react';

export default function RepairsList({ repairs, setEditRepair, deleteRepair }) {
  return (
    <div>
      <h3>Repair History</h3>
      <ul>
        {repairs.map((repair) => (
          <li key={repair.id}>
            {new Date(repair.date).toISOString().split("T")[0]}: {repair.category} - {repair.description}
            <button onClick={() => setEditRepair(repair)}>Edit</button>
            <button onClick={() => deleteRepair(repair.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
