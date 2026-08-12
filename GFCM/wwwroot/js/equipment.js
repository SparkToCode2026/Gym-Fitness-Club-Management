requireAuth();

let editModal, decommissionModal, addModal;
let equipmentToDecommissionId = null;

document.addEventListener("DOMContentLoaded", () => {
  editModal = new bootstrap.Modal(document.getElementById("editEquipmentModal"));
  decommissionModal = new bootstrap.Modal(document.getElementById("decommissionModal"));
  addModal = new bootstrap.Modal(document.getElementById("addEquipmentModal"));

  // today's date as max for purchase date input
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("addEquipmentDate").setAttribute("max", today);

  loadEquipment();
  loadStatusBreakdown();
  loadBranchOptions();

  document.getElementById("applyFilterBtn").addEventListener("click", applyFilter);
  document.getElementById("clearFilterBtn").addEventListener("click", clearFilter);
  document.getElementById("submitAddEquipmentBtn").addEventListener("click", submitAddEquipment);
  document.getElementById("submitEditEquipmentBtn").addEventListener("click", submitEditEquipment);
  document.getElementById("confirmDecommissionBtn").addEventListener("click", confirmDecommission);
});

function statusBadgeClass(status) {
  if (status === "Operational") return "bg-success";
  if (status === "UnderMaintenance") return "bg-warning text-dark";
  if (status === "Retired") return "bg-secondary";
  return "bg-secondary";
}

// Load branch dropdown for both filter and add form
async function loadBranchOptions() {
  try {
    const result = await api("/branch/getAll");
    const branches = Array.isArray(result) ? result : (result.branches || []);

    const filterSel = document.getElementById("branchFilter");
    const addSel = document.getElementById("addEquipmentBranch");

    const optionsHtml = branches
      .map(b => `<option value="${b.branchId}">${b.branchName}</option>`)
      .join("");

    filterSel.innerHTML = `<option value="">All Branches</option>` + optionsHtml;
    addSel.innerHTML = optionsHtml;
  } catch (err) {
    showToast("Could not load branches: " + err.message, "danger");
  }
}

// Case 13 — List
async function loadEquipment() {
  const spinner = document.getElementById("loadingSpinner");
  const emptyState = document.getElementById("emptyState");
  const tbody = document.getElementById("equipmentTableBody");

  spinner.classList.remove("d-none");
  emptyState.classList.add("d-none");
  tbody.innerHTML = "";

  try {
    const equipment = await api("/equipment/getAll");

    spinner.classList.add("d-none");

    if (!equipment || equipment.length === 0) {
      emptyState.classList.remove("d-none");
      return;
    }

    renderEquipmentRows(equipment);
    document.getElementById("resultCount").textContent = "";
  } catch (err) {
    spinner.classList.add("d-none");
    showToast(err.message, "danger");
  }
}

function renderEquipmentRows(equipment) {
  const tbody = document.getElementById("equipmentTableBody");
  tbody.innerHTML = equipment.map(e => `
    <tr>
      <td>${e.equipmentName}</td>
      <td>${e.branchName}</td>
      <td>${new Date(e.purchaseDate).toLocaleDateString()}</td>
      <td>${e.quantity}</td>
      <td>
        <select class="form-select form-select-sm status-select" data-id="${e.equipmentId}">
          <option value="Operational" ${e.maintenanceStatus === "Operational" ? "selected" : ""}>Operational</option>
          <option value="UnderMaintenance" ${e.maintenanceStatus === "UnderMaintenance" ? "selected" : ""}>UnderMaintenance</option>
          <option value="Retired" ${e.maintenanceStatus === "Retired" ? "selected" : ""}>Retired</option>
        </select>
      </td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${e.equipmentId}">Edit</button>
          <button class="btn btn-sm btn-outline-danger decommission-btn" data-id="${e.equipmentId}">Retire</button>
        </div>
      </td>
    </tr>
  `).join("");

  attachRowEvents();
}

function attachRowEvents() {
  document.querySelectorAll(".status-select").forEach(el => {
    el.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;
      try {
        await api(`/equipment/updateStatus?id=${id}&newStatus=${newStatus}`, "PATCH");
        showToast("Status updated", "success");
        loadEquipment();
        loadStatusBreakdown();
      } catch (err) {
        showToast(err.message, "danger");
      }
    });
  });

  // Edit now fetches fresh data via GET /equipment/get instead of relying on row data
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      try {
        const equipment = await api(`/equipment/get?id=${id}`);
        document.getElementById("editEquipmentId").value = equipment.equipmentId;
        document.getElementById("editEquipmentName").value = equipment.equipmentName;
        document.getElementById("editEquipmentQuantity").value = equipment.quantity;
        document.getElementById("editEquipmentError").classList.add("d-none");
        editModal.show();
      } catch (err) {
        showToast(err.message, "danger");
      }
    });
  });

  document.querySelectorAll(".decommission-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      equipmentToDecommissionId = e.target.dataset.id;
      document.getElementById("decommissionId").value = equipmentToDecommissionId;
      decommissionModal.show();
    });
  });
}

// Case 14 — Add
async function submitAddEquipment() {
  const errorBox = document.getElementById("addEquipmentError");
  errorBox.classList.add("d-none");

  const body = {
    equipmentName: document.getElementById("addEquipmentName").value.trim(),
    branchId: Number(document.getElementById("addEquipmentBranch").value),
    purchaseDate: document.getElementById("addEquipmentDate").value,
    quantity: Number(document.getElementById("addEquipmentQuantity").value)
  };

  try {
    await api("/equipment/add", "POST", body);
    addModal.hide();
    showToast("Equipment added", "success");
    loadEquipment();
    loadStatusBreakdown();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

// Case 15 — Edit
async function submitEditEquipment() {
  const errorBox = document.getElementById("editEquipmentError");
  errorBox.classList.add("d-none");

  const id = document.getElementById("editEquipmentId").value;
  const body = {
    equipmentName: document.getElementById("editEquipmentName").value.trim(),
    quantity: Number(document.getElementById("editEquipmentQuantity").value)
  };

  try {
    await api(`/equipment/update?id=${id}`, "PUT", body);
    editModal.hide();
    showToast("Equipment updated", "success");
    loadEquipment();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

// Case 17 — Decommission (soft delete)
async function confirmDecommission() {
  try {
    await api(`/equipment/remove?id=${equipmentToDecommissionId}`, "DELETE");
    decommissionModal.hide();
    showToast("Equipment retired", "success");
    loadEquipment();
    loadStatusBreakdown();
  } catch (err) {
    showToast(err.message, "danger");
  }
}

// Case 18 — Filter (backend only filters when BOTH branch and status are set)
async function applyFilter() {
  const branchId = document.getElementById("branchFilter").value;
  const status = document.getElementById("statusFilter").value;

  if (!branchId || !status) {
    showToast("Select both a branch and a status to filter", "warning");
    return;
  }

  try {
    const result = await api(`/equipment/getByBranch?branchId=${branchId}&status=${status}`);
    renderEquipmentRows(result.Data);
    document.getElementById("resultCount").textContent = `${result.Count} result(s)`;
  } catch (err) {
    showToast(err.message, "danger");
  }
}

function clearFilter() {
  document.getElementById("branchFilter").value = "";
  document.getElementById("statusFilter").value = "";
  loadEquipment();
}

// Case 18 — Status breakdown
async function loadStatusBreakdown() {
  const container = document.getElementById("statusBreakdown");
  try {
    const breakdown = await api("/equipment/countByStatus");

    if (!breakdown || breakdown.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = breakdown.map(b => `
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <span class="badge ${statusBadgeClass(b.status)} mb-2">${b.status}</span>
            <div class="small text-muted">Records: ${b.records}</div>
            <div class="fs-5">${b.totalUnits} units</div>
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<span class="text-danger">${err.message}</span>`;
  }
}