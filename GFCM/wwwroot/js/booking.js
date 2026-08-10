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
    if (!list) showSpinner(wrap);

    try {
        const bookings = list ?? await api("/classbooking/getAll");

        if (!bookings.length) {
            showEmptyState(wrap, "No bookings found.");
            document.getElementById("resultCount").textContent = "(0)";
            return;
        }

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
        <tbody id="bookingTableBody"></tbody>
      </table>`;

        document.getElementById("bookingTableBody").innerHTML = bookings.map(b => `
      <tr data-user-id="${b.userId}" data-schedule-id="${b.classScheduleId}">
        <td class="fw-semibold">${b.memberName ?? '<span class="nil"></span>'}</td>
        <td>${b.className ?? '<span class="nil"></span>'}</td>
        <td class="num">${new Date(b.bookingDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
        <td>${getStatusBadge(b.bookingStatus)}</td>
        <td class="table-actions">
          <select class="form-select form-select-sm d-inline-block w-auto me-1"
                  onchange="updateBookingStatus(${b.userId}, ${b.classScheduleId}, this.value)">
            <option value="" selected disabled>Set status...</option>
            <option value="Booked">Booked</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Attended">Attended</option>
          </select>
          <button class="btn btn-outline-secondary" onclick="openMoveModal(${b.userId}, ${b.classScheduleId})">Move</button>
          <button class="btn btn-outline-danger" onclick="cancelBooking(${b.userId}, ${b.classScheduleId})">Cancel</button>
        </td>
      </tr>`).join("");

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

