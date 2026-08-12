requireAuth();

let allMembers = [];
let allSchedules = [];

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

function getStatusBadge(status) {
    switch (status) {
        case "Booked":
            return `<span class="badge-status badge-live">Booked</span>`;
        case "Attended":
            return `<span class="badge-status badge-live">Attended</span>`;
        case "Cancelled":
            return `<span class="badge-status badge-closed">Cancelled</span>`;
        default:
            return `<span class="badge-status badge-closed">${status ?? "Unknown"}</span>`;
    }
}


async function loadMemberOptions() {
    allMembers = await api("/user/getAll");
    const opts = allMembers.map(u => `<option value="${u.userId}">${u.userName}</option>`).join("");
    document.getElementById("filterMember").innerHTML = `<option value="">All members</option>` + opts;
    document.getElementById("addBookingMember").innerHTML = opts;
}

async function loadScheduleOptionsWithFullness() {
    allSchedules = await api("/classschedule/getAll");
    const counts = await Promise.all(
        allSchedules.map(s => api(`/classschedule/getBookingCount?classScheduleId=${s.classScheduleId}`))
    );
    allSchedules = allSchedules.map((s, i) => ({ ...s, booked: counts[i].booked }));
    return buildClassOptionsHtml(allSchedules);
}

function buildClassOptionsHtml(schedules, excludeId = null) {
    return schedules
        .filter(s => s.classScheduleId !== excludeId)
        .map(s => {
            const full = s.booked >= s.capacity;
            const when = new Date(s.startTime).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
            const label = `${s.className} ${when} (${s.booked}/${s.capacity})${full ? " - FULL" : ""}`;
            return `<option value="${s.classScheduleId}" ${full ? "disabled" : ""}>${label}</option>`;
        })
        .join("");
}

// Case 07 - Booking List
async function loadBookings(list = null) {
    const wrap = document.getElementById("bookingTableWrap");
    // FIX : Pass element ID string "bookingTableWrap" instead of DOM element
    if (!list) showSpinner("bookingTableWrap");

    try {
        const bookings = list ?? await api("/classbooking/getAll");

        if (!bookings.length) {
            // FIX : Replaced non-existent showEmptyState with emptyRow 
            wrap.innerHTML = `
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Member</th>
            <th>Class</th>
            <th>Booking Date</th>
            <th>Status</th>
            <th class="table-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${emptyRow(5, "No bookings found.")}
        </tbody>
      </table>`;
            document.getElementById("resultCount").textContent = "(0)";
            return;
        }

        document.getElementById("resultCount").textContent = `(${bookings.length})`;
    } catch (err) {
        showToast(err.message, "danger");
    }
}

//Case 08 - Book a Member into a Class
async function openAddBookingModalData() {
    hideFieldError(document.getElementById("addBookingAlert"));
    document.getElementById("addBookingClass").innerHTML = await loadScheduleOptionsWithFullness();
}
document.getElementById("addBookingModal").addEventListener("show.bs.modal", openAddBookingModalData);

document.getElementById("btnSubmitBooking").addEventListener("click", async () => {
    const alertBox = document.getElementById("addBookingAlert");
    hideFieldError(alertBox);

    const userId = parseInt(document.getElementById("addBookingMember").value);
    const classScheduleId = parseInt(document.getElementById("addBookingClass").value);

    try {
        await api("/classbooking/add", "POST", { userId, classScheduleId });
        bootstrap.Modal.getInstance(document.getElementById("addBookingModal")).hide();
        showToast("Booking created", "success");
        await loadBookings();
        await loadPopularity();
    } catch (err) {
        showFieldError(alertBox, err.message);
    }
});

// Case 09 - Move a Booking to Another Class
async function openMoveModal(userId, classScheduleId) {
    const alertBox = document.getElementById("moveBookingAlert");
    hideFieldError(alertBox);

    document.getElementById("moveUserId").value = userId;
    document.getElementById("moveClassScheduleId").value = classScheduleId;

    try {
        const current = await api(`/classbooking/get?userId=${userId}&classScheduleId=${classScheduleId}`);
        document.getElementById("moveCurrentClassLabel").innerHTML =
            `Currently booked into: <strong>${current.className}</strong> (${current.bookingStatus})`;

        if (current.bookingStatus !== "Booked") {
            showFieldError(
                alertBox,
                `This booking is currently ${current.bookingStatus}, not Booked — refresh the page.`
            );
        }
    } catch (err) {
        showFieldError(alertBox, err.message);
    }

    document.getElementById("moveTargetClass").innerHTML =
        buildClassOptionsHtml(allSchedules, classScheduleId);

    new bootstrap.Modal(document.getElementById("moveBookingModal")).show();
}

document.getElementById("btnSubmitMove").addEventListener("click", async () => {
    const alertBox = document.getElementById("moveBookingAlert");
    hideFieldError(alertBox);

    const userId = document.getElementById("moveUserId").value;
    const classScheduleId = document.getElementById("moveClassScheduleId").value;
    const newClassScheduleId = document.getElementById("moveTargetClass").value;

    try {
        await api(`/classbooking/update?userId=${userId}&classScheduleId=${classScheduleId}&newClassScheduleId=${newClassScheduleId}`, "PUT");
        bootstrap.Modal.getInstance(document.getElementById("moveBookingModal")).hide();
        showToast("Booking moved successfully", "success");
        await loadBookings();
        await loadPopularity();
    } catch (err) {
        showFieldError(alertBox, err.message);
    }
});

//Case 10 - Mark Attendance & Bulk Actions

async function updateBookingStatus(userId, classScheduleId, newStatus) {
    if (!newStatus) return;
    try {
        await api(`/classbooking/updateStatus?userId=${userId}&classScheduleId=${classScheduleId}&newStatus=${newStatus}`, "PATCH");
        showToast("Status updated", "success");
        await loadBookings();
        await loadPopularity();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

document.getElementById("bulkAttendModal").addEventListener("show.bs.modal", async () => {
    hideFieldError(document.getElementById("bulkAttendAlert"));
    document.getElementById("bulkAttendClass").innerHTML =
        allSchedules.map(s => `<option value="${s.classScheduleId}">${s.className}</option>`).join("");
});

document.getElementById("btnSubmitBulkAttend").addEventListener("click", async () => {
    const alertBox = document.getElementById("bulkAttendAlert");
    hideFieldError(alertBox);

    const classScheduleId = document.getElementById("bulkAttendClass").value;
    try {
        const bookings = await api("/classbooking/getAll");
        const targets = bookings.filter(b => b.classScheduleId == classScheduleId && b.bookingStatus === "Booked");

        if (!targets.length) {
            showFieldError(alertBox, "No active 'Booked' status rows found for this class.");
            return;
        }

        await Promise.all(targets.map(b =>
            api(`/classbooking/updateStatus?userId=${b.userId}&classScheduleId=${b.classScheduleId}&newStatus=Attended`, "PATCH")
        ));

        bootstrap.Modal.getInstance(document.getElementById("bulkAttendModal")).hide();
        showToast(`${targets.length} booking(s) marked as attended`, "success");
        await loadBookings();
        await loadPopularity();
    } catch (err) {
        showFieldError(alertBox, err.message);
    }
});

//Case 11 - Cancel Booking

//// FIX: Replaced non-existent confirmModal with confirmDialog(message)
async function cancelBooking(userId, classScheduleId) {
    const confirmed = await confirmDialog("Cancel this booking? The member will need to rebook to attend.");
    if (!confirmed) return;

    try {
        await api(`/classbooking/remove?userId=${userId}&classScheduleId=${classScheduleId}`, "DELETE");
        showToast("Booking cancelled", "success");
        await loadBookings();
        await loadScheduleOptionsWithFullness();
        await loadPopularity();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

    // Case 12 - Member Filter & Popularity Panel
document.getElementById("btnApplyMemberFilter").addEventListener("click", async () => {
    const userId = document.getElementById("filterMember").value;
    const status = document.getElementById("filterStatus").value;

    if (!userId) {
        return loadBookings();
    }

    const params = new URLSearchParams({ userId });
    if (status) params.set("status", status);

    try {
        const result = await api(`/classbooking/getByUser?${params.toString()}`);
        loadBookings(result.bookings.map(b => ({ ...b, userId: parseInt(userId) })));
        document.getElementById("resultCount").textContent = `(${result.count})`;
    } catch (err) {
        showToast(err.message, "danger");
    }
});

document.getElementById("btnClearMemberFilter").addEventListener("click", () => {
    document.getElementById("filterMember").value = "";
    document.getElementById("filterStatus").value = "";
    loadBookings();
});

async function loadPopularity() {
    try {
        const rows = await api("/classbooking/countByClass");
        document.getElementById("popularityBody").innerHTML = rows.map(r => {
            const rate = r.totalBookings > 0 ? Math.round((r.attended / r.totalBookings) * 100) : 0;
            return `<tr>
          <td class="fw-semibold">${r.className ?? "Class #" + r.classScheduleId}</td>
          <td class="num">${r.totalBookings}</td>
          <td class="num">${r.attended}</td>
          <td class="num">${rate}%</td>
        </tr>`;
        }).join("");
    } catch (err) {
        showToast(err.message, "danger");
    }
}


(async function init() {
    await Promise.all([loadMemberOptions(), loadScheduleOptionsWithFullness()]);
    await loadBookings();
    await loadPopularity();
})();
