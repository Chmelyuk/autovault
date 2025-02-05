import React from 'react';

export default function MaintenanceList({ maintenanceRecords }) {
  return (
    <div>
      <h3>Maintenance History</h3>
      <ul>
        {maintenanceRecords.map((record) => (
          <li key={record.id}>
            {new Date(record.date).toISOString().split("T")[0]}:
            {record.oil_change && ` Oil Change${record.oil_change_mileage ? ` at ${record.oil_change_mileage} km` : ""}`}
            {record.filter_change && " Filter Change,"}
            {record.brake_check && " Brake Check,"}
            {record.tire_rotation && " Tire Rotation,"}
            {record.coolant_flush && " Coolant Flush"}
          </li>
        ))}
      </ul>
    </div>
  );
}
