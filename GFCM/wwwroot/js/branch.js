// js/branch.js
// all eight BranchController cases are reachable from this page

requireAuth();

let branchModal = null;
let hoursModal = null;

document.addEventListener("DOMContentLoaded", () => {
  branchModal = new bootstrap.Modal(document.getElementById("branchModal"));
  hoursModal = new bootstrap.Modal(document.getElementById("hoursModal"));

  document.getElementById("btnAddBranch").addEventListener("click", openAddModal);
  document.getElementById("btnFilter").addEventListener("click", applyFilter);
  document.getElementById("btnClearFilter").addEventListener("click", clearFilter);
  document.getElementById("branchForm").addEventListener("submit", saveBranch);
  document.getElementById("hoursForm").addEventListener("submit", saveHours);

  // enter in the city box searches instead of doing nothing
  document.getElementById("filterCity").addEventListener("keydown", e => {
    if (e.key === "Enter") applyFilter();
  });

  loadBranches();
  loadReport();
});


// case 05, get all

async function loadBranches() {
  const tbody = document.getElementById("branchTableBody");
  tbody.innerHTML = loadingRow(8);

  try {
    const branches = await api("/branch/getAll");
    renderBranches(branches, "No branches yet. Add one to get started.");
  } catch (err) {
    tbody.innerHTML = errorRow(8, err.message);
    showToast(err.message || "Could not load branches", "danger");
  }
}


// case 07, filter by city

async function applyFilter() {
  const city = document.getElementById("filterCity").value.trim();
  if (!city) return loadBranches();

  const tbody = document.getElementById("branchTableBody");
  tbody.innerHTML = loadingRow(8);

  try {
    // this endpoint returns { count, branches } and the rows carry no counts
    const result = await api(`/branch/getByCity?city=${encodeURIComponent(city)}`);
    renderBranches(result.branches, `No branches found in "${city}".`);
  } catch (err) {
    tbody.innerHTML = errorRow(8, err.message);
    showToast(err.message || "Search failed", "danger");
  }
}

function clearFilter() {
  document.getElementById("filterCity").value = "";
  loadBranches();
}


// rendering

function renderBranches(branches, emptyMessage) {
  const tbody = document.getElementById("branchTableBody");
  const countEl = document.getElementById("branchCount");

  const list = branches || [];
  countEl.textContent = list.length === 1 ? "1 branch" : `${list.length} branches`;

  if (list.length === 0) {
    tbody.innerHTML = emptyRow(8, emptyMessage);
    return;
  }

  tbody.innerHTML = list.map(b => `
    <tr>
      <td class="fw-semibold">${escapeHtml(b.branchName)}</td>
      <td>${escapeHtml(b.branchCity)}</td>
      <td>${b.branchAddress ? escapeHtml(b.branchAddress) : '<span class="nil"></span>'}</td>
      <td>${b.branchPhone ? escapeHtml(b.branchPhone) : '<span class="nil"></span>'}</td>
      <td>${b.openingHours ? escapeHtml(b.openingHours) : '<span class="nil"></span>'}</td>
      <td class="num">${b.trainerCount ?? '<span class="nil"></span>'}</td>
      <td class="num">${b.equipmentCount ?? '<span class="nil"></span>'}</td>
      <td class="table-actions">
        <button class="btn btn-outline-primary" onclick="openEditModal(${b.branchId})">Edit</button>
        <button class="btn btn-outline-secondary" onclick="openHoursModal(${b.branchId})">Hours</button>
        <button class="btn btn-outline-danger" onclick="deleteBranch(${b.branchId})">Delete</button>
      </td>
    </tr>
  `).join("");
}


// case 01 and case 02, add and update

function openAddModal() {
  document.getElementById("branchForm").reset();
  document.getElementById("branchId").value = "";
  document.getElementById("branchModalTitle").textContent = "Add branch";
  document.getElementById("hoursFieldWrap").classList.remove("d-none");
  clearModalError("branchModalError");
  branchModal.show();
}

// case 06, fetch the single branch so the form shows current values
async function openEditModal(id) {
  try {
    const b = await api(`/branch/get?branchId=${id}`);

    document.getElementById("branchForm").reset();
    document.getElementById("branchId").value = b.branchId;
    document.getElementById("branchName").value = b.branchName || "";
    document.getElementById("branchCity").value = b.branchCity || "";
    document.getElementById("branchAddress").value = b.branchAddress || "";
    document.getElementById("branchPhone").value = b.branchPhone || "";

    // update does not copy openingHours, so hide the field rather than
    // showing one that silently does nothing
    document.getElementById("hoursFieldWrap").classList.add("d-none");

    document.getElementById("branchModalTitle").textContent = "Edit branch";
    clearModalError("branchModalError");
    branchModal.show();
  } catch (err) {
    showToast(err.message || "Could not load branch", "danger");
  }
}

async function saveBranch(event) {
  event.preventDefault();
  clearModalError("branchModalError");

  const id = document.getElementById("branchId").value;

  const payload = {
    branchName: document.getElementById("branchName").value.trim(),
    branchCity: document.getElementById("branchCity").value.trim(),
    branchAddress: document.getElementById("branchAddress").value.trim(),
    branchPhone: document.getElementById("branchPhone").value.trim(),
    openingHours: document.getElementById("branchHours").value.trim()
  };

  try {
    if (id) {
      await api(`/branch/update?branchId=${id}`, "PUT", payload);
      showToast("Branch updated");
    } else {
      await api("/branch/add", "POST", payload);
      showToast("Branch created");
    }
    branchModal.hide();
    loadBranches();
    loadReport();
  } catch (err) {
    // show save errors inside the modal so they stay while the user fixes the form
    showModalError("branchModalError", err.message || "Could not save branch");
  }
}


// case 03, opening hours

async function openHoursModal(id) {
  try {
    const b = await api(`/branch/get?branchId=${id}`);
    document.getElementById("hoursForm").reset();
    document.getElementById("hoursBranchId").value = b.branchId;
    document.getElementById("hoursBranchName").textContent = b.branchName;
    document.getElementById("newOpeningHours").value = b.openingHours || "";
    clearModalError("hoursModalError");
    hoursModal.show();
  } catch (err) {
    showToast(err.message || "Could not load branch", "danger");
  }
}

async function saveHours(event) {
  event.preventDefault();
  clearModalError("hoursModalError");

  const id = document.getElementById("hoursBranchId").value;
  const hours = document.getElementById("newOpeningHours").value.trim();

  try {
    // both values are query parameters on this endpoint, there is no body
    await api(`/branch/updateHours?branchId=${id}&openingHours=${encodeURIComponent(hours)}`, "PATCH");
    showToast("Opening hours updated");
    hoursModal.hide();
    loadBranches();
  } catch (err) {
    showModalError("hoursModalError", err.message || "Could not update hours");
  }
}


// case 04, delete

async function deleteBranch(id) {
  const ok = await confirmDialog("Delete this branch? This cannot be undone.");
  if (!ok) return;

  try {
    await api(`/branch/remove?branchId=${id}`, "DELETE");
    showToast("Branch deleted");
    loadBranches();
    loadReport();
  } catch (err) {
    // the api names which table is blocking, so show it as-is
    showToast(err.message || "Could not delete branch", "danger");
  }
}


// case 08, capacity report

async function loadReport() {
  const tbody = document.getElementById("reportTableBody");
  tbody.innerHTML = loadingRow(5);

  try {
    const report = await api("/branch/staffCount");

    if (!report || report.length === 0) {
      tbody.innerHTML = emptyRow(5, "Nothing to report yet.");
      return;
    }

    tbody.innerHTML = report.map(r => `
      <tr>
        <td class="fw-semibold">${escapeHtml(r.branchName)}</td>
        <td>${escapeHtml(r.branchCity)}</td>
        <td class="num">${r.trainers}</td>
        <td class="num">${r.equipmentRecords}</td>
        <td class="num">${r.totalUnits}</td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = errorRow(5, err.message);
  }
}


// small helpers

function loadingRow(colspan) {
  return `<tr><td colspan="${colspan}" class="loading-cell">
    <div class="spinner-border spinner-border-sm text-primary" role="status">
      <span class="visually-hidden">Loading</span>
    </div>
  </td></tr>`;
}

function errorRow(colspan, message) {
  return `<tr><td colspan="${colspan}" class="empty-state">
    <div class="empty-title">Could not load</div>
    <div class="empty-hint">${escapeHtml(message || "Something went wrong.")}</div>
  </td></tr>`;
}

function showModalError(elementId, message) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.classList.add("show");
}

function clearModalError(elementId) {
  document.getElementById(elementId).classList.remove("show");
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}