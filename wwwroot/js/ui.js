// js/ui.js

function showToast(message, type = "success") {
  let host = document.getElementById("toastHost");
  if (!host) {
    host = document.createElement("aside");
    host.id = "toastHost";
    document.body.appendChild(host);
  }

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-white bg-${type === 'danger' ? 'danger' : 'dark'} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  host.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
  
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function confirmDialog(message) {
  return new Promise((resolve) => {
    const existing = document.getElementById("confirmModal");
    if (existing) existing.remove();

    const modalHtml = `
      <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body text-center mt-3">
              <p>${message}</p>
            </div>
            <div class="modal-footer justify-content-center">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal" id="btnConfirmCancel">Cancel</button>
              <button type="button" class="btn btn-danger btn-sm" id="btnConfirmOk">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modalEl = document.getElementById("confirmModal");
    const modal = new bootstrap.Modal(modalEl);
    
    document.getElementById("btnConfirmOk").addEventListener("click", () => {
      modal.hide();
      resolve(true);
    });
    
    document.getElementById("btnConfirmCancel").addEventListener("click", () => {
      modal.hide();
      resolve(false);
    });
    
    modalEl.addEventListener("hidden.bs.modal", () => {
      if (document.body.contains(modalEl)) resolve(false);
      modalEl.remove();
    });

    modal.show();
  });
}

function showSpinner(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<div class="loading-cell"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
  }
}

function hideSpinner(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

function emptyRow(colspan, message = "No records found.") {
  return `<tr><td colspan="${colspan}" class="empty-state"><div class="empty-title">Nothing here</div><div class="empty-hint">${message}</div></td></tr>`;
}

function statusBadge(value) {
  if (!value) return "";
  const v = String(value).toLowerCase();
  let badgeClass = "badge-closed";

  if (["active", "booked", "completed", "operational", "attended", "true"].includes(v)) badgeClass = "badge-live";
  if (["pending", "undermaintenance"].includes(v)) badgeClass = "badge-hold";
  if (["cancelled", "failed", "expired", "retired", "refunded", "false"].includes(v)) badgeClass = "badge-closed";
  if (["blocked", "error"].includes(v)) badgeClass = "badge-stop";

  return `<span class="badge-status ${badgeClass}">${value}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function formatMoney(n) {
  if (n === null || n === undefined) return "—";
  return "$" + parseFloat(n).toFixed(2);
}