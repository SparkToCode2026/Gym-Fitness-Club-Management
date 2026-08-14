requireAuth();

let workoutPlans = [];
let members = [];
let trainers = [];

let editModal;
let trainerModal;
let deleteModal;

//loading page for member, trainer, workoutplan
document.addEventListener("DOMContentLoaded", async () => {
    editModal = new bootstrap.Modal(
        document.getElementById("editModal")
    );
    trainerModal = new bootstrap.Modal(
        document.getElementById("trainerModal")
    );
    deleteModal = new bootstrap.Modal(
        document.getElementById("deleteModal")
    );
    document
        .getElementById("filterUserId")
        .addEventListener("change", loadWorkoutPlans);
    document
        .getElementById("activeToggle")
        .addEventListener("change", loadWorkoutPlans);
    document
        .getElementById("addWorkoutForm")
        .addEventListener("submit", createWorkoutPlan);
    document
        .getElementById("editWorkoutForm")
        .addEventListener("submit", updateWorkoutPlan);
    document
        .getElementById("trainerForm")
        .addEventListener("submit", reassignTrainer);
    document
        .getElementById("confirmDeleteBtn")
        .addEventListener("click", deleteWorkoutPlan);
    await loadMemberOptions();
    await loadTrainerOptions();
    await loadWorkoutPlans();

});

//load members 

async function loadMemberOptions() {
    try {
        const users = await api("/user/getAll");
        members = Array.isArray(users)
            ? users.filter(user => {
                const role = user.role;

                return role === "Member" ||  role === 2 || String(role).toLowerCase() === "member";
            }) : [];
        populateMemberSelect(
            document.getElementById("addUserId"),
            "Select member"
        );
        populateMemberSelect(
            document.getElementById("filterUserId"),
            "All members"
        );
    } catch (err) {
        showToast(
            err.message || "Unable to load members",
            "danger"
        );
    }
}
