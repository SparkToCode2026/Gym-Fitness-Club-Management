// js/nav.js

const PAGES = [
  { label: "Dashboard", href: "/index.html", adminOnly: false },
  { label: "Branches", href: "/pages/branch.html", adminOnly: false },
  { label: "Users", href: "/pages/user.html", adminOnly: true },
  { label: "Trainers", href: "/pages/trainer.html", adminOnly: false },
  { label: "Plans", href: "/pages/plan.html", adminOnly: false },
  { label: "Memberships", href: "/pages/membership.html", adminOnly: false },
  { label: "Equipment", href: "/pages/equipment.html", adminOnly: false },
  { label: "Schedules", href: "/pages/schedule.html", adminOnly: false },
  { label: "Bookings", href: "/pages/booking.html", adminOnly: false },
  { label: "Payments", href: "/pages/payment.html", adminOnly: true },
  { label: "Attendance", href: "/pages/attendance.html", adminOnly: false },
  { label: "Metrics", href: "/pages/metric.html", adminOnly: false },
  { label: "Workouts", href: "/pages/workout.html", adminOnly: false }
];

document.addEventListener("DOMContentLoaded", () => {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) return;

  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  const isAdmin = user && user.role === "Admin";
  const currentPath = window.location.pathname;

  let navLinks = PAGES.filter(p => !p.adminOnly || isAdmin).map(p => {
    const isActive = currentPath === p.href || currentPath.endsWith(p.href) ? "active" : "";
    return `
      <li class="nav-item">
        <a class="nav-link ${isActive}" href="${p.href}">${p.label}</a>
      </li>
    `;
  }).join("");

  let userSection = user ? `
    <div class="d-flex align-items-center gap-3">
      <div class="user-chip text-end d-none d-lg-block">
        <span class="fw-semibold">${user.name}</span>
        <span class="role">${user.role}</span>
      </div>
      <button class="btn btn-outline-light btn-sm" onclick="logout()">Logout</button>
    </div>
  ` : "";

  navbarContainer.innerHTML = `
    <nav class="navbar navbar-expand-lg gym-navbar mb-4">
      <div class="container-fluid">
        <a class="navbar-brand" href="/index.html">Gym Fitness Club Manager</a>
        <button class="navbar-toggler border-0 text-white" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon" style="filter: invert(1);"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${navLinks}
          </ul>
          ${userSection}
        </div>
      </div>
    </nav>
  `;
});