requireAuth();

let renewModal, statusModal, deleteModal, addModal;
let membershipToDeleteId = null;
let selectedPlanDuration = null;
let currentRenewEndDate = null;

document.addEventListener("DOMContentLoaded", () => {
  renewModal = new bootstrap.Modal(document.getElementById("renewMembershipModal"));
  statusModal = new bootstrap.Modal(document.getElementById("statusMembershipModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteMembershipModal"));
  addModal = new bootstrap.Modal(document.getElementById("addMembershipModal"));

  loadMemberships();
  loadExpiring();
  loadPlanBreakdown();
  loadDropdowns();

  document.getElementById("expiringDays").addEventListener("change", loadExpiring);
  document.getElementById("addMembershipPlan").addEventListener("change", updateEndDatePreview);
  document.getElementById("submitAddMembershipBtn").addEventListener("click", submitAddMembership);
  document.getElementById("submitRenewBtn").addEventListener("click", submitRenew);
  document.getElementById("submitStatusBtn").addEventListener("click", submitStatus);
  document.getElementById("confirmDeleteMembershipBtn").addEventListener("click", confirmDeleteMembership);

  document.querySelectorAll(".quick-pick").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("renewAdditionalDays").value = btn.dataset.days;
      updateRenewPreview();
    });
  });

  document.getElementById("renewAdditionalDays").addEventListener("input", updateRenewPreview);
});

async function loadMemberships() {
  const spinner = document.getElementById("loadingSpinner");
  const emptyState = document.getElementById("emptyState");
  const tbody = document.getElementById("membershipTableBody");

  spinner.classList.remove("d-none");
  emptyState.classList.add("d-none");
  tbody.innerHTML = "";

  try {
    const result = await api("/membership/getAll");
    const memberships = result.memberships;

    spinner.classList.add("d-none");

    if (!memberships || memberships.length === 0) {
      emptyState.classList.remove("d-none");
      return;
    }

    renderMembershipRows(memberships);
  } catch (err) {
    spinner.classList.add("d-none");
    showToast(err.message, "danger");
  }
}

function daysRemainingInfo(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  let colorClass = "text-success";
  if (diffDays <= 7) colorClass = "text-danger";
  else if (diffDays <= 30) colorClass = "text-warning";

  return { diffDays, colorClass };
}

function statusBadgeClass(status) {
  if (status === "Active") return "bg-success";
  if (status === "Expired") return "bg-secondary";
  if (status === "Cancelled") return "bg-secondary";
  return "bg-secondary";
}

function renderMembershipRows(memberships) {
  const tbody = document.getElementById("membershipTableBody");
  tbody.innerHTML = memberships.map(m => {
    const isActive = m.membershipStatus === "Active";
    const { diffDays, colorClass } = daysRemainingInfo(m.endDate);
    const remainingCell = isActive
      ? `<td class="${colorClass}">${diffDays}</td>`
      : `<td class="text-muted">—</td>`;

    return `
      <tr>
        <td>${m.memberName}</td>
        <td>${m.planName}</td>
        <td>${new Date(m.startDate).toLocaleDateString()}</td>
        <td>${new Date(m.endDate).toLocaleDateString()}</td>
        <td><span class="badge ${statusBadgeClass(m.membershipStatus)}">${m.membershipStatus}</span></td>
        ${remainingCell}
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary renew-btn" data-id="${m.membershipId}" data-enddate="${m.endDate}">Renew</button>
            <button class="btn btn-sm btn-outline-secondary status-btn" data-id="${m.membershipId}" data-status="${m.membershipStatus}">Status</button>
            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${m.membershipId}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  attachRowEvents();
}

function attachRowEvents() {
  document.querySelectorAll(".renew-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.getElementById("renewMembershipId").value = e.target.dataset.id;
      currentRenewEndDate = e.target.dataset.enddate;
      document.getElementById("renewAdditionalDays").value = "";
      document.getElementById("renewEndDatePreview").textContent = "";
      document.getElementById("renewError").classList.add("d-none");
      renewModal.show();
    });
  });

  document.querySelectorAll(".status-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.getElementById("statusMembershipId").value = e.target.dataset.id;
      document.getElementById("statusSelect").value = e.target.dataset.status;
      statusModal.show();
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      membershipToDeleteId = e.target.dataset.id;
      document.getElementById("deleteMembershipId").value = membershipToDeleteId;
      document.getElementById("deleteConflictBox").classList.add("d-none");
      deleteModal.show();
    });
  });
}

async function loadDropdowns() {
  try {
    const usersResult = await api("/user/getAll");
    const users = Array.isArray(usersResult) ? usersResult : (usersResult.users || []);
    const userSel = document.getElementById("addMembershipUser");
    userSel.innerHTML = users
      .map(u => `<option value="${u.userId}">${u.userName}</option>`)
      .join("");
  } catch (err) {
    showToast("Could not load users: " + err.message, "danger");
  }

  const planSel = document.getElementById("addMembershipPlan");
  const enrolBtn = document.getElementById("submitAddMembershipBtn");

  try {
    const plansResult = await api("/membershipplan/getAll?activeOnly=true");
    const plans = plansResult.plans;

    if (!plans || plans.length === 0) {
      planSel.innerHTML = `<option value="">No active plans, create one first</option>`;
      enrolBtn.disabled = true;
      return;
    }

    enrolBtn.disabled = false;
    planSel.innerHTML = plans
      .map(p => `<option value="${p.membershipPlanId}" data-duration="${p.durationInDays}">${p.planName}</option>`)
      .join("");
    updateEndDatePreview();
  } catch (err) {
    showToast("Could not load plans: " + err.message, "danger");
  }
}

function updateEndDatePreview() {
  const select = document.getElementById("addMembershipPlan");
  const selectedOption = select.options[select.selectedIndex];
  if (!selectedOption || !selectedOption.dataset.duration) return;

  const duration = Number(selectedOption.dataset.duration);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);

  document.getElementById("endDatePreview").textContent =
    `Membership will end on ${endDate.toLocaleDateString()}`;
}

async function submitAddMembership() {
  const errorBox = document.getElementById("addMembershipError");
  errorBox.classList.add("d-none");

  const body = {
    userId: Number(document.getElementById("addMembershipUser").value),
    membershipPlanId: Number(document.getElementById("addMembershipPlan").value)
  };

  try {
    await api("/membership/add", "POST", body);
    addModal.hide();
    showToast("Member enrolled", "success");
    loadMemberships();
    loadPlanBreakdown();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

function updateRenewPreview() {
  const additionalDays = Number(document.getElementById("renewAdditionalDays").value);
  if (!additionalDays || !currentRenewEndDate) {
    document.getElementById("renewEndDatePreview").textContent = "";
    return;
  }
  const newEnd = new Date(currentRenewEndDate);
  newEnd.setDate(newEnd.getDate() + additionalDays);
  document.getElementById("renewEndDatePreview").textContent =
    `New end date: ${newEnd.toLocaleDateString()}`;
}

async function submitRenew() {
  const errorBox = document.getElementById("renewError");
  errorBox.classList.add("d-none");

  const id = document.getElementById("renewMembershipId").value;
  const additionalDays = document.getElementById("renewAdditionalDays").value;

  try {
    await api(`/membership/update?membershipId=${id}&additionalDays=${additionalDays}`, "PUT");
    renewModal.hide();
    showToast("Membership renewed", "success");
    loadMemberships();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

async function submitStatus() {
  const id = document.getElementById("statusMembershipId").value;
  const newStatus = document.getElementById("statusSelect").value;

  if (newStatus === "Cancelled") {
    const confirmed = await confirmDialog("Move this membership to Cancelled?");
    if (!confirmed) return;
  }

  try {
    await api(`/membership/updateStatus?membershipId=${id}&newStatus=${newStatus}`, "PATCH");
    statusModal.hide();
    showToast("Status updated", "success");
    loadMemberships();
  } catch (err) {
    showToast(err.message, "danger");
  }
}

async function confirmDeleteMembership() {
  const conflictBox = document.getElementById("deleteConflictBox");
  conflictBox.classList.add("d-none");

  try {
    await api(`/membership/remove?membershipId=${membershipToDeleteId}`, "DELETE");
    deleteModal.hide();
    showToast("Membership deleted", "success");
    loadMemberships();
  } catch (err) {
    conflictBox.textContent = err.message + " — try cancelling it instead via Status.";
    conflictBox.classList.remove("d-none");
  }
}

async function loadExpiring() {
  const container = document.getElementById("expiringList");
  const panel = document.getElementById("expiringPanel");
  const days = document.getElementById("expiringDays").value || 7;

  try {
    const result = await api(`/membership/getExpiring?days=${days}`);
    const expiring = result.expiring;

    if (result.count > 0) {
      panel.classList.add("border-warning");
    } else {
      panel.classList.remove("border-warning");
    }

    if (!expiring || expiring.length === 0) {
      container.innerHTML = `<span class="text-muted">No memberships expiring soon.</span>`;
      return;
    }

    container.innerHTML = `
      <ul class="mb-0">
        ${expiring.map(e => `<li>${e.memberName} — ends ${new Date(e.endDate).toLocaleDateString()}</li>`).join("")}
      </ul>
    `;
  } catch (err) {
    container.innerHTML = `<span class="text-danger">${err.message}</span>`;
  }
}

async function loadPlanBreakdown() {
  const container = document.getElementById("planBreakdown");
  try {
    const result = await api("/membership/countByPlan");
    const counts = result.counts;

    if (!counts || counts.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = counts.map(c => `
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="small text-muted">${c.planName}</div>
            <div class="fs-4">${c.total}</div>
            <div class="small text-success">${c.active} active</div>
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<span class="text-danger">${err.message}</span>`;
  }
}
