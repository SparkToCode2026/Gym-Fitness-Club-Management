let metrics = [];
let members = [];
let weightChart = null;

// api fetch
if (typeof window.apiFetch !== "function") {

    window.apiFetch = async function (url, options = {}) {

        const requestOptions = {
            ...options,
            headers: {
                ...(options.headers || {})
            }
        };
        if (options.body && !requestOptions.headers["Content-Type"]) {
            requestOptions.headers["Content-Type"] = "application/json";
        }
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwtToken");

        if (token && !requestOptions.headers["Authorization"]) {
            requestOptions.headers["Authorization"] =
                `Bearer ${token}`;
        }

        const response = await fetch(url, requestOptions);

        let data = null;

        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();

            if (text) {
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }
            }
        }

        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                data?.title ||
                `Request failed with status ${response.status}`;

            const error = new Error(message);

            error.status = response.status;
            error.response = data;

            throw error;
        }

        return data;
    };
}

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

        console.log(
            "Loading members from /user/getAll..."
        );


        const response =
            await window.apiFetch(
                "/user/getAll"
            );


        console.log(
            "Members API response:",
            response
        );


        // Support multiple possible API response shapes
        if (Array.isArray(response)) {

            members = response;

        } else if (Array.isArray(response?.users)) {

            members = response.users;

        } else if (Array.isArray(response?.data)) {

            members = response.data;

        } else if (Array.isArray(response?.members)) {

            members = response.members;

        } else {

            members = [];

        }


        console.log(
            "Members loaded:",
            members
        );


        populateMemberSelects();


    } catch (error) {

        console.error(
            "Failed to load members:",
            error
        );

        members = [];

        populateMemberSelects();

        showToast(
            error.message ||
            "Failed to load members",
            "danger"
        );

    }

}

function populateMemberSelects() {

    const addSelect =
        document.getElementById("addUserId");

    const progressSelect =
        document.getElementById(
            "progressUserId"
        );


    if (!addSelect || !progressSelect) {
        return;
    }


    addSelect.innerHTML =
        `<option value="">Select member</option>`;

    progressSelect.innerHTML =
        `<option value="">Select member</option>`;


    members.forEach(member => {

        const userId =
            getUserId(member);

        const name =
            getMemberName(member);


        if (
            userId === null ||
            userId === undefined ||
            userId === ""
        ) {
            return;
        }


        const option1 =
            document.createElement("option");

        option1.value =
            userId;

        option1.textContent =
            name;

        addSelect.appendChild(option1);


        const option2 =
            document.createElement("option");

        option2.value =
            userId;

        option2.textContent =
            name;

        progressSelect.appendChild(option2);

    });


    console.log(
        `Populated ${members.length} member records.`
    );

}

function getUserId(member) {

    if (!member) {
        return null;
    }


    if (typeof member === "number") {
        return member;
    }


    return (
        member.userId ??
        member.id ??
        member.memberId ??
        member.user?.userId ??
        member.user?.id ??
        null
    );

}

function getMemberName(member) {

    if (!member) {
        return "-";
    }


    if (typeof member === "string") {
        return member;
    }


    return (
        member.userName ??
        member.username ??
        member.name ??
        member.fullName ??
        member.memberName ??
        member.user?.userName ??
        member.user?.username ??
        member.user?.name ??
        member.user?.fullName ??
        "-"
    );

}

function findMemberByUserId(userId) {

    if (
        userId === null ||
        userId === undefined
    ) {
        return null;
    }


    return members.find(member => {

        const memberId =
            getUserId(member);

        return String(memberId) ===
            String(userId);

    }) || null;

}
function getMetricMemberName(metric) {

    if (!metric) {
        return "-";
    }

    if (metric.memberName) {
        return metric.memberName;
    }

    if (metric.user) {

        const name =
            getMemberName(metric.user);

        if (name !== "-") {
            return name;
        }

    }

    if (metric.member) {

        const name =
            getMemberName(metric.member);

        if (name !== "-") {
            return name;
        }

    }


    const member =
        findMemberByUserId(
            metric.userId
        );


    if (member) {

        return getMemberName(member);

    }


    return "-";

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



