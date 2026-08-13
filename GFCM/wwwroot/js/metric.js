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

