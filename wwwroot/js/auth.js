function requireAuth() {
  if (!getToken()) {
    location.href = "/login.html";
  }
}

function logout() {
  clearToken();
  localStorage.removeItem("currentUser");
  location.href = "/login.html";
}

function getCurrentUser() {
  const userStr = localStorage.getItem("currentUser");
  return userStr ? JSON.parse(userStr) : null;
}

function requireAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== "Admin") {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
}

// ----------------------------------------------------
// Login Page Logic (login.html)
// ----------------------------------------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  // If already logged in, redirect to dashboard immediately
  if (getToken()) location.href = "/index.html";

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btnSubmit = document.getElementById("btnLoginSubmit");
    const alertBox = document.getElementById("loginAlert");

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...`;
    
    if (alertBox) alertBox.classList.add("d-none");

    try {
      const res = await api("/auth/login", "POST", { email, password });
      setToken(res.token);
      localStorage.setItem("currentUser", JSON.stringify({ name: res.userName, role: res.role }));
      location.href = "/index.html";
    } catch (err) {
      if (alertBox) {
        alertBox.textContent = err.message;
        alertBox.classList.remove("d-none");
      } else {
        showToast(err.message, "danger"); // Fallback if alert box isn't in HTML
      }
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = "Login";
    }
  });
}

// ----------------------------------------------------
// Registration Page Logic (register.html)
// ----------------------------------------------------
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const userName = document.getElementById("userName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("role").value;
    
    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email format.", "warning");
      return;
    }
    
    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "warning");
      return;
    }

    const btnSubmit = document.getElementById("btnRegisterSubmit");
    btnSubmit.disabled = true;

    try {
      await api("/user/add", "POST", { userName, email, password, role });
      showToast("Registration successful. Redirecting to login...", "success");
      setTimeout(() => location.href = "/login.html", 1500);
    } catch (err) {
      showToast(err.message, "danger");
      btnSubmit.disabled = false;
    }
  });
}