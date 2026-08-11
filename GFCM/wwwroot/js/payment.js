requireAuth();

let allMembers = [];
let allMemberships = [];
let currentPayments = [];

const PAYMENT_STATUS_ORDER = ["Pending", "Completed", "Failed", "Refunded"];
const PAYMENT_METHOD_ORDER = ["Card", "Cash", "Transfer"];

function paymentStatusLabel(raw) {
    if (typeof raw === "string") return raw;
    return PAYMENT_STATUS_ORDER[raw] ?? String(raw);
}

function paymentMethodLabel(raw) {
    if (typeof raw === "string") return raw;
    return PAYMENT_METHOD_ORDER[raw] ?? String(raw);
}


function getStatusBadge(status) {
    switch (status) {
        case "Completed":
            return `<span class="badge-status badge-live">Completed</span>`;
        case "Pending":
            return `<span class="badge-status badge-warn">Pending</span>`;
        case "Failed":
            return `<span class="badge-status badge-closed">Failed</span>`;
        case "Refunded":
            return `<span class="badge-status badge-closed">Refunded</span>`;
        default:
            return `<span class="badge-status badge-closed">${status ?? "Unknown"}</span>`;
    }
}


function showFieldError(alertBox, message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.add("show");
}

function hideFieldError(alertBox) {
    if (!alertBox) return;
    alertBox.classList.remove("show");
    alertBox.textContent = "";
}


async function loadMemberOptions() {
    allMembers = await api("/user/getAll");
    const opts = allMembers.map(u => `<option value="${u.userId}">${u.userName}</option>`).join("");
    document.getElementById("addPaymentMember").innerHTML = opts;
}

async function loadMembershipsForMember(userId) {
    allMemberships = await api("/membership/getAll");
    const filtered = allMemberships.filter(m => m.userId == userId);
    const opts = filtered.map(m => `<option value="${m.membershipId}">${m.planName ?? "Membership #" + m.membershipId}</option>`).join("");
    document.getElementById("addPaymentMembership").innerHTML = `<option value="">None</option>` + opts;
}

document.getElementById("addPaymentMember").addEventListener("change", (e) => {
    if (e.target.value) loadMembershipsForMember(e.target.value);
});


// Case 13 - Payment List

async function loadPayments(list = null) {
    const wrap = document.getElementById("paymentTableWrap");
    if (!list) showSpinner(wrap);

    try {
        const payments = list ?? await api("/payment/getAll");
        currentPayments = payments;

        if (!payments.length) {
            showEmptyState(wrap, "No payments recorded yet.");
            document.getElementById("resultCount").textContent = "(0)";
            return;
        }

        wrap.innerHTML = `
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Payer</th>
            <th>Membership</th>
            <th class="num">Amount</th>
            <th class="num">Date</th>
            <th>Method</th>
            <th>Status</th>
            <th class="table-actions">Actions</th>
          </tr>
        </thead>
        <tbody id="paymentTableBody"></tbody>
      </table>`;

        document.getElementById("paymentTableBody").innerHTML = payments.map(p => {
            const status = paymentStatusLabel(p.paymentStatus);
            const locked = status === "Completed" || status === "Refunded";
            const canDelete = !locked && isAdmin();
            return `
        <tr>
          <td class="fw-semibold">${p.payerName ?? '<span class="nil"></span>'}</td>
          <td><span class="nil"></span></td>
          <td class="num">$${Number(p.amount).toFixed(2)}</td>
          <td class="num">${new Date(p.paymentDate).toLocaleDateString()}</td>
          <td>${paymentMethodLabel(p.paymentMethod)}</td>
          <td>${getStatusBadge(status)}</td>
          <td class="table-actions">
            <button class="btn btn-sm btn-outline-secondary" ${locked ? "disabled" : ""}
                    onclick="openEditModal(${p.paymentId})">Edit</button>
            ${renderStatusActions(p.paymentId, status)}
            <button class="btn btn-sm btn-outline-danger" ${canDelete ? "" : "disabled"}
                    title="${isAdmin() ? "" : "Admin only"}"
                    onclick="deletePayment(${p.paymentId})">Delete</button>
          </td>
        </tr>`;
        }).join("");

        document.getElementById("resultCount").textContent = `(${payments.length})`;
    } catch (err) {
        showToast(err.message, "danger");
    }
}

function renderStatusActions(paymentId, status) {
    if (!isAdmin()) return "";
    if (status === "Pending") {
        return `
      <button class="btn btn-sm btn-outline-success" onclick="setPaymentStatus(${paymentId}, 'Completed')">Confirm</button>
      <button class="btn btn-sm btn-outline-secondary" onclick="setPaymentStatus(${paymentId}, 'Failed')">Fail</button>`;
    }
    if (status === "Completed") {
        return `<button class="btn btn-sm btn-outline-warning" onclick="setPaymentStatus(${paymentId}, 'Refunded')">Refund</button>`;
    }
    return "";
}


// Case 14 - Record Payment

document.getElementById("addPaymentModal").addEventListener("show.bs.modal", () => {
    hideFieldError(document.getElementById("addPaymentAlert"));
});

document.getElementById("btnSubmitAddPayment").addEventListener("click", async () => {
    const alertBox = document.getElementById("addPaymentAlert");
    hideFieldError(alertBox);

    const userId = parseInt(document.getElementById("addPaymentMember").value);
    const membershipRaw = document.getElementById("addPaymentMembership").value;
    const amount = parseFloat(document.getElementById("addPaymentAmount").value);
    const paymentMethod = document.getElementById("addPaymentMethod").value;

    if (!amount || amount < 0.01) return showFieldError(alertBox, "Amount must be at least 0.01.");

    try {
        await api("/payment/add", "POST", {
            userId,
            membershipId: membershipRaw ? parseInt(membershipRaw) : null,
            amount,
            paymentMethod
        });
        bootstrap.Modal.getInstance(document.getElementById("addPaymentModal")).hide();
        document.getElementById("addPaymentAmount").value = "";
        showToast("Payment recorded", "success");
        await loadPayments();
        await loadRevenue();
    } catch (err) {
        showFieldError(alertBox, err.message);
    }
});


// Case 15 - Edit Payment

async function openEditModal(paymentId) {
    const alertBox = document.getElementById("editPaymentAlert");
    hideFieldError(alertBox);

    try {
        const p = await api(`/payment/get?id=${paymentId}`);
        document.getElementById("editPaymentId").value = paymentId;
        document.getElementById("editPaymentAmount").value = p.amount;
        document.getElementById("editPaymentMethod").value = paymentMethodLabel(p.paymentMethod);

        new bootstrap.Modal(document.getElementById("editPaymentModal")).show();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

document.getElementById("btnSubmitEditPayment").addEventListener("click", async () => {
    const alertBox = document.getElementById("editPaymentAlert");
    hideFieldError(alertBox);

    const paymentId = document.getElementById("editPaymentId").value;
    const amount = parseFloat(document.getElementById("editPaymentAmount").value);
    const paymentMethod = document.getElementById("editPaymentMethod").value;

    try {
        await api(`/payment/update?id=${paymentId}`, "PUT", { amount, paymentMethod });
        bootstrap.Modal.getInstance(document.getElementById("editPaymentModal")).hide();
        showToast("Payment updated", "success");
        await loadPayments();
    } catch (err) {
        showFieldError(alertBox, err.message);
    }
});


// Case 16 & 17 - Status Updates & Deletion

async function setPaymentStatus(paymentId, newStatus) {
    if (newStatus === "Completed") {
        const confirmed = await confirmModal(
            "Mark this payment as Completed? This action is irreversible.",
            "Confirm Payment", "btn-success"
        );
        if (!confirmed) return;
    }

    try {
        await api(`/payment/updateStatus?id=${paymentId}&newStatus=${newStatus}`, "PATCH");
        showToast(`Payment marked ${newStatus}`, "success");
        await loadPayments();
        await loadRevenue();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

async function deletePayment(paymentId) {
    const confirmed = await confirmModal(
        "Delete this payment? Only Pending or Failed payments can be removed.",
        "Delete Payment", "btn-danger"
    );
    if (!confirmed) return;

    try {
        await api(`/payment/remove?id=${paymentId}`, "DELETE");
        showToast("Payment deleted", "success");
        await loadPayments();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

// Case 18 - Revenue Reports & Filtering

async function loadRevenue() {
    try {
        const result = await api("/payment/totalRevenue");
        document.getElementById("totalRevenueFigure").textContent = `$${result.totalRevenue}`;

        document.getElementById("monthlyBreakdownBody").innerHTML =
            (result.monthlyRevenue ?? []).slice().reverse().map(m =>
                `<tr><td class="fw-semibold">${m.year}-${String(m.month).padStart(2, "0")}</td><td class="num">$${m.total}</td></tr>`
            ).join("") || `<tr><td colspan="2" class="text-muted text-center">No completed payments recorded.</td></tr>`;
    } catch (err) {
        showToast(err.message, "danger");
    }
}

async function applyFilter() {
    const from = document.getElementById("filterFrom").value;
    const to = document.getElementById("filterTo").value;
    const method = document.getElementById("filterMethod").value;
    const status = document.getElementById("filterStatus").value;

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (method) params.set("method", method);
    if (status) params.set("status", status);

    try {
        const result = await api(`/payment/getByDate?${params.toString()}`);
        await loadPayments(result.data);

        document.getElementById("filteredRevenueFigure").textContent = `$${Number(result.sum ?? 0).toFixed(2)}`;
        document.getElementById("filteredRevenueLabel").textContent = "Sum of filtered payments across all statuses";
    } catch (err) {
        showToast(err.message, "danger");
    }
}

document.getElementById("btnApplyFilter").addEventListener("click", applyFilter);
document.getElementById("btnClearFilter").addEventListener("click", () => {
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";
    document.getElementById("filterMethod").value = "";
    document.getElementById("filterStatus").value = "";
    loadPayments();
    document.getElementById("filteredRevenueFigure").textContent = "-";
    document.getElementById("filteredRevenueLabel").textContent = "";
});

function setDateRange(from, to) {
    document.getElementById("filterFrom").value = from.toISOString().slice(0, 10);
    document.getElementById("filterTo").value = to.toISOString().slice(0, 10);
    applyFilter();
}

document.getElementById("presetMonth").addEventListener("click", () => {
    const now = new Date();
    setDateRange(new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0));
});
document.getElementById("presetLastMonth").addEventListener("click", () => {
    const now = new Date();
    setDateRange(new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0));
});
document.getElementById("presetYear").addEventListener("click", () => {
    const now = new Date();
    setDateRange(new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear(), 11, 31));
});

// Initialization
(async function init() {
    await loadMemberOptions();
    await loadPayments();
    await loadRevenue();
})();