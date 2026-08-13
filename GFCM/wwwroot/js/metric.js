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

