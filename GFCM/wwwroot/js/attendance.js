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