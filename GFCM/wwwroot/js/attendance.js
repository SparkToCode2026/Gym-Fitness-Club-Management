requireAuth();

let attendanceRecords = [];
let elapsedTimer = null;

//load attendance
document.addEventListener("DOMContentLoaded", async () => {
    await loadAttendance();

    await loadMemberOptions();
    await loadBranchOptions();

    await loadCurrentlyInGym();

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


async function loadCurrentlyInGym() {
    const loading = document.getElementById("currentlyInGymLoading");
    const emptyState = document.getElementById("currentlyInGymEmpty");
    const container = document.getElementById("currentlyInGym");

    loading.classList.remove("d-none");
    emptyState.classList.add("d-none");
    container.classList.add("d-none");
    container.innerHTML = "";

    try {
        const result = await api(
            "/attendance/getByDate?currentlyIn=true"
        );

        const records = result?.records || [];

        loading.classList.add("d-none");

        if (records.length === 0) {
            emptyState.classList.remove("d-none");
            return;
        }

        renderCurrentlyInGym(records);

    } catch (error) {
        console.error(
            "Failed to load currently in gym:",
            error
        );

        loading.classList.add("d-none");

        emptyState.textContent =
            getErrorMessage(
                error,
                "Failed to load current gym members."
            );

        emptyState.classList.remove("d-none");
    }
}

function renderCurrentlyInGym(records) {
    const container =
        document.getElementById("currentlyInGym");

    container.innerHTML = "";

    records.forEach(attendance => {

        const memberName =
            typeof attendance.memberName === "string"
                ? attendance.memberName
                : attendance.memberName?.userName ?? "-";

        const branchName =
            attendance.branchName ?? "-";


        const card = document.createElement("div");

        card.className = "col-md-4";

        card.innerHTML = `
            <div class="card h-100 border-success">
                <div class="card-body">

                    <div class="d-flex justify-content-between align-items-start mb-2">

                        <h6 class="card-title mb-0">
                            ${escapeHtml(memberName)}
                        </h6>

                        <span class="badge bg-success">
                            In gym
                        </span>

                    </div>

                    <p class="mb-1">
                        <strong>Branch:</strong>
                        ${escapeHtml(branchName)}
                    </p>

                    <p class="mb-0">
                        <strong>Elapsed:</strong>
                        <span
                            class="currently-in-duration"
                            data-checkin="${attendance.checkInTime}">
                            ${elapsedTime}
                        </span>
                    </p>

                </div>
            </div>
        `;

        container.appendChild(card);
    });

    container.classList.remove("d-none");
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

//add attendance function
async function addAttendance() {

    const userId =
        Number(
            document.getElementById("addUserId").value
        );

    const branchId =
        Number(
            document.getElementById("addBranchId").value
        );


    if (!userId || !branchId) {

        showModalMessage(
            "addMessage",
            "Please enter both Member ID and Branch ID.",
            "danger"
        );

        return;
    }


    try {

        await api(
            "/attendance/add",
            "POST",
            {
                userId: userId,
                branchId: branchId
            }
        );


        showModalMessage(
            "addMessage",
            "Member checked in successfully.",
            "success"
        );


        document.getElementById("addUserId").value = "";
        document.getElementById("addBranchId").value = "";


        await loadAttendance();


        setTimeout(() => {

            const modalElement =
                document.getElementById("addModal");

            const modal =
                bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }

        }, 700);


    } catch (error) {

        console.error("Check-in failed:", error);

        showModalMessage(
            "addMessage",
            getErrorMessage(error, "Failed to check in member."),
            "danger"
        );
    }
}

//check out member 
async function checkOut(attendanceId) {

    const confirmed =
        confirm("Are you sure you want to check out this member?");


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await api(
                `/attendance/updateCheckOut?attendanceId=${attendanceId}`,
                "PATCH"
            );


        alert(
            result?.message ||
            "Member checked out successfully."
        );


        await loadAttendance();


    } catch (error) {

        console.error("Check-out failed:", error);

        alert(
            getErrorMessage(
                error,
                "Failed to check out member."
            )
        );
    }
}

//edit model
async function openEditModal(attendanceId) {

    try {

        const record =
            await api(
                `/attendance/get?attendanceId=${attendanceId}`
            );


        document.getElementById("editAttendanceId").value =
            record.attendanceId;


        document.getElementById("editDate").value =
            toInputDate(record.attendanceDate);


        document.getElementById("editBranchId").value =
            record.branchId;


        document.getElementById("editMessage").classList.add("d-none");


        const modalElement =
            document.getElementById("editModal");


        const modal =
            new bootstrap.Modal(modalElement);


        modal.show();


    } catch (error) {

        console.error("Failed to load attendance:", error);

        alert(
            getErrorMessage(
                error,
                "Failed to load attendance record."
            )
        );
    }
}

//update attendance
async function updateAttendance() {

    const attendanceId =
        Number(
            document.getElementById("editAttendanceId").value
        );


    const attendanceDate =
        document.getElementById("editDate").value;


    const branchId =
        Number(
            document.getElementById("editBranchId").value
        );


    if (!attendanceId || !attendanceDate || !branchId) {

        showModalMessage(
            "editMessage",
            "Please fill in all required fields.",
            "danger"
        );

        return;
    }


    try {

        await api(
            `/attendance/update?attendanceId=${attendanceId}`,
            "PUT",
            {
                attendanceDate: attendanceDate,
                branchId: branchId
            }
        );


        showModalMessage(
            "editMessage",
            "Attendance updated successfully.",
            "success"
        );


        await loadAttendance();


        setTimeout(() => {

            const modalElement =
                document.getElementById("editModal");

            const modal =
                bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }

        }, 700);


    } catch (error) {

        console.error("Update failed:", error);

        showModalMessage(
            "editMessage",
            getErrorMessage(
                error,
                "Failed to update attendance."
            ),
            "danger"
        );
    }
}

//delete attendance
async function deleteAttendance(attendanceId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this attendance record?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await api(
            `/attendance/remove?attendanceId=${attendanceId}`,
            "DELETE"
        );


        await loadAttendance();


    } catch (error) {

        console.error("Delete failed:", error);

        alert(
            getErrorMessage(
                error,
                "Failed to delete attendance."
            )
        );
    }
}

//filter button get by date
async function applyFilters() {

    const date =
        document.getElementById("filterDate").value;


    const branchId =
        document.getElementById("filterBranchId").value;


    const userId =
        document.getElementById("filterUserId").value;


    const currentlyIn =
        document.getElementById("currentlyInFilter").checked;


    const params = new URLSearchParams();


    if (date) {
        params.append("date", date);
    }


    if (branchId) {
        params.append("branchId", branchId);
    }


    if (userId) {
        params.append("userId", userId);
    }


    if (currentlyIn) {
        params.append("currentlyIn", "true");
    }


    try {

        showLoading();


        if (
            !date &&
            !branchId &&
            !userId &&
            !currentlyIn
        ) {

            await loadAttendance();

            return;
        }


        const result =
            await api(
                `/attendance/getByDate?${params.toString()}`
            );


        attendanceRecords =
            result?.records || [];


        renderAttendance(attendanceRecords);


    } catch (error) {

        console.error("Filter failed:", error);

        showEmptyState(
            getErrorMessage(
                error,
                "Failed to filter attendance."
            )
        );
    }
}
//clear the filter 
async function clearFilters() {

    document.getElementById("filterDate").value = "";
    document.getElementById("filterBranchId").value = "";
    document.getElementById("filterUserId").value = "";
    document.getElementById("currentlyInFilter").checked = false;


    await loadAttendance();
}
//live duration
function updateLiveDurations() {

    document
        .querySelectorAll("[id^='duration-']")
        .forEach(element => {

            const checkIn =
                element.dataset.checkin;


            const checkOut =
                element.dataset.checkout;


            if (!checkIn) {
                return;
            }


            element.textContent =
                calculateDuration(
                    checkIn,
                    checkOut || null
                );
        });

    document
        .forEach(element => {

            const checkIn =
                element.dataset.checkin;

            if (!checkIn) {
                return;
            }

            element.textContent =
                calculateDuration(
                    checkIn,
                    null
                );
        });
}


function calculateDuration(
    checkInTime,
    checkOutTime,
    attendanceId = null
) {

    if (!checkInTime) {
        return "-";
    }


    const start =
        new Date(checkInTime);


    const end =
        checkOutTime
            ? new Date(checkOutTime)
            : new Date();


    let difference =
        end - start;


    if (difference < 0) {
        difference = 0;
    }


    const totalSeconds =
        Math.floor(difference / 1000);


    const hours =
        Math.floor(totalSeconds / 3600);


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}


function pad(number) {

    return String(number).padStart(2, "0");
}

//fetch member name 
function getMemberName(member) {

    if (!member) {
        return "-";
    }

    if (typeof member === "string") {
        return member;
    }

    return member.userName ?? "-";
}
//date formate
function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return value;
    }


    return date.toLocaleDateString();
}


function formatDateTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return value;
    }


    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}


function toInputDate(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return "";
    }


    const year =
        date.getFullYear();


    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");


    const day =
        String(date.getDate())
            .padStart(2, "0");


    return `${year}-${month}-${day}`;
}
//load empty state
function showLoading() {

    document
        .getElementById("loadingSpinner")
        .classList.remove("d-none");


    document
        .getElementById("tableContainer")
        .classList.add("d-none");


    document
        .getElementById("emptyState")
        .classList.add("d-none");
}


function showEmptyState(message) {

    document
        .getElementById("loadingSpinner")
        .classList.add("d-none");


    document
        .getElementById("tableContainer")
        .classList.add("d-none");


    const emptyState =
        document.getElementById("emptyState");


    emptyState.textContent = message;
    emptyState.classList.remove("d-none");
}
//display model message
function showModalMessage(
    elementId,
    message,
    type
) {

    const element =
        document.getElementById(elementId);


    element.textContent = message;


    element.className =
        `alert alert-${type}`;
}
//error message
function getErrorMessage(
    error,
    fallback
) {

    if (!error) {
        return fallback;
    }


    if (typeof error === "string") {
        return error;
    }


    return (
        error.message ||
        error.error ||
        error.title ||
        fallback
    );
}

async function loadMemberOptions() {
    const members = await api("/user/getByRole?role=Member");

    const select = document.getElementById("addUserId");

    select.innerHTML = `
        <option value="">Select member</option>
        ${members.map(member => `
            <option value="${member.userId}">
                ${escapeHtml(member.userName)}
            </option>
        `).join("")}
    `;
}

async function loadBranchOptions() {
    const branches = await api("/branch/getAll");

    const select = document.getElementById("addBranchId");

    select.innerHTML = `
        <option value="">Select branch</option>
        ${branches.map(branch => `
            <option value="${branch.branchId}">
                ${escapeHtml(branch.branchName)}
            </option>
        `).join("")}
    `;
}