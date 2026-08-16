requireAuth();

// These endpoints build anonymous objects, which loses the string enum
// converter, so the enums arrive as plain numbers (0, 1, 2).
const ROLE_NAMES = ["Admin", "Trainer", "Member"];
const EQUIPMENT_STATUS_NAMES = ["Operational", "UnderMaintenance", "Retired"];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnRefresh").addEventListener("click", loadDashboard);
  loadDashboard();
});

function loadDashboard() {
  loadRevenue();
  loadUsersByRole();
  loadExpiring();
  loadMembershipsByPlan();
  loadEquipmentByStatus();
  loadAttendanceAverages();
}


// draws the rows, or a single grey line if there is nothing to draw
function fillTable(tbodyId, rows, emptyMessage) {
  const tbody = document.getElementById(tbodyId);

  if (rows.length === 0) {
    tbody.innerHTML = messageRow(emptyMessage, "text-muted");
    return;
  }

  tbody.innerHTML = rows
    .map(r => `<tr>
                 <td>${r.label}</td>
                 <td class="num text-end">${r.value}</td>
               </tr>`)
    .join("");
}

function messageRow(text, cssClass) {
  return `<tr><td colspan="2" class="text-center ${cssClass} py-3">${text}</td></tr>`;
}

// same failure message everywhere, so a dead endpoint is obvious
function tableError(tbodyId) {
  document.getElementById(tbodyId).innerHTML = messageRow("Failed to load", "text-danger");
}

function loadingTable(tbodyId) {
  document.getElementById(tbodyId).innerHTML = messageRow("Loading...", "text-muted");
}

function roleName(role) {
  return typeof role === "number" ? (ROLE_NAMES[role] ?? "Unknown") : role;
}

function equipmentStatusName(status) {
  return typeof status === "number" ? (EQUIPMENT_STATUS_NAMES[status] ?? "Unknown") : status;
}


async function loadRevenue() {
  loadingTable("monthlyBody");

  try {
    const data = await api("/payment/totalRevenue");

    document.getElementById("revenueValue").textContent = formatMoney(data.totalRevenue);

    const months = data.monthlyRevenue || [];
    fillTable("monthlyBody", months.map(m => ({
      label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
      value: formatMoney(m.total)
    })), "No completed payments yet.");
  } catch (err) {
    document.getElementById("revenueValue").textContent = "—";
    tableError("monthlyBody");
  }
}


async function loadUsersByRole() {
  loadingTable("rolesBody");

  try {
    const roles = await api("/user/countByRole");

    // the card wants only the Member row out of the same answer
    const members = roles.find(r => roleName(r.role) === "Member");
    document.getElementById("membersValue").textContent = members ? members.count : 0;

    fillTable("rolesBody", roles.map(r => ({
      label: roleName(r.role),
      value: r.count
    })), "No users yet.");
  } catch (err) {
    document.getElementById("membersValue").textContent = "—";
    tableError("rolesBody");
  }
}


async function loadExpiring() {
  try {
    const data = await api("/membership/getExpiring?days=7");
    document.getElementById("expiringValue").textContent = data.count;
  } catch (err) {
    document.getElementById("expiringValue").textContent = "—";
  }
}


async function loadMembershipsByPlan() {
  loadingTable("plansBody");

  try {
    const data = await api("/membership/countByPlan");
    const plans = data.counts || [];

    fillTable("plansBody", plans.map(p => ({
      label: p.planName || "Unnamed plan",
      value: p.active
    })), "No memberships yet.");
  } catch (err) {
    tableError("plansBody");
  }
}


async function loadEquipmentByStatus() {
  loadingTable("equipmentBody");

  try {
    const rows = await api("/equipment/countByStatus");

    fillTable("equipmentBody", rows.map(e => ({
      label: statusBadge(equipmentStatusName(e.status)),
      value: e.totalUnits
    })), "No equipment yet.");
  } catch (err) {
    tableError("equipmentBody");
  }
}


async function loadAttendanceAverages() {
  loadingTable("attendanceBody");

  try {
    const rows = await api("/attendance/averagePerBranch");

    fillTable("attendanceBody", rows.map(a => ({
      label: a.branchName,
      value: a.averagePerDay
    })), "No attendance records yet.");
  } catch (err) {
    tableError("attendanceBody");
  }
}
