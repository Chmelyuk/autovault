import React, { useState } from "react";

export default function EditRepairModal({ repair, setRepairs, closeModal, supabase }) {
  const [editRepair, setEditRepair] = useState({ ...repair });

  const updateRepair = async () => {
    const { data, error } = await supabase.from("repairs").update(editRepair).eq("id", editRepair.id).single();

    if (error) console.error("Error updating repair:", error.message);
    else {
      setRepairs((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      closeModal();
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Edit Repair</h3>
        <input type="text" value={editRepair.category} onChange={(e) => setEditRepair({ ...editRepair, category: e.target.value })} placeholder="Category" />
        <button onClick={updateRepair}>Save</button>
        <button onClick={closeModal}>Cancel</button>
      </div>
    </div>
  );
}
