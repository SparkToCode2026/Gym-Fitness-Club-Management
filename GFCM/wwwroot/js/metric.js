requireAuth();

let metrics = [];
let members = [];
let weightChart = null;

//page load 
document.addEventListener("DOMContentLoaded", async () => {

    try {

        await loadMembers();

        await loadMetrics();

        setupEvents();

    } catch (error) {

        console.error(
            "Failed to initialize Body Metrics page:",
            error
        );

    }

});


function setupEvents() {

    const saveMetricButton =
        document.getElementById("saveMetricButton");

    if (saveMetricButton) {
        saveMetricButton.addEventListener(
            "click",
            addMetric
        );
    }


    const updateMetricButton =
        document.getElementById("updateMetricButton");

    if (updateMetricButton) {
        updateMetricButton.addEventListener(
            "click",
            updateMetric
        );
    }


    const saveWeightButton =
        document.getElementById("saveWeightButton");

    if (saveWeightButton) {
        saveWeightButton.addEventListener(
            "click",
            updateWeight
        );
    }


    const addUserId =
        document.getElementById("addUserId");

    if (addUserId) {

        addUserId.addEventListener(
            "change",
            async function () {

                await loadPreviousReading(
                    this.value
                );

            }
        );

    }


    const progressUserId =
        document.getElementById("progressUserId");

    if (progressUserId) {

        progressUserId.addEventListener(
            "change",
            loadProgress
        );

    }


    const progressFrom =
        document.getElementById("progressFrom");

    if (progressFrom) {

        progressFrom.addEventListener(
            "change",
            loadProgress
        );

    }


    const progressTo =
        document.getElementById("progressTo");

    if (progressTo) {

        progressTo.addEventListener(
            "change",
            loadProgress
        );

    }


    const clearProgressFilter =
        document.getElementById(
            "clearProgressFilter"
        );

    if (clearProgressFilter) {

        clearProgressFilter.addEventListener(
            "click",
            async function () {

                document.getElementById(
                    "progressFrom"
                ).value = "";

                document.getElementById(
                    "progressTo"
                ).value = "";

                await loadProgress();

            }
        );

    }

}

async function loadMembers() {
    try {
        console.log("Loading members from /user/getAll...");

        const users = await window.apiFetch("/user/getAll");

        console.log("Users API response:", users);

        members = Array.isArray(users)
            ? users.filter(user => {
                const role = user.role;

                return (
                    role === "Member" ||
                    role === 2 ||
                    String(role).toLowerCase() === "member"
                );
            })
            : [];

        console.log("Members loaded:", members);

        populateMemberSelects();

    } catch (error) {
        console.error("Failed to load members:", error);

        members = [];
        populateMemberSelects();

        showToast(
            error.message || "Failed to load members",
            "danger"
        );
    }
}

function populateMemberSelects() {
    const addSelect =
        document.getElementById("addUserId");
    const progressSelect =
        document.getElementById("progressUserId");
    if (!addSelect || !progressSelect) {
        return;
    }
    populateMemberSelect(
        addSelect,
        "Select member"
    );
    populateMemberSelect(
        progressSelect,
        "Select member"
    );
}

function populateMemberSelect(select, firstText) {
    select.innerHTML = "";
    const firstOption =
        document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = firstText;
    select.appendChild(firstOption);
    members.forEach(member => {
        const option =
            document.createElement("option");
        option.value = member.userId;
        option.textContent = member.userName;
        select.appendChild(option);
    });
}


async function loadMetrics() {

    const spinner =
        document.getElementById(
            "metricSpinner"
        );

    const empty =
        document.getElementById(
            "metricEmpty"
        );

    const table =
        document.getElementById(
            "metricTable"
        );


    if (spinner) {
        spinner.classList.remove(
            "d-none"
        );
    }

    if (empty) {
        empty.classList.add(
            "d-none"
        );
    }

    if (table) {
        table.classList.remove(
            "d-none"
        );
    }


    try {

        console.log(
            "Loading body metrics from /bodymetric/getAll..."
        );


        const response =
            await window.apiFetch(
                "/bodymetric/getAll"
            );


        console.log(
            "Body metrics API response:",
            response
        );


        if (Array.isArray(response)) {

            metrics = response;

        } else if (
            Array.isArray(response?.metrics)
        ) {

            metrics = response.metrics;

        } else if (
            Array.isArray(response?.data)
        ) {

            metrics = response.data;

        } else {

            metrics = [];

        }


        console.log(
            "Metrics loaded:",
            metrics
        );


        renderMetrics();


    } catch (error) {

        console.error(
            "Failed to load body metrics:",
            error
        );

        metrics = [];

        renderMetrics();

        showToast(
            error.message ||
            "Failed to load body metrics",
            "danger"
        );

    } finally {

        if (spinner) {

            spinner.classList.add(
                "d-none"
            );

        }

    }

}

function renderMetrics() {

    const tbody =
        document.getElementById(
            "metricTableBody"
        );

    const empty =
        document.getElementById(
            "metricEmpty"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (!metrics.length) {

        if (empty) {

            empty.classList.remove(
                "d-none"
            );

        }

        return;

    }


    if (empty) {

        empty.classList.add(
            "d-none"
        );

    }


    metrics.forEach(metric => {

        const row =
            document.createElement("tr");


        const memberName =
            getMetricMemberName(metric);


        row.innerHTML = `

            <td>
                ${escapeHtml(memberName)}
            </td>

            <td>
                ${formatDate(metric.metricDate)}
            </td>

            <td>
                ${formatOptional(
            metric.weightKg,
            " kg"
        )}
            </td>

            <td>
                ${formatOptional(
            metric.heightCm,
            " cm"
        )}
            </td>

            <td>
                ${formatOptional(
            metric.bodyFatPercentage,
            "%"
        )}
            </td>

            <td>
                ${formatOptional(
            metric.muscleMassKg,
            " kg"
        )}
            </td>

            <td>

                <button
                    class="btn btn-sm btn-outline-primary me-1"
                    onclick="openEditMetric(${metric.bodyMetricId})">
                    Edit
                </button>

                <button
                    class="btn btn-sm btn-outline-warning me-1"
                    onclick="openWeightModal(
                        ${metric.bodyMetricId},
                        ${metric.weightKg}
                    )">
                    Weight
                </button>

                <button
                    class="btn btn-sm btn-outline-danger"
                    onclick="deleteMetric(${metric.bodyMetricId})">
                    Delete
                </button>

            </td>

        `;


        tbody.appendChild(row);

    });

}


function formatOptional(
    value,
    suffix = ""
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }


    return `${value}${suffix}`;

}


async function addMetric() {

    const userId =
        document.getElementById(
            "addUserId"
        ).value;

    const weightKg =
        document.getElementById(
            "addWeightKg"
        ).value;

    const heightCm =
        document.getElementById(
            "addHeightCm"
        ).value;

    const bodyFatValue =
        document.getElementById(
            "addBodyFatPercentage"
        ).value;

    const muscleMassValue =
        document.getElementById(
            "addMuscleMassKg"
        ).value;


    if (!userId) {

        showToast(
            "Please select a member",
            "warning"
        );

        return;

    }


    if (
        !weightKg ||
        Number(weightKg) <= 0
    ) {

        showToast(
            "Weight must be greater than zero",
            "warning"
        );

        return;

    }


    if (
        !heightCm ||
        Number(heightCm) <= 0
    ) {

        showToast(
            "Height must be greater than zero",
            "warning"
        );

        return;

    }


    if (
        bodyFatValue !== "" &&
        (
            Number(bodyFatValue) < 0 ||
            Number(bodyFatValue) > 100
        )
    ) {

        showToast(
            "Body fat must be between 0 and 100",
            "warning"
        );

        return;

    }


    const newMetric = {

        userId: Number(userId),

        weightKg: Number(weightKg),

        heightCm: Number(heightCm)

    };


    if (bodyFatValue !== "") {

        newMetric.bodyFatPercentage =
            Number(bodyFatValue);

    }


    if (muscleMassValue !== "") {

        newMetric.muscleMassKg =
            Number(muscleMassValue);

    }


    try {

        await window.apiFetch(
            "/bodymetric/add",
            {
                method: "POST",
                body: JSON.stringify(
                    newMetric
                )
            }
        );


        showToast(
            "Body metric logged",
            "success"
        );


        const modalElement =
            document.getElementById(
                "addMetricModal"
            );

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {
            modal.hide();
        }


        document
            .getElementById(
                "addMetricForm"
            )
            .reset();


        document
            .getElementById(
                "previousReading"
            )
            .classList.add(
                "d-none"
            );


        await loadMetrics();


    } catch (error) {

        console.error(
            "Failed to add metric:",
            error
        );


        showToast(
            error.message ||
            "Failed to log body metric",
            "danger"
        );

    }

}

async function loadPreviousReading(
    userId
) {

    const box =
        document.getElementById(
            "previousReading"
        );

    const text =
        document.getElementById(
            "previousReadingText"
        );


    if (!userId) {

        box.classList.add(
            "d-none"
        );

        return;

    }


    try {

        const response =
            await window.apiFetch(
                `/bodymetric/getByUser?userId=${userId}`
            );


        const userMetrics =
            Array.isArray(response)
                ? response
                : response?.metrics ?? [];


        if (!userMetrics.length) {

            text.textContent =
                "No previous measurement recorded.";

            box.classList.remove(
                "d-none"
            );

            return;

        }


        const previous =
            userMetrics[
            userMetrics.length - 1
            ];


        text.innerHTML = `

            Date:
            <strong>
                ${formatDate(
            previous.metricDate
        )}
            </strong>

            <br>

            Weight:
            <strong>
                ${formatOptional(
            previous.weightKg,
            " kg"
        )}
            </strong>

            <br>

            Height:
            <strong>
                ${formatOptional(
            previous.heightCm,
            " cm"
        )}
            </strong>

            <br>

            Body Fat:
            <strong>
                ${formatOptional(
            previous.bodyFatPercentage,
            "%"
        )}
            </strong>

            <br>

            Muscle Mass:
            <strong>
                ${formatOptional(
            previous.muscleMassKg,
            " kg"
        )}
            </strong>

        `;


        box.classList.remove(
            "d-none"
        );


    } catch (error) {

        console.error(
            "Failed to load previous reading:",
            error
        );

        box.classList.add(
            "d-none"
        );

    }

}

async function openEditMetric(
    bodyMetricId
) {

    try {

        const metric =
            await window.apiFetch(
                `/bodymetric/get?bodyMetricId=${bodyMetricId}`
            );


        document.getElementById(
            "editBodyMetricId"
        ).value =
            metric.bodyMetricId;


        document.getElementById(
            "editMemberName"
        ).value =
            getMetricMemberName(metric);


        document.getElementById(
            "editWeightKg"
        ).value =
            metric.weightKg;


        document.getElementById(
            "editHeightCm"
        ).value =
            metric.heightCm;


        document.getElementById(
            "editBodyFatPercentage"
        ).value =
            metric.bodyFatPercentage ?? "";


        document.getElementById(
            "editMuscleMassKg"
        ).value =
            metric.muscleMassKg ?? "";


        const modal =
            new bootstrap.Modal(
                document.getElementById(
                    "editMetricModal"
                )
            );


        modal.show();


    } catch (error) {

        console.error(
            "Failed to open metric:",
            error
        );


        showToast(
            error.message ||
            "Failed to load measurement",
            "danger"
        );

    }

}

async function updateMetric() {

    const bodyMetricId =
        document.getElementById(
            "editBodyMetricId"
        ).value;


    const weightKg =
        document.getElementById(
            "editWeightKg"
        ).value;


    const heightCm =
        document.getElementById(
            "editHeightCm"
        ).value;


    const bodyFatValue =
        document.getElementById(
            "editBodyFatPercentage"
        ).value;


    const muscleMassValue =
        document.getElementById(
            "editMuscleMassKg"
        ).value;


    if (
        !weightKg ||
        Number(weightKg) <= 0
    ) {

        showToast(
            "Weight must be greater than zero",
            "warning"
        );

        return;

    }


    if (
        !heightCm ||
        Number(heightCm) <= 0
    ) {

        showToast(
            "Height must be greater than zero",
            "warning"
        );

        return;

    }


    if (
        bodyFatValue !== "" &&
        (
            Number(bodyFatValue) < 0 ||
            Number(bodyFatValue) > 100
        )
    ) {

        showToast(
            "Body fat must be between 0 and 100",
            "warning"
        );

        return;

    }


    const updated = {

        weightKg: Number(weightKg),

        heightCm: Number(heightCm),

        bodyFatPercentage:
            bodyFatValue !== ""
                ? Number(bodyFatValue)
                : null,

        muscleMassKg:
            muscleMassValue !== ""
                ? Number(muscleMassValue)
                : null

    };


    try {

        await window.apiFetch(
            `/bodymetric/update?bodyMetricId=${bodyMetricId}`,
            {
                method: "PUT",
                body: JSON.stringify(
                    updated
                )
            }
        );


        showToast(
            "Body metric updated",
            "success"
        );


        const modalElement =
            document.getElementById(
                "editMetricModal"
            );

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {
            modal.hide();
        }


        await loadMetrics();


        if (
            document.getElementById(
                "progressUserId"
            ).value
        ) {

            await loadProgress();

        }


    } catch (error) {

        console.error(
            "Failed to update metric:",
            error
        );


        showToast(
            error.message ||
            "Failed to update body metric",
            "danger"
        );

    }

}

function openWeightModal(
    bodyMetricId,
    currentWeight
) {

    document.getElementById(
        "weightBodyMetricId"
    ).value =
        bodyMetricId;


    document.getElementById(
        "newWeightKg"
    ).value =
        currentWeight;


    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "weightModal"
            )
        );


    modal.show();

}

async function updateWeight() {

    const bodyMetricId =
        document.getElementById(
            "weightBodyMetricId"
        ).value;


    const newWeightKg =
        document.getElementById(
            "newWeightKg"
        ).value;


    if (
        !newWeightKg ||
        Number(newWeightKg) <= 0
    ) {

        showToast(
            "Weight must be greater than zero",
            "warning"
        );

        return;

    }


    try {

        const response =
            await window.apiFetch(
                `/bodymetric/updateWeight?bodyMetricId=${bodyMetricId}&newWeightKg=${Number(newWeightKg)}`,
                {
                    method: "PATCH"
                }
            );


        showToast(
            `Weight updated: ${response.oldWeight} kg → ${response.newWeight} kg`,
            "success"
        );


        const modalElement =
            document.getElementById(
                "weightModal"
            );

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {
            modal.hide();
        }


        await loadMetrics();


    } catch (error) {

        console.error(
            "Failed to update weight:",
            error
        );


        showToast(
            error.message ||
            "Failed to update weight",
            "danger"
        );

    }

}
async function deleteMetric(
    bodyMetricId
) {

    const confirmed =
        confirm(
            "This will permanently delete this measurement. Are you sure?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await window.apiFetch(
            `/bodymetric/remove?bodyMetricId=${bodyMetricId}`,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Body metric deleted",
            "success"
        );


        await loadMetrics();


    } catch (error) {

        console.error(
            "Failed to delete metric:",
            error
        );


        showToast(
            error.message ||
            "Failed to delete body metric",
            "danger"
        );

    }

}

async function loadProgress() {

    const userId =
        document.getElementById(
            "progressUserId"
        ).value;


    if (!userId) {

        hideProgressSections();

        return;

    }


    const from =
        document.getElementById(
            "progressFrom"
        ).value;


    const to =
        document.getElementById(
            "progressTo"
        ).value;


    try {

        let url =
            `/bodymetric/getByUser?userId=${userId}`;


        if (from) {

            url +=
                `&from=${encodeURIComponent(from)}`;

        }


        if (to) {

            url +=
                `&to=${encodeURIComponent(
                    `${to}T23:59:59`
                )}`;

        }


        const response =
            await window.apiFetch(url);


        const history =
            Array.isArray(response)
                ? response
                : response?.metrics ?? [];


        renderHistory(history);

        renderChart(history);

        await loadSummary(userId);

        showProgressSections();


    } catch (error) {

        console.error(
            "Failed to load progress:",
            error
        );


        hideProgressSections();


        showToast(
            error.message ||
            "Failed to load progress",
            "danger"
        );

    }

}

async function loadSummary(
    userId
) {

    try {

        const summary =
            await window.apiFetch(
                `/bodymetric/getSummary?userId=${userId}`
            );


        document.getElementById(
            "summaryEntries"
        ).textContent =
            summary.entries;


        document.getElementById(
            "summaryAverageWeight"
        ).textContent =
            `${summary.averageWeight} kg`;


        document.getElementById(
            "summaryLightest"
        ).textContent =
            `${summary.lightestKg} kg`;


        document.getElementById(
            "summaryHeaviest"
        ).textContent =
            `${summary.heaviestKg} kg`;


    } catch (error) {

        if (
            error.status === 404 ||
            error.message?.includes(
                "No measurements found"
            )
        ) {

            clearSummary();

            return;

        }


        console.error(
            "Failed to load summary:",
            error
        );

    }

}

function renderHistory(history) {

    const tbody =
        document.getElementById(
            "historyTableBody"
        );


    tbody.innerHTML = "";


    if (!history.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5"
                    class="text-center text-muted">

                    No measurements have been recorded yet.

                </td>

            </tr>

        `;


        calculateNetChange([]);

        return;

    }


    history.forEach(metric => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${formatDate(
            metric.metricDate
        )}
            </td>

            <td>
                ${formatOptional(
            metric.weightKg,
            " kg"
        )}
            </td>

            <td>
                ${formatOptional(
            metric.heightCm,
            " cm"
        )}
            </td>

            <td>
                ${formatOptional(
            metric.bodyFatPercentage,
            "%"
        )}
            </td>

            <td>
                ${formatOptional(
            metric.muscleMassKg,
            " kg"
        )}
            </td>

        `;


        tbody.appendChild(row);

    });


    calculateNetChange(history);

}
function calculateNetChange(
    history
) {

    const element =
        document.getElementById(
            "netWeightChange"
        );


    if (!history || history.length < 2) {

        element.textContent = "-";

        return;

    }


    const first =
        Number(
            history[0].weightKg
        );


    const last =
        Number(
            history[
                history.length - 1
            ].weightKg
        );


    const change =
        last - first;


    const sign =
        change > 0
            ? "+"
            : "";


    element.textContent =
        `${sign}${change.toFixed(1)} kg`;


    element.classList.remove(
        "text-success",
        "text-danger"
    );


    if (change > 0) {

        element.classList.add(
            "text-danger"
        );

    } else if (change < 0) {

        element.classList.add(
            "text-success"
        );

    }

}

function renderChart(history) {

    const canvas =
        document.getElementById(
            "weightChart"
        );


    if (!canvas) {
        return;
    }


    if (weightChart) {

        weightChart.destroy();

        weightChart = null;

    }


    if (!history.length) {
        return;
    }


    const labels =
        history.map(
            metric =>
                formatDate(
                    metric.metricDate
                )
        );


    const weights =
        history.map(
            metric =>
                Number(
                    metric.weightKg
                )
        );


    weightChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Weight (kg)",

                            data:
                                weights,

                            tension:
                                0.3,

                            fill:
                                false

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                false

                        }

                    }

                }

            }
        );

}
function showProgressSections() {

    document
        .getElementById(
            "summarySection"
        )
        .classList.remove(
            "d-none"
        );


    document
        .getElementById(
            "chartSection"
        )
        .classList.remove(
            "d-none"
        );


    document
        .getElementById(
            "historySection"
        )
        .classList.remove(
            "d-none"
        );

}

function hideProgressSections() {

    document
        .getElementById(
            "summarySection"
        )
        .classList.add(
            "d-none"
        );


    document
        .getElementById(
            "chartSection"
        )
        .classList.add(
            "d-none"
        );


    document
        .getElementById(
            "historySection"
        )
        .classList.add(
            "d-none"
        );


    if (weightChart) {

        weightChart.destroy();

        weightChart = null;

    }

}

function clearSummary() {

    document.getElementById(
        "summaryEntries"
    ).textContent = "-";


    document.getElementById(
        "summaryAverageWeight"
    ).textContent = "-";


    document.getElementById(
        "summaryLightest"
    ).textContent = "-";


    document.getElementById(
        "summaryHeaviest"
    ).textContent = "-";


    document.getElementById(
        "netWeightChange"
    ).textContent = "-";

}

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString();

}

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}







