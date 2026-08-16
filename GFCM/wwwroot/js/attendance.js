requireAuth();


let attendanceRecords = [];
let elapsedTimer = null;
let branches = [];

//load attendance
document.addEventListener("DOMContentLoaded", async () => {

    await loadMemberOptions();
    await loadBranchOptions();
    await loadAttendance();
    await loadCurrentlyInGym();
    await loadAveragePerBranch();

    // Updating "In gym" durations every minute
    elapsedTimer = setInterval(() => {
        updateLiveDurations();
    }, 60000);

});

async function loadBranchOptions() {
    try {
        const response = await api("/branch/getAll");

        branches = Array.isArray(response)
            ? response
            : response?.branches ||
            response?.records ||
            response?.data ||
            [];

        console.log("BRANCHES API RESPONSE:", response);
        console.log("BRANCHES USED:", branches);

        const addSelect = document.getElementById("addBranchId");
        const filterSelect = document.getElementById("filterBranchId");
        const editSelect = document.getElementById("editBranchId");

        if (addSelect) {
            addSelect.innerHTML = `
                <option value="">Select branch</option>
                ${branches.map(branch => `
                    <option value="${branch.branchId}">
                        ${escapeHtml(branch.branchName)}
                    </option>
                `).join("")}
            `;
        }

        if (filterSelect) {
            filterSelect.innerHTML = `
                <option value="">All branches</option>
                ${branches.map(branch => `
                    <option value="${branch.branchId}">
                        ${escapeHtml(branch.branchName)}
                    </option>
                `).join("")}
            `;
        }

        if (editSelect) {
            editSelect.innerHTML = `
                <option value="">Select branch</option>
                ${branches.map(branch => `
                    <option value="${branch.branchId}">
                        ${escapeHtml(branch.branchName)}
                    </option>
                `).join("")}
            `;
        }

    } catch (error) {
        console.error("Failed to load branches:", error);

        showToast(
            getErrorMessage(
                error,
                "Failed to load branches."
            ),
            "danger"
        );
    }
}
//getAll 
async function loadAttendance() {

    showLoading();

    try {

        const records = await api("/attendance/getAll");
        attendanceRecords = Array.isArray(records) ? records : [];

        renderAttendance(attendanceRecords);

        updateCheckInMemberOptions();

    } catch (error) {

        console.error("Failed to load attendance:", error);//developer notify
        showEmptyState(
            getErrorMessage(
                error,
                "Failed to load attendance records."
            )
        );//user notify

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

function getBranchNameById(branchId) {
    if (branchId === null || branchId === undefined || branchId === "") {
        return "-";
    }

    // If a complete branch object was passed
    if (typeof branchId === "object") {
        return branchId.branchName ?? "-";
    }

    // Find branch from the loaded branch list
    const branch = branches.find(
        branch => String(branch.branchId) === String(branchId)
    );

    return branch?.branchName ?? "-";
}
function renderCurrentlyInGym(records) {
    const container =
        document.getElementById("currentlyInGym");

    container.innerHTML = "";

    records.forEach(attendance => {

        const memberName = getMemberName(attendance.memberName);

        const branchName =
            attendance.branchName ||
            getBranchNameById(attendance.branchId) ||
            "-";


        const card = document.createElement("div");

        const elapsedTime = calculateDuration(
            attendance.checkInTime,
            null
        );

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

async function loadAveragePerBranch() {

    const loading =
        document.getElementById(
            "averagePerBranchLoading"
        );

    const emptyState =
        document.getElementById(
            "averagePerBranchEmpty"
        );

    const container =
        document.getElementById(
            "averagePerBranch"
        );

    loading.classList.remove("d-none");
    emptyState.classList.add("d-none");
    container.classList.add("d-none");

    container.innerHTML = "";

    try {

        const result =
            await api(
                "/attendance/averagePerBranch"
            );

        const records =
            Array.isArray(result)
                ? result
                : (
                    result?.records ??
                    result?.data ??
                    result?.averages ??
                    []
                );

        loading.classList.add("d-none");

        if (
            !Array.isArray(records) ||
            records.length === 0
        ) {

            emptyState.classList.remove(
                "d-none"
            );

            return;
        }

        renderAveragePerBranch(records);

    } catch (error) {

        console.error(
            "Failed to load branch averages:",
            error
        );

        loading.classList.add("d-none");

        emptyState.textContent =
            getErrorMessage(
                error,
                "Failed to load branch averages."
            );

        emptyState.classList.remove(
            "d-none"
        );
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

        row.id = `attendance-row-${attendance.attendanceId}`;

        const isCurrentlyIn = attendance.checkOutTime === null;

        const memberName = getMemberName(attendance.memberName);

        const branchName = attendance.branchName ||
            getBranchNameById(attendance.branchId);

        const attendanceDate = formatDate(attendance.attendanceDate);

        const checkIn = formatDateTime(attendance.checkInTime);

        const checkOut = isCurrentlyIn ? "-" : formatDateTime(attendance.checkOutTime);

        const duration =
            calculateDuration(
                attendance.checkInTime,
                attendance.checkOutTime,
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

    let buttons = `
        <button
            class="btn btn-sm btn-outline-primary me-1"
            onclick="openEditModal(${id})">
            Edit
        </button> `;


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

    const userSelect = document.getElementById("addUserId");
    const branchSelect = document.getElementById("addBranchId");

    if (!userSelect || !branchSelect) {
        console.error("Check-in form elements not found.");

        showToast(
            "Check-in form is not configured correctly.",
            "danger"
        );

        return;
    }

    const userId = Number(userSelect.value);
    const branchId = Number(branchSelect.value);

    // Validate member
    if (!userSelect.value) {
        showModalMessage(
            "addMessage",
            "Please select a member.",
            "danger"
        );
        return;
    }

    // Validate branch
    if (!branchSelect.value) {
        showModalMessage(
            "addMessage",
            "Please select a branch.",
            "danger"
        );
        return;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
        console.error("Invalid userId:", userSelect.value);

        showModalMessage(
            "addMessage",
            "Invalid member selected.",
            "danger"
        );

        return;
    }

    if (!Number.isInteger(branchId) || branchId <= 0) {
        console.error("Invalid branchId:", branchSelect.value);

        showModalMessage(
            "addMessage",
            "Invalid branch selected.",
            "danger"
        );

        return;
    }

    // Prevent checking in a member who is already inside
    const alreadyInGym = attendanceRecords.some(
        attendance =>
            Number(attendance.userId) === userId &&
            attendance.checkOutTime == null
    );

    if (alreadyInGym) {
        showModalMessage(
            "addMessage",
            "Already checked in, check out first.",
            "danger"
        );

        return;
    }

    try {

        console.log("CHECK-IN REQUEST:", {
            userId: userId,
            branchId: branchId
        });

        const result = await api(
            "/attendance/add",
            "POST",
            {
                userId: userId,
                branchId: branchId
            }
        );

        console.log("CHECK-IN RESPONSE:", result);

        showModalMessage(
            "addMessage",
            result?.message || "Member checked in successfully.",
            "success"
        );

        // Reset form
        userSelect.value = "";
        branchSelect.value = "";

        // Reload attendance data
        await loadAttendance();
        await loadCurrentlyInGym();
        await loadAveragePerBranch();

        updateCheckInMemberOptions();

        // Close modal
        setTimeout(() => {

            const modalElement =
                document.getElementById("addModal");

            if (!modalElement) {
                return;
            }

            const modal =
                bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }

        }, 700);

    } catch (error) {

        console.error("CHECK-IN FAILED:", error);

        showModalMessage(
            "addMessage",
            getErrorMessage(
                error,
                "Failed to check in member."
            ),
            "danger"
        );
    }
}

function updateCheckInMemberOptions() {

    const select =
        document.getElementById("addUserId");

    if (!select) {
        return;
    }

    const checkedInUserIds =
        new Set(
            attendanceRecords
                .filter(
                    record =>
                        record.checkOutTime == null
                )
                .map(
                    record =>
                        String(record.userId)
                )
                .filter(Boolean)
        );

    Array.from(select.options)
        .forEach(option => {

            if (!option.value) {
                return;
            }

            const alreadyIn =
                checkedInUserIds.has(
                    String(option.value)
                );

            option.disabled = alreadyIn;

            const originalText =
                option.dataset.originalText ||
                option.textContent;

            option.dataset.originalText =
                originalText;

            option.textContent =
                alreadyIn
                    ? `${originalText} — Already in gym`
                    : originalText;
        });
}


//check out member 
async function checkOut(attendanceId) {

    const confirmed = await confirmDialog(
        "Are you sure you want to check out this member?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const result =
            await api(
                `/attendance/updateCheckOut?attendanceId=${attendanceId}`,
                "PATCH"
            );

        const row =
            document.getElementById(
                `attendance-row-${attendanceId}`
            );

        if (row) {

            const cells = row.querySelectorAll("td");

            // Check-out column
            cells[4].textContent =
                result?.checkOutTime
                    ? formatDateTime(result.checkOutTime)
                    : formatDateTime(new Date());

            // Duration column
            const durationElement =
                document.getElementById(
                    `duration-${attendanceId}`
                );

            if (durationElement) {

                durationElement.dataset.checkout =
                    result?.checkOutTime ||
                    new Date().toISOString();

                durationElement.textContent =
                    result?.duration ||
                    calculateDuration(
                        durationElement.dataset.checkin,
                        durationElement.dataset.checkout
                    );
            }

            // Status column
            cells[6].innerHTML =
                `<span class="badge bg-secondary">
                    Checked out
                </span>`;

            // Actions column
            cells[7].innerHTML = `
                <button
                    class="btn btn-sm btn-outline-primary me-1"
                    onclick="openEditModal(${attendanceId})">
                    Edit
                </button>

                <button
                    class="btn btn-sm btn-outline-danger"
                    onclick="deleteAttendance(${attendanceId})">
                    Delete
                </button>
            `;
        }

        showToast(
            result?.message ||
            "Member checked out successfully.",
            "success"
        );

        // Update the currently-in-gym panel
        await loadCurrentlyInGym();

        // Update disabled member options
        updateCheckInMemberOptions();

    } catch (error) {

        console.error("Check-out failed:", error);

        showToast(
            getErrorMessage(
                error,
                "Failed to check out member."
            ),
            "danger"
        );
    }
}
function renderAveragePerBranch(records) {

    const container =
        document.getElementById(
            "averagePerBranch"
        );

    container.innerHTML = "";

    records.forEach(item => {

        const branchName = item.branchName ?? "Branch";

        const average =
            item.averagePerDay ?? "-";

        const card =
            document.createElement("div");

        card.className =
            "col-md-4";

        card.innerHTML = `
            <div class="card h-100">

                <div class="card-body">

                    <h6 class="card-title mb-2">
                        ${escapeHtml(
            String(branchName)
        )}
                    </h6>

                    <div class="fs-4 fw-bold">
                        ${escapeHtml(
            String(average)
        )}
                    </div>

                    <small class="text-muted">
                        Average daily attendance
                    </small>

                </div>

            </div>
        `;

        container.appendChild(card);
    });

    container.classList.remove(
        "d-none"
    );
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

        showEmptyState(
            getErrorMessage(
                error,
                "Failed to load attendance records."
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

    const confirmed = await confirmDialog(
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

        showToast(
            "Attendance record deleted successfully.",
            "success"
        );

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

    console.log("FILTER VALUES:", {
        date,
        branchId,
        userId,
        currentlyIn
    });

    const params = new URLSearchParams();

    if (date && date !== "undefined") {
        params.append("date", date);
    }

    if (
        branchId &&
        branchId !== "undefined"
    ) {
        params.append("branchId", branchId);
    }

    if (
        userId &&
        userId !== "undefined"
    ) {
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

        const queryString = params.toString();

        console.log(
            "ATTENDANCE FILTER URL:",
            `/attendance/getByDate?${queryString}`
        );

        const result =
            await api(
                `/attendance/getByDate?${queryString}`
            );

        attendanceRecords =
            Array.isArray(result)
                ? result
                : result?.records || [];

        renderAttendance(attendanceRecords);

        updateCheckInMemberOptions();

    } catch (error) {

        console.error(
            "Filter failed:",
            error
        );

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
        .querySelectorAll(".currently-in-duration")
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
    try {
        const response = await api("/user/getByRole?role=Member");

        console.log("MEMBERS API RESPONSE:", response);

        const members =
            Array.isArray(response)
                ? response
                : response?.users ||
                response?.records ||
                response?.data ||
                response?.items ||
                [];

        console.log("MEMBERS USED BY DROPDOWN:", members);

        const addSelect = document.getElementById("addUserId");
        const filterSelect = document.getElementById("filterUserId");

        if (!addSelect || !filterSelect) {
            console.error("Member select element not found.");
            return;
        }

        addSelect.innerHTML = `
            <option value="">Select member</option>
            ${members.map(member => `
                <option value="${member.userId}">
                    ${escapeHtml(member.userName)}
                </option>
            `).join("")}
        `;

        filterSelect.innerHTML = `
            <option value="">All members</option>
            ${members.map(member => `
                <option value="${member.userId}">
                    ${escapeHtml(member.userName)}
                </option>
            `).join("")}
        `;

    } catch (error) {
        console.error("Failed to load members:", error);

        showToast(
            getErrorMessage(
                error,
                "Failed to load members."
            ),
            "danger"
        );
    }
}

function escapeHtml(value) {
    if (value === null ||
        value === undefined) {
        return "";
    }
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function setTodayFilter() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    document.getElementById("filterDate").value =
        `${year}-${month}-${day}`;

    applyFilters();
}