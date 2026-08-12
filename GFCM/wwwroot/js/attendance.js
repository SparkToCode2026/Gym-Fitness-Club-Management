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
