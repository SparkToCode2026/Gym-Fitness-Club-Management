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

function populateMemberSelect(select, firstText) {
    select.innerHTML = "";
    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = firstText;
    select.appendChild(firstOption);
    members.forEach(member => {
        const option = document.createElement("option");
        option.value = member.userId;
        option.textContent = member.userName;
        select.appendChild(option);
    });

}


async function loadTrainerOptions() {
    try {
        const result =
            await api("/trainerprofile/getAll");
        trainers =
            Array.isArray(result)
                ? result
                : [];
        populateTrainerSelect(
            document.getElementById("addTrainerProfileId"),
            "Self-directed"
        );
        populateTrainerSelect(
            document.getElementById("trainerSelect"),
            "Choose trainer"
        );
    } catch (err) {
        showToast(
            err.message || "Unable to load trainers",
            "danger"
        );
    }
}

function populateTrainerSelect(select, firstText) {
    select.innerHTML = "";
    const firstOption =
        document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = firstText;
    select.appendChild(firstOption);
    trainers.forEach(trainer => {
        const option =
            document.createElement("option");
            option.value = trainer.trainerProfileId;
            option.textContent = trainer.trainerName;
        select.appendChild(option);
    });

}

async function loadWorkoutPlans() {
    showLoading(true);
    try {
        const active =
            document.getElementById("activeToggle").checked;
        const userId =
            document.getElementById("filterUserId").value;
        let plans;
        if (active) {
            plans = await api("/workoutplan/getActive");
        }
        else if (userId) {
            const encodedUserId =
                encodeURIComponent(userId);
            plans =
                await api(
                    `/workoutplan/getByUser?userId=${encodedUserId}`
                );
        }
        else {
            plans =
                await api("/workoutplan/getAll");
        }
        workoutPlans =
            Array.isArray(plans)
                ? plans
                : [];
        if (!active && !userId) {

            workoutPlans.sort(
                (a, b) =>
                    new Date(b.startDate) -
                    new Date(a.startDate)
            );
        }
        renderWorkoutPlans();
        if (active) {
            renderTrainerWorkload(workoutPlans);
        } else {
            clearTrainerWorkload();
        }
    } catch (err) {
        workoutPlans = [];
        renderWorkoutPlans();
        clearTrainerWorkload();
        showToast(
            err.message || "Unable to load workout plans",
            "danger"
        );
    } finally {
        showLoading(false);
    }
}
