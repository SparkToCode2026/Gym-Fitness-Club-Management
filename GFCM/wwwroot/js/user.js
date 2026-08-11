// js/user.js
// all eight UserController cases are reachable from this page

requireAuth();

let addModal = null;
let editModal = null;
let roleModal = null;

// the enum stores as an int, and getAll projects into an anonymous object
// which drops the JsonStringEnumConverter, so role arrives as a number there
const ROLE_NAMES = ["Admin", "Trainer", "Member"];

document.addEventListener("DOMContentLoaded", () => {
  addModal = new bootstrap.Modal(document.getElementById("addUserModal"));
  editModal = new bootstrap.Modal(document.getElementById("editUserModal"));
  roleModal = new bootstrap.Modal(document.getElementById("roleModal"));

  document.getElementById("btnAddUser").addEventListener("click", openAddModal);
  document.getElementById("addUserForm").addEventListener("submit", createUser);
  document.getElementById("editUserForm").addEventListener("submit", saveUser);
  document.getElementById("roleForm").addEventListener("submit", saveRole);
  document.getElementById("filterRole").addEventListener("change", applyRoleFilter);

  // show the trainer profile hint only when Trainer is picked
  document.getElementById("newRole").addEventListener("change", e => {
    document.getElementById("trainerHint")
      .classList.toggle("d-none", e.target.value !== "Trainer");
  });

  loadUsers();
  loadRoleCounts();
});


// turns whatever the api sent into a readable role name
function roleName(role) {
  if (typeof role === "number") return ROLE_NAMES[role] ?? "Unknown";
  return role ?? "Unknown";
}

function isAdmin() {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  return user && user.role === "Admin";
}


// case 07, get all users
async function loadUsers() {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = loadingRow(6);
  document.getElementById("filterResult").textContent = "";

  try {
    const users = await api("/user/getAll");
    renderUsers(users, "No users yet.");
  } catch (err) {
    tbody.innerHTML = errorRow(6, err.message);
    showToast(err.message || "Could not load users", "danger");
  }
}


// case 12, filter by role
async function applyRoleFilter() {
  const role = document.getElementById("filterRole").value;
  if (!role) return loadUsers();

  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = loadingRow(6);

  try {
    // this endpoint returns full User entities, so there is no specialization
    // and userId is hidden by JsonIgnore, which is why the actions are dropped
    const users = await api(`/user/getByRole?role=${encodeURIComponent(role)}`);
    renderUsers(users, `No users with the ${role} role.`);
    document.getElementById("filterResult").textContent =
      users.length === 1 ? "1 result" : `${users.length} results`;
  } catch (err) {
    tbody.innerHTML = errorRow(6, err.message);
    showToast(err.message || "Filter failed", "danger");
  }
}


// rendering
function renderUsers(users, emptyMessage) {
  const tbody = document.getElementById("userTableBody");
  const countEl = document.getElementById("userCount");

  const list = users || [];
  countEl.textContent = list.length === 1 ? "1 user" : `${list.length} users`;

  if (list.length === 0) {
    tbody.innerHTML = emptyRow(6, emptyMessage);
    return;
  }

  tbody.innerHTML = list.map(u => {
    // the filtered response has no userId, so those rows get no action buttons
    const actions = u.userId
      ? `
        <button class="btn btn-outline-primary" onclick="openEditModal(${u.userId})">Edit</button>
        <button class="btn btn-outline-secondary" onclick="openRoleModal(${u.userId})">Role</button>
        ${isAdmin() ? `<button class="btn btn-outline-danger" onclick="deactivateUser(${u.userId})">Deactivate</button>` : ""}
      `
      : `<span class="count">Open the full list to edit</span>`;

    return `
      <tr class="${u.isActive === false ? "row-inactive" : ""}">
        <td class="fw-semibold">${escapeHtml(u.userName)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${statusBadge(roleName(u.role))}</td>
        <td>${u.specialization ? escapeHtml(u.specialization) : '<span class="nil"></span>'}</td>
        <td>${u.isActive ? statusBadge("Active") : statusBadge("Cancelled")}</td>
        <td class="table-actions">${actions}</td>
      </tr>
    `;
  }).join("");
}


// case 08, add a user
function openAddModal() {
  document.getElementById("addUserForm").reset();
  clearModalError("addUserError");
  addModal.show();
}

async function createUser(event) {
  event.preventDefault();
  clearModalError("addUserError");

  // the body has to match UserRegister exactly
  const body = {
    userName: document.getElementById("addUserName").value.trim(),
    email: document.getElementById("addEmail").value.trim(),
    password: document.getElementById("addPassword").value,
    phoneNumber: document.getElementById("addPhone").value.trim(),
    role: document.getElementById("addRole").value
  };

  try {
    await api("/user/add", "POST", body);
    showToast("User created");
    addModal.hide();
    loadUsers();
    loadRoleCounts();
  } catch (err) {
    showModalError("addUserError", err.message || "Could not create user");
  }
}


// case 09, edit a user
// getAll does not return phoneNumber, so case 06 is used to fill the form
async function openEditModal(id) {
  try {
    const user = await api(`/user/get?id=${id}`);

    document.getElementById("editUserForm").reset();
    document.getElementById("editUserId").value = id;
    document.getElementById("editUserName").value = user.userName || "";
    document.getElementById("editPhone").value = user.phoneNumber || "";

    clearModalError("editUserError");
    editModal.show();
  } catch (err) {
    showToast(err.message || "Could not load user", "danger");
  }
}

async function saveUser(event) {
  event.preventDefault();
  clearModalError("editUserError");

  const id = document.getElementById("editUserId").value;

  // update copies userName and phoneNumber only, the rest is ignored
  const body = {
    userName: document.getElementById("editUserName").value.trim(),
    phoneNumber: document.getElementById("editPhone").value.trim()
  };

  try {
    await api(`/user/update?id=${id}`, "PUT", body);
    showToast("User updated");
    editModal.hide();
    loadUsers();
  } catch (err) {
    showModalError("editUserError", err.message || "Could not update user");
  }
}


// case 10, change role
async function openRoleModal(id) {
  try {
    const user = await api(`/user/get?id=${id}`);

    document.getElementById("roleUserId").value = id;
    document.getElementById("roleUserName").textContent = user.userName;
    document.getElementById("newRole").value = roleName(user.role);
    document.getElementById("trainerHint")
      .classList.toggle("d-none", roleName(user.role) !== "Trainer");

    clearModalError("roleError");
    roleModal.show();
  } catch (err) {
    showToast(err.message || "Could not load user", "danger");
  }
}

async function saveRole(event) {
  event.preventDefault();
  clearModalError("roleError");

  const id = document.getElementById("roleUserId").value;
  const role = document.getElementById("newRole").value;

  try {
    // the parameter is called role, not newRole
    await api(`/user/updateRole?id=${id}&role=${encodeURIComponent(role)}`, "PATCH");

    showToast(role === "Trainer"
      ? "Role updated. Create their trainer profile next."
      : "Role updated");

    roleModal.hide();
    loadUsers();
    loadRoleCounts();
  } catch (err) {
    showModalError("roleError", err.message || "Could not change role");
  }
}


// case 11, deactivate a user (soft delete, admin only)
async function deactivateUser(id) {
  const ok = await confirmDialog("Deactivate this user? Their records stay in the system.");
  if (!ok) return;

  try {
    await api(`/user/remove?id=${id}`, "DELETE");
    showToast("User deactivated");
    loadUsers();
    loadRoleCounts();
  } catch (err) {
    showToast(err.message || "Could not deactivate user", "danger");
  }
}


// case 12, role breakdown
async function loadRoleCounts() {
  // a role with no users is missing from the response entirely, so start at zero
  const counts = { Admin: 0, Trainer: 0, Member: 0 };

  try {
    const data = await api("/user/countByRole");
    data.forEach(row => {
      const name = roleName(row.role);
      if (name in counts) counts[name] = row.count;
    });
  } catch (err) {
    showToast("Could not load role counts", "danger");
  }

  document.getElementById("countAdmin").textContent = counts.Admin;
  document.getElementById("countTrainer").textContent = counts.Trainer;
  document.getElementById("countMember").textContent = counts.Member;
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