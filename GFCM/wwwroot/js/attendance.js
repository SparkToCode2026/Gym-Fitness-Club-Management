requireAuth();

let attendanceRecords = [];
let elapsedTimer = null;

//load attendance
document.addEventListener("DOMContentLoaded", async () => {
    await loadAttendance();

    // Updating "In gym" durations every minute
    elapsedTimer = setInterval(() => {
        updateLiveDurations();
    }, 60000);
});

//getAll 
async function loadAttendance() {

    showLoading();

    try {

        const records = await api("/attendance/getAll");
        attendanceRecords = Array.isArray(records) ? records : [];
        renderAttendance(attendanceRecords);

    } catch (error) {

        console.error("Failed to load attendance:", error);//developer notify
        showEmptyState("Failed to load attendance records.");//user notify

    }
}
//rendering attendance table
function renderAttendance(records) {

    const tbody = document.getElementById("attendanceTableBody");

    const tableContainer = document.getElementById("tableContainer");

    const emptyState = document.getElementById("emptyState");

    const loadingSpinner = document.getElementById("loadingSpinner");

    loadingSpinner.classList.add("d-none");


    tbody.innerHTML = "";

    if (!records || records.length === 0) {
        tableContainer.classList.add("d-none");
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");
    tableContainer.classList.remove("d-none");


    records.forEach(attendance => {
        const row = document.createElement("tr");

        const isCurrentlyIn = attendance.checkOutTime === null;

        const memberName = getMemberName(attendance.memberName);

        const branchName = attendance.branchName ?? "-";

        const attendanceDate = formatDate(attendance.attendanceDate);

        const checkIn = formatDateTime(attendance.checkInTime);

        const checkOut = isCurrentlyIn ? "-" : formatDateTime(attendance.checkOutTime);

        const duration =
            calculateDuration(
                attendance.checkInTime,
                attendance.checkOutTime,
                attendance.attendanceId
            );

        const status = isCurrentlyIn
                ? `<span class="badge bg-success">In gym</span>`
                : `<span class="badge bg-secondary">Checked out</span>`;

        row.innerHTML = `
            <td>
                ${escapeHtml(memberName)}
            </td>
            <td>
                ${escapeHtml(branchName)}
            </td>
            <td>
                ${attendanceDate}
            </td>
            <td>
                ${checkIn}
            </td>
            <td>
                ${checkOut}
            </td>
            <td>
                <span
                    id="duration-${attendance.attendanceId}"
                    data-checkin="${attendance.checkInTime}"
                    data-checkout="${attendance.checkOutTime || ""}">
                    ${duration}
                </span>
            </td>
            <td>
                ${status}
            </td>
            <td>
                ${createActionButtons(attendance)}
            </td> `;

        tbody.appendChild(row);
    });

    updateLiveDurations();
}

//acction button
function createActionButtons(attendance) {

    const id = attendance.attendanceId;

    let buttons = 
        <button
            class="btn btn-sm btn-outline-primary me-1"
            onclick="openEditModal(${id})">
            Edit
        </button> ;


    if (attendance.checkOutTime === null) {

        buttons += `

            <button
                class="btn btn-sm btn-outline-success me-1"
                onclick="checkOut(${id})">
                Check Out
            </button>
        `;
    }

    buttons += `
        <button
            class="btn btn-sm btn-outline-danger"
            onclick="deleteAttendance(${id})">
            Delete
        </button>
    `;


    return buttons;
}