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
