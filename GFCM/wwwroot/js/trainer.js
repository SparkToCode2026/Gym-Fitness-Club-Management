// js/trainer.js
// all eight TrainerProfileController cases are reachable from this page

requireAuth();

let addModal = null;
let editModal = null;
let transferModal = null;

// branches are loaded once and reused by the add filter and the transfer modal
let branches = [];

let searchTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  addModal = new bootstrap.Modal(document.getElementById("addTrainerModal"));
  editModal = new bootstrap.Modal(document.getElementById("editTrainerModal"));
  transferModal = new bootstrap.Modal(document.getElementById("transferModal"));

  document.getElementById("btnAddTrainer").addEventListener("click", openAddModal);
  document.getElementById("addTrainerForm").addEventListener("submit", createProfile);
  document.getElementById("editTrainerForm").addEventListener("submit", saveProfile);
  document.getElementById("transferForm").addEventListener("submit", saveTransfer);
  document.getElementById("btnClearSearch").addEventListener("click", clearSearch);
  document.getElementById("filterBranch").addEventListener("change", runSearch);

  // debounced so one request fires after typing stops, not one per letter
  document.getElementById("searchSpecialization").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 300);
  });

  loadBranches();
  loadTrainers();
  loadByExperience();
});

function isAdmin() {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  return user && user.role === "Admin";
}


// case 13, get all trainer profiles
async function loadTrainers() {
  const tbody = document.getElementById("trainerTableBody");
  tbody.innerHTML = loadingRow(5);
  document.getElementById("searchResult").textContent = "";

  try {
    const profiles = await api("/trainerprofile/getAll");
    renderTrainers(profiles, "No trainer profiles yet.");
  } catch (err) {
    tbody.innerHTML = errorRow(5, err.message);
    showToast(err.message || "Could not load trainers", "danger");
  }
}


// case 18, search by specialization, optionally narrowed to one branch
async function runSearch() {
  const term = document.getElementById("searchSpecialization").value.trim();
  const branchId = document.getElementById("filterBranch").value;

  // nothing entered at all, so show the full list
  if (!term && !branchId) return loadTrainers();

  const tbody = document.getElementById("trainerTableBody");
  tbody.innerHTML = loadingRow(5);

  // the endpoint requires the specialization parameter, and an empty string
  // matches everything, which is what makes the branch filter work on its own
  let url = `/trainerprofile/getBySpecialization?specialization=${encodeURIComponent(term)}`;
  if (branchId) url += `&branchId=${branchId}`;

  try {
    const profiles = await api(url);
    renderTrainers(profiles, "No trainers match that search.");
    document.getElementById("searchResult").textContent =
      profiles.length === 1 ? "1 result" : `${profiles.length} results`;
  } catch (err) {
    tbody.innerHTML = errorRow(5, err.message);
    showToast(err.message || "Search failed", "danger");
  }
}

function clearSearch() {
  document.getElementById("searchSpecialization").value = "";
  document.getElementById("filterBranch").value = "";
  loadTrainers();
}


// rendering
function renderTrainers(profiles, emptyMessage) {
  const tbody = document.getElementById("trainerTableBody");
  const countEl = document.getElementById("trainerCount");

  const list = profiles || [];
  countEl.textContent = list.length === 1 ? "1 trainer" : `${list.length} trainers`;

  if (list.length === 0) {
    tbody.innerHTML = emptyRow(5, emptyMessage);
    return;
  }

  // trainerName and branchName arrive flattened, so they are read directly
  tbody.innerHTML = list.map(t => `
    <tr>
      <td class="fw-semibold">${escapeHtml(t.trainerName)}</td>
      <td>${escapeHtml(t.specialization)}</td>
      <td class="num">${t.yearsOfExperience} ${t.yearsOfExperience === 1 ? "year" : "years"}</td>
      <td>${escapeHtml(t.branchName)}</td>
      <td class="table-actions">
        <button class="btn btn-outline-primary" onclick="openEditModal(${t.trainerProfileId})">Edit</button>
        <button class="btn btn-outline-secondary" onclick="openTransferModal(${t.trainerProfileId}, '${escapeAttr(t.trainerName)}')">Transfer</button>
        ${isAdmin() ? `<button class="btn btn-outline-danger" onclick="removeProfile(${t.trainerProfileId})">Delete</button>` : ""}
      </td>
    </tr>
  `).join("");
}


// dropdown data
async function loadBranches() {
  try {
    branches = await api("/branch/getAll");
    fillBranchSelect("filterBranch", "All branches");
    fillBranchSelect("addBranchSelect", "Choose a branch");
    fillBranchSelect("transferBranchSelect", "Choose a branch");
  } catch (err) {
    showToast("Could not load branches", "danger");
  }
}

function fillBranchSelect(elementId, placeholder) {
  const select = document.getElementById(elementId);
  select.innerHTML = `<option value="">${placeholder}</option>` +
    branches.map(b => `<option value="${b.branchId}">${escapeHtml(b.branchName)}</option>`).join("");
}

async function loadTrainerUsers() {
  const select = document.getElementById("addUserSelect");

  try {
    // getByRole returns full User entities and userId carries JsonIgnore, so
    // the ids never arrive. getAll projects userId explicitly, so it is filtered
    // here instead. role comes back as an int from that projection, 1 is Trainer
    const users = await api("/user/getAll");
    const trainers = users.filter(u => u.role === 1 || u.role === "Trainer");

    if (trainers.length === 0) {
      select.innerHTML = `<option value="">No trainer-role users yet</option>`;
      return;
    }

    select.innerHTML = `<option value="">Choose a user</option>` +
      trainers.map(u => `<option value="${u.userId}">${escapeHtml(u.userName)}</option>`).join("");
  } catch (err) {
    select.innerHTML = `<option value="">Could not load users</option>`;
  }
}


// case 14, add a trainer profile
async function openAddModal() {
  document.getElementById("addTrainerForm").reset();
  clearModalError("addTrainerError");
  await loadTrainerUsers();
  addModal.show();
}

async function createProfile(event) {
  event.preventDefault();
  clearModalError("addTrainerError");

  const body = {
    userId: Number(document.getElementById("addUserSelect").value),
    branchId: Number(document.getElementById("addBranchSelect").value),
    specialization: document.getElementById("addSpecialization").value.trim(),
    yearsOfExperience: Number(document.getElementById("addExperience").value),
    bio: document.getElementById("addBio").value.trim(),
    certificationDetails: document.getElementById("addCertification").value.trim()
  };

  try {
    await api("/trainerprofile/add", "POST", body);
    showToast("Trainer profile created");
    addModal.hide();
    loadTrainers();
    loadByExperience();
  } catch (err) {
    // the api returns a conflict when this user already has a profile
    showModalError("addTrainerError", err.message || "Could not create profile");
  }
}


// case 15, edit a trainer profile
// get returns the entity, so trainerProfileId is hidden by JsonIgnore and the
// id from the row is kept instead
async function openEditModal(id) {
  try {
    const profile = await api(`/trainerprofile/get?trainerProfileId=${id}`);

    document.getElementById("editTrainerForm").reset();
    document.getElementById("editTrainerId").value = id;
    document.getElementById("editSpecialization").value = profile.specialization || "";
    document.getElementById("editExperience").value = profile.yearsOfExperience ?? 0;
    document.getElementById("editBio").value = profile.bio || "";
    document.getElementById("editCertification").value = profile.certificationDetails || "";

    clearModalError("editTrainerError");
    editModal.show();
  } catch (err) {
    showToast(err.message || "Could not load profile", "danger");
  }
}

async function saveProfile(event) {
  event.preventDefault();
  clearModalError("editTrainerError");

  const id = document.getElementById("editTrainerId").value;

  const body = {
    specialization: document.getElementById("editSpecialization").value.trim(),
    yearsOfExperience: Number(document.getElementById("editExperience").value),
    bio: document.getElementById("editBio").value.trim(),
    certificationDetails: document.getElementById("editCertification").value.trim()
  };

  try {
    await api(`/trainerprofile/update?trainerProfileId=${id}`, "PUT", body);
    showToast("Trainer profile updated");
    editModal.hide();
    loadTrainers();
    loadByExperience();
  } catch (err) {
    showModalError("editTrainerError", err.message || "Could not update profile");
  }
}


// case 16, transfer to another branch
async function openTransferModal(id, trainerName) {
  document.getElementById("transferTrainerId").value = id;
  document.getElementById("transferTrainerName").textContent = trainerName;
  clearModalError("transferError");

  try {
    // get carries branchId, so the current branch can be preselected
    const profile = await api(`/trainerprofile/get?trainerProfileId=${id}`);
    document.getElementById("transferBranchSelect").value = profile.branchId || "";
  } catch (err) {
    document.getElementById("transferBranchSelect").value = "";
  }

  transferModal.show();
}

async function saveTransfer(event) {
  event.preventDefault();
  clearModalError("transferError");

  const id = document.getElementById("transferTrainerId").value;
  const branchId = document.getElementById("transferBranchSelect").value;

  if (!branchId) {
    showModalError("transferError", "Choose a branch first");
    return;
  }

  try {
    await api(`/trainerprofile/updateBranch?trainerProfileId=${id}&newBranchId=${branchId}`, "PATCH");
    showToast("Trainer transferred");
    transferModal.hide();
    loadTrainers();
  } catch (err) {
    showModalError("transferError", err.message || "Could not transfer trainer");
  }
}


// case 17, delete the profile, not the user account
async function removeProfile(id) {
  const ok = await confirmDialog(
    "Delete this trainer profile? The user account itself stays active."
  );
  if (!ok) return;

  try {
    await api(`/trainerprofile/remove?trainerProfileId=${id}`, "DELETE");
    showToast("Trainer profile deleted");
    loadTrainers();
    loadByExperience();
  } catch (err) {
    // conflict when the trainer still has classes assigned
    showToast(err.message || "Could not delete profile", "danger");
  }
}


// case 18, sorted by experience
async function loadByExperience() {
  const tbody = document.getElementById("experienceTableBody");
  tbody.innerHTML = loadingRow(3);

  try {
    // this endpoint returns raw entities, so there is no trainerProfileId and
    // no trainer name, only the fields that live on the profile itself
    const profiles = await api("/trainerprofile/getByExperience");

    if (!profiles || profiles.length === 0) {
      tbody.innerHTML = emptyRow(3, "No trainer profiles yet.");
      return;
    }

    tbody.innerHTML = profiles.map((t, index) => `
      <tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(t.specialization)}</td>
        <td class="num">${t.yearsOfExperience}</td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = errorRow(3, err.message);
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

// a name going inside a single quoted onclick argument needs its quotes gone
function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "");
}