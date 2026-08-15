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

function renderWorkoutPlans() {
    const container =
        document.getElementById(
            "workoutPlansContainer"
        );
    const emptyState =
        document.getElementById("emptyState");
    const resultCount =
        document.getElementById("resultCount");
    container.innerHTML = "";
    resultCount.textContent =
        workoutPlans.length;
    if (workoutPlans.length === 0) {
        emptyState.classList.remove("d-none");
        return;
    }
    emptyState.classList.add("d-none");
    workoutPlans.forEach(plan => {
        container.appendChild(
            createWorkoutCard(plan)
        );
    });
}

function createWorkoutCard(plan) {
    const col =
        document.createElement("div");
    col.className =
        "col-12 col-md-6 col-xl-4";
    const memberName =
        getMemberName(plan);
    const trainerName =
        getTrainerName(plan);
    const startDate =
        formatDate(plan.startDate);
    const endDate =
        plan.endDate
            ? formatDate(plan.endDate)
            : "Ongoing";
    const status =
        getPlanStatus(plan);
    const statusBadge =
        getStatusBadge(status);
    col.innerHTML = `
    <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0">
                    ${escapeHtml(plan.planTitle ?? "Untitled Plan")}
                </h5>
                ${statusBadge}
            </div>
            <div class="mb-3 text-muted">
                <p class="mb-1">
                    <strong>Member:</strong>
                    ${escapeHtml(memberName)}
                </p>
                <p class="mb-1">
                    <strong>Trainer:</strong>
                    ${escapeHtml(trainerName)}
                </p>
                <p class="mb-1">
                    <strong>Start:</strong>
                    ${escapeHtml(startDate)}
                </p>
                <p class="mb-0">
                    <strong>End:</strong>
                    ${escapeHtml(endDate)}
                </p>
            </div>
            <div class="border-top pt-3 mb-3">
                <div class="text-muted small">
                    Description
                </div>
                <p class="card-text mb-0">
                    ${escapeHtml(plan.planDescription ?? "No description provided.")}
                </p>
            </div>
            <div class="mt-auto">
                <div class="d-flex flex-wrap gap-2">
                    <button
                        class="btn btn-sm btn-outline-primary"
                        onclick="openEditModal(${plan.workoutPlanId})">
                        Edit
                    </button>
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        onclick="openTrainerModal(${plan.workoutPlanId})">
                        Reassign
                    </button>
                    <button
                        class="btn btn-sm btn-outline-danger"
                        onclick="openDeleteModal(${plan.workoutPlanId})">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
    return col;

}

function getMemberName(plan) {
    return ( plan.userName );
}

function getTrainerName(plan) {
    return plan.trainerProfile?.user?.userName ?? "Self-directed";
}