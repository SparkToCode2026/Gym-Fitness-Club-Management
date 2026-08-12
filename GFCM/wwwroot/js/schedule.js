requireAuth();

let allBranches = [];
let allTrainers = [];
let currentSchedules = [];
let scheduleToDeleteId = null;

async function loadBranchOptions() {
    allBranches = await api("/branch/getAll");
    const opts = allBranches.map(b => `<option value="${b.branchId}">${b.branchName}</option>`).join("");
    document.getElementById("filterBranch").innerHTML =
        `<option value="">All branches</option>` + opts;
    document.getElementById("addBranchId").innerHTML = opts;
}

async function loadTrainerOptions() {
    allTrainers = await api("/trainerprofile/getAll");
    const opts = allTrainers
        .map(t => `<option value="${t.trainerProfileId}">${t.trainerName}</option>`)
        .join("");
    document.getElementById("addTrainerId").innerHTML = opts;
    document.getElementById("reassignTrainerId").innerHTML = opts; 
}

//Case 01 - Timetable list
async function loadSchedules() {
    const body = document.getElementById("scheduleTableBody");
    
    //FIX : Changed showSpinner parameter from element to ID string
    showSpinner("scheduleTableWrap");

    try {
        const schedules = await api("/classschedule/getAll"); 
        currentSchedules = schedules;

        //FIX: Replaced non-existent showEmptyState with emptyRow
        if (!schedules.length) {
            document.getElementById("scheduleTableWrap").innerHTML = `
      <table class="table table-hover table-striped bg-white">
        <thead>
          <tr>
            <th>Class</th><th>Trainer</th><th>Branch</th><th>Start</th><th>End</th>
            <th>Fullness</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="scheduleTableBody">
          ${emptyRow(7, "No classes scheduled yet.")}
        </tbody>
      </table>`;
            return;
        }
        

        const rows = schedules.map((s, i) => {
            const c = counts[i];
            const full = c.booked >= c.capacity;
            const pct = c.capacity > 0 ? Math.min(100, Math.round((c.booked / c.capacity) * 100)) : 0;
            let fullnessState = "";
            if (c.booked >= c.capacity) fullnessState = "is-full";
            else if (pct >= 80) fullnessState = "is-nearly";
            return `

        <tr>
          <td class="fw-semibold">${s.className}</td>
          <td>${s.trainerName ?? '<span class="nil"></span>'}</td>
          <td>${s.branchName ?? '<span class="nil"></span>'}</td>
          <td class="num">${formatDateTime(s.startTime)}</td>
          <td class="num">${formatDateTime(s.endTime)}</td>
          <td>
            <div class="fullness ${fullnessState}">
              <div class="progress">
                <div class="progress-bar" style="width:${pct}%"></div>
              </div>
              <span class="count">${c.booked}/${c.capacity}</span>
            </div>
          </td>
          <td class="table-actions">
            <button class="btn btn-outline-secondary" onclick="openEditModal(${s.classScheduleId})">Edit</button>
            <button class="btn btn-outline-secondary" onclick="openReassignModal(${s.classScheduleId})">Reassign</button>
            <button class="btn btn-outline-danger" onclick="promptDeleteSchedule(${s.classScheduleId}, ${c.booked})">Cancel</button>
          </td>
        </tr>`;
        }).join("");

        document.getElementById("scheduleTableBody").innerHTML = rows;
        document.getElementById("resultCount").textContent = `(${schedules.length})`;
    } catch (err) {
        showToast(err.message, "danger");
    }
}


// FIX:  Deleted duplicate formatDateTime function definition
function formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

//Case 02: Add a class
document.getElementById("btnSubmitAdd").addEventListener("click", async () => {
    const alertBox = document.getElementById("addScheduleAlert");
    alertBox.classList.add("d-none");

    const className = document.getElementById("addClassName").value.trim();
    const trainerProfileId = parseInt(document.getElementById("addTrainerId").value);
    const branchId = parseInt(document.getElementById("addBranchId").value);
    const startTime = document.getElementById("addStartTime").value;
    const endTime = document.getElementById("addEndTime").value;
    const capacity = parseInt(document.getElementById("addCapacity").value);

    if (!className) return showFieldError(alertBox, "Class name is required.");
    if (!startTime || !endTime) return showFieldError(alertBox, "Start and end time are required.");
    if (new Date(endTime) <= new Date(startTime)) return showFieldError(alertBox, "End time must be after start time.");
    if (!capacity || capacity < 1) return showFieldError(alertBox, "Capacity must be at least 1.");


    // FIX : Added input resets for times and capacity along with className on successful add
    
    try {
        await api("/classschedule/add", "POST", { className, trainerProfileId, branchId, startTime, endTime, capacity }); // POST /classschedule/add
        bootstrap.Modal.getInstance(document.getElementById("addScheduleModal")).hide();
        
        document.getElementById("addClassName").value = "";
        document.getElementById("addStartTime").value = "";
        document.getElementById("addEndTime").value = "";
        document.getElementById("addCapacity").value = "10";

        showToast("Class added successfully", "success");
        await loadSchedules();
    }

    catch (err) {
        showFieldError(alertBox, err.message);
    }
});

// FIX :added the missing closing brace
function showFieldError(alertBox, message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}
    
    

// Case 03: Edit a class
    let editingSchedule = null;

    async function openEditModal(classScheduleId) {
        document.getElementById("editScheduleAlert").classList.add("d-none");

        try {
            const s = await api(`/classschedule/get?classScheduleId=${classScheduleId}`); // GET /classschedule/get
            editingSchedule = s;

            document.getElementById("editClassScheduleId").value = classScheduleId;
            document.getElementById("editClassName").value = s.className;
            document.getElementById("editStartTime").value = toLocalInputValue(s.startTime);
            document.getElementById("editEndTime").value = toLocalInputValue(s.endTime);
            document.getElementById("editCapacity").value = s.capacity;

            const count = await api(`/classschedule/getBookingCount?classScheduleId=${classScheduleId}`); // GET /classschedule/getBookingCount
            document.getElementById("editBookedHint").textContent = `(currently ${count.booked} booked - can't go below this)`;

            new bootstrap.Modal(document.getElementById("editScheduleModal")).show();
        } catch (err) {
            showToast(err.message, "danger");
        }
    }

    function toLocalInputValue(iso) {
        const d = new Date(iso);
        const pad = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    document.getElementById("btnSubmitEdit").addEventListener("click", async () => {
        const alertBox = document.getElementById("editScheduleAlert");
        alertBox.classList.add("d-none");

        const classScheduleId = document.getElementById("editClassScheduleId").value;
        const s = editingSchedule;

        const className = document.getElementById("editClassName").value.trim();
        const startTime = document.getElementById("editStartTime").value;
        const endTime = document.getElementById("editEndTime").value;
        const capacity = parseInt(document.getElementById("editCapacity").value);

        if (new Date(endTime) <= new Date(startTime)) return showFieldError(alertBox, "End time must be after start time.");

        try {
                // FIX: Using trainerProfileId and branchId directly
            
            await api(`/classschedule/update?classScheduleId=${classScheduleId}`, "PUT", { 
                className,
                trainerProfileId: trainer ? trainer.trainerProfileId : s.trainerProfileId,
                branchId: branch ? branch.branchId : s.branchId,
                startTime,
                endTime,
                capacity
            });
            bootstrap.Modal.getInstance(document.getElementById("editScheduleModal")).hide();
            showToast("Class updated successfully", "success");

            await loadSchedules();
        } catch (err) {
            showFieldError(alertBox, err.message);
        }
    });
    
    

// Case 04: Reassign trainer
function openReassignModal(classScheduleId) {
    document.getElementById("reassignAlert").classList.add("d-none");
    document.getElementById("reassignClassScheduleId").value = classScheduleId;

    const s = currentSchedules.find(x => x.classScheduleId === classScheduleId);
    const currentTrainer = allTrainers.find(t => t.trainerName === s?.trainerName);
    if (currentTrainer) document.getElementById("reassignTrainerId").value = currentTrainer.trainerProfileId;

    new bootstrap.Modal(document.getElementById("reassignModal")).show();
}

document.getElementById("btnSubmitReassign").addEventListener("click", async () => {
    const alertBox = document.getElementById("reassignAlert");
    alertBox.classList.add("d-none");

    const classScheduleId = document.getElementById("reassignClassScheduleId").value;
    const newTrainerProfileId = document.getElementById("reassignTrainerId").value;

    try {
        await api(`/classschedule/updateTrainer?classScheduleId=${classScheduleId}&newTrainerProfileId=${newTrainerProfileId}`, "PATCH"); // PATCH /classschedule/updateTrainer
        bootstrap.Modal.getInstance(document.getElementById("reassignModal")).hide();
        showToast("Trainer reassigned successfully", "success");
        await loadSchedules();
    } catch (err) {
        showFieldError(alertBox, err.message);
    }
});

//Case 05: Cancel/Delete a class
function promptDeleteSchedule(classScheduleId, bookedCount) {
    scheduleToDeleteId = classScheduleId;
    const msgText = bookedCount > 0
        ? `Are you sure you want to cancel this class? <b>${bookedCount} booking(s)</b> will be cancelled as a result.`
        : "Are you sure you want to cancel this class?";

    document.getElementById("deleteConfirmMessage").innerHTML = msgText;
    new bootstrap.Modal(document.getElementById("deleteScheduleModal")).show();
}

document.getElementById("btnConfirmDelete").addEventListener("click", async () => {
    if (!scheduleToDeleteId) return;

    try {
        const res = await api(`/classschedule/remove?classScheduleId=${scheduleToDeleteId}`, "DELETE"); // DELETE /classschedule/remove
        showToast(res?.message ? `${res.message} (${res.bookingsCancelled ?? 0} bookings cancelled)` : "Class cancelled", "success");
        bootstrap.Modal.getInstance(document.getElementById("deleteScheduleModal")).hide();
        await loadSchedules();
    } catch (err) {
        showToast(err.message, "danger");
    } finally {
        scheduleToDeleteId = null;
    }
});

//Case 06: Filter and presets
async function applyFilter() {
    const from = document.getElementById("filterFrom").value;
    const to = document.getElementById("filterTo").value;
    const branchId = document.getElementById("filterBranch").value;

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (branchId) params.set("branchId", branchId);

    try {
        const result = await api(`/classschedule/getByDate?${params.toString()}`); // GET /classschedule/getByDate
        renderFilteredList(result.classes || []);
        document.getElementById("resultCount").textContent = `${result.count ?? 0} class(es)`;
    } catch (err) {
        showToast(err.message, "danger");
    }
}

// FIX : Replaced non-existent showEmptyState call with emptyRow
function renderFilteredList(classes) {
    const wrap = document.getElementById("scheduleTableWrap");
    if (!classes.length) {
        wrap.innerHTML = `
        <table class="table table-hover table-striped bg-white">
          <thead><tr><th>Class</th><th>Start</th><th>End</th><th>Capacity</th></tr></thead>
          <tbody>
            ${emptyRow(4, "No classes match that filter.")}
          </tbody>
        </table>`;
        return;
    }
    

    wrap.innerHTML = `
    <table class="table table-hover table-striped bg-white">
      <thead><tr><th>Class</th><th>Start</th><th>End</th><th>Capacity</th></tr></thead>
      <tbody>
        ${classes.map(c => `
          <tr>
            <td>${c.className}</td>
            <td>${formatDateTime(c.startTime)}</td>
            <td>${formatDateTime(c.endTime)}</td>
            <td>${c.capacity}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

document.getElementById("btnApplyFilter").addEventListener("click", applyFilter);
document.getElementById("btnClearFilter").addEventListener("click", () => {
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";
    document.getElementById("filterBranch").value = "";
    loadSchedules();
});

function setPresetRange(days) {
    const today = new Date();
    const from = new Date(today);
    const to = new Date(today);
    to.setDate(to.getDate() + days);
    document.getElementById("filterFrom").value = from.toISOString().slice(0, 10);
    document.getElementById("filterTo").value = to.toISOString().slice(0, 10);
    applyFilter();
}

document.getElementById("presetToday").addEventListener("click", () => setPresetRange(0));
document.getElementById("presetWeek").addEventListener("click", () => setPresetRange(7));
document.getElementById("presetMonth").addEventListener("click", () => setPresetRange(30));

// Initialization
(async function init() {
    await Promise.all([loadBranchOptions(), loadTrainerOptions()]);
    await loadSchedules();
})();