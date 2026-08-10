requireAuth();

let allBranches = [];
let allTrainers = [];
let currentSchedules = [];


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
    showSpinner(document.getElementById("scheduleTableWrap"));

    try {
        const schedules = await api("/classschedule/getAll"); // already sorted by startTime by the backend
        currentSchedules = schedules;

        if (!schedules.length) {
            showEmptyState(document.getElementById("scheduleTableWrap"), "No classes scheduled yet.");
            return;
        }

     
        document.getElementById("scheduleTableWrap").innerHTML = `
      <table class="table table-hover table-striped bg-white">
        <thead>
          <tr>
            <th>Class</th><th>Trainer</th><th>Branch</th><th>Start</th><th>End</th>
            <th>Fullness</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="scheduleTableBody"></tbody>
      </table>`;
        const counts = await Promise.all(
            schedules.map(s => api(`/classschedule/getBookingCount?classScheduleId=${s.classScheduleId}`))
        );

        const rows = schedules.map((s, i) => {
            const c = counts[i];
            const full = c.booked >= c.capacity;
            const pct = c.capacity > 0 ? Math.min(100, Math.round((c.booked / c.capacity) * 100)) : 0;
            return `
        <tr>
          <td>${s.className}</td>
          <td>${s.trainerName ?? "-"}</td>
          <td>${s.branchName ?? "-"}</td>
          <td>${formatDateTime(s.startTime)}</td>
          <td>${formatDateTime(s.endTime)}</td>
          <td style="min-width:140px">
            <div class="d-flex justify-content-between small mb-1">
              <span>${c.booked} / ${c.capacity}</span>
            </div>
            <div class="progress" style="height:6px;">
              <div class="progress-bar ${full ? "bg-danger" : "bg-primary"}" style="width:${pct}%"></div>
            </div>
          </td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-outline-secondary" onclick="openEditModal(${s.classScheduleId})">Edit</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="openReassignModal(${s.classScheduleId})">Reassign</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteSchedule(${s.classScheduleId}, ${c.booked})">Cancel</button>
          </td>
        </tr>`;
        }).join("");

        document.getElementById("scheduleTableBody").innerHTML = rows;
        document.getElementById("resultCount").textContent = `${schedules.length} class(es)`;
    } catch (err) {
        showToast(err.message, "danger");
    }
}

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

    try {
        await api("/classschedule/add", "POST", { className, trainerProfileId, branchId, startTime, endTime, capacity }); // POST /classschedule/add
        bootstrap.Modal.getInstance(document.getElementById("addScheduleModal")).hide();
        document.getElementById("addClassName").value = "";
        showToast("Class added successfully", "success");
        await loadSchedules();
    } catch (err) {
        showFieldError(alertBox, err.message);
    }
});

function showFieldError(alertBox, message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}


