requireAuth();

let editModal, deleteModal, addModal;
let planToDeleteId = null;

document.addEventListener("DOMContentLoaded", () => {
  editModal = new bootstrap.Modal(document.getElementById("editPlanModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deletePlanModal"));
  addModal = new bootstrap.Modal(document.getElementById("addPlanModal"));

  loadPlans();
  loadPopularPlans();

  document
    .getElementById("activeOnlyToggle")
    .addEventListener("change", loadPlans);
  document
    .getElementById("applyPriceFilterBtn")
    .addEventListener("click", applyPriceFilter);
  document
    .getElementById("submitAddPlanBtn")
    .addEventListener("click", submitAddPlan);
  document
    .getElementById("submitEditPlanBtn")
    .addEventListener("click", submitEditPlan);
  document
    .getElementById("confirmDeletePlanBtn")
    .addEventListener("click", confirmDeletePlan);
});

// formatMoney removed — already exists in ui.js

// Case 01 — List
async function loadPlans() {
  const spinner = document.getElementById("loadingSpinner");
  const emptyState = document.getElementById("emptyState");
  const container = document.getElementById("planCards");

  spinner.classList.remove("d-none");
  emptyState.classList.add("d-none");
  container.innerHTML = "";

  try {
    const activeOnly = document.getElementById("activeOnlyToggle").checked;
    const url = activeOnly
      ? "/membershipplan/getAll?activeOnly=true"
      : "/membershipplan/getAll";
    const result = await api(url);
    const plans = result.plans;

    spinner.classList.add("d-none");

    if (!plans || plans.length === 0) {
      emptyState.classList.remove("d-none");
      return;
    }

    renderPlanCards(plans);
  } catch (err) {
    spinner.classList.add("d-none");
    showToast(err.message, "danger");
  }
}

function renderPlanCards(plans) {
  const container = document.getElementById("planCards");
  container.innerHTML = plans
    .map(
      (p) => `
    <div class="col-md-4">
      <div class="card h-100 ${p.isActive ? "" : "border-secondary"}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="card-title">${p.planName}</h5>
            <span class="badge ${p.isActive ? "bg-success" : "bg-secondary"}">
              ${p.isActive ? "Active" : "Retired"}
            </span>
          </div>
          <p class="card-text">${p.planDescription ?? ""}</p>
          <p class="mb-1"><strong>Duration:</strong> ${p.durationInDays} days</p>
          <p class="mb-1"><strong>Price:</strong> $${formatMoney(p.planPrice)}</p>
          <p class="mb-1"><strong>Max Classes/Month:</strong> ${p.maxClassesPerMonth}</p>
          <p class="mb-2"><strong>Subscribers:</strong> ${p.subscriberCount ?? 0}</p>

          <div class="form-check form-switch mb-2">
            <input class="form-check-input status-toggle" type="checkbox"
                   data-id="${p.membershipPlanId}" ${p.isActive ? "checked" : ""}>
            <label class="form-check-label">Active</label>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${p.membershipPlanId}"
                    data-description="${p.planDescription ?? ""}" data-price="${p.planPrice}">Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${p.membershipPlanId}">Retire</button>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  attachCardEvents();
}

function attachCardEvents() {
  document.querySelectorAll(".status-toggle").forEach((el) => {
    el.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const isActive = e.target.checked;
      try {
        await api(
          `/membershipplan/updateStatus?membershipPlanId=${id}&isActive=${isActive}`,
          "PATCH",
        );
        showToast("Plan status updated", "success");
        loadPlans();
      } catch (err) {
        showToast(err.message, "danger");
      }
    });
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.getElementById("editPlanId").value = e.target.dataset.id;
      document.getElementById("editPlanDescription").value =
        e.target.dataset.description;
      document.getElementById("editPlanPrice").value = e.target.dataset.price;
      editModal.show();
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      planToDeleteId = e.target.dataset.id;
      document.getElementById("deletePlanId").value = planToDeleteId;
      deleteModal.show();
    });
  });
}

// Case 02 — Add
async function submitAddPlan() {
  const errorBox = document.getElementById("addPlanError");
  errorBox.classList.add("d-none");

  const body = {
    planName: document.getElementById("addPlanName").value.trim(),
    planDescription: document.getElementById("addPlanDescription").value.trim(),
    durationInDays: Number(document.getElementById("addPlanDuration").value),
    planPrice: Number(document.getElementById("addPlanPrice").value),
    maxClassesPerMonth: Number(
      document.getElementById("addPlanMaxClasses").value,
    ),
  };

  try {
    await api("/membershipplan/add", "POST", body);
    addModal.hide();
    showToast("Plan added", "success");
    loadPlans();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

// Case 03 — Edit
async function submitEditPlan() {
  const id = document.getElementById("editPlanId").value;
  const body = {
    planDescription: document
      .getElementById("editPlanDescription")
      .value.trim(),
    planPrice: Number(document.getElementById("editPlanPrice").value),
  };

  try {
    await api(`/membershipplan/update?membershipPlanId=${id}`, "PUT", body);
    editModal.hide();
    showToast("Plan updated", "success");
    loadPlans();
  } catch (err) {
    showToast(err.message, "danger");
  }
}

// Case 05 — Delete (Retire)
async function confirmDeletePlan() {
  try {
    await api(
      `/membershipplan/remove?membershipPlanId=${planToDeleteId}`,
      "DELETE",
    );
    deleteModal.hide();
    showToast("Plan retired", "success");
    loadPlans();
  } catch (err) {
    showToast(err.message, "danger");
  }
}

// Case 06 — Price filter (shown as a plain list, since getByPrice returns fewer fields)
async function applyPriceFilter() {
  const maxPrice = document.getElementById("maxPriceFilter").value;
  if (!maxPrice) return loadPlans();

  try {
    const result = await api(
      `/membershipplan/getByPrice?maxPrice=${encodeURIComponent(maxPrice)}`,
    );
    const plans = result.plans;
    renderFilteredList(plans);
    document.getElementById("resultCount").textContent =
      `${plans.length} result(s)`;
  } catch (err) {
    showToast(err.message, "danger");
  }
}

function renderFilteredList(plans) {
  const container = document.getElementById("planCards");
  if (!plans || plans.length === 0) {
    container.innerHTML = `<p class="text-muted">No plans found under that price.</p>`;
    return;
  }
  container.innerHTML = `
    <div class="col-12">
      <ul class="list-group">
        ${plans
          .map(
            (p) => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <span>${p.planName} — ${p.durationInDays} days</span>
            <span class="badge bg-primary rounded-pill">$${formatMoney(p.planPrice)}</span>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `;
}

// Case 06 — Popular plans
async function loadPopularPlans() {
  const container = document.getElementById("popularList");
  try {
    const result = await api("/membershipplan/getPopular");
    const popular = result.plans;

    if (!popular || popular.length === 0) {
      container.innerHTML = `<span class="text-muted">No data yet.</span>`;
      return;
    }
    container.innerHTML = `
      <ol class="mb-0">
        ${popular.map((p) => `<li>${p.planName} — ${p.subscribers ?? 0} subscribers</li>`).join("")}
      </ol>
    `;
  } catch (err) {
    container.innerHTML = `<span class="text-danger">${err.message}</span>`;
  }
}
