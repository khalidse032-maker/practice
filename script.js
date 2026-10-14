// Elements
const dbStatus = document.getElementById("dbStatus");
const recordForm = document.getElementById("recordForm");
const recordsTbody = document.getElementById("recordsTbody");
const recordCount = document.getElementById("recordCount");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

// Modal Elements
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editId = document.getElementById("editId");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editDepartment = document.getElementById("editDepartment");
const editDetails = document.getElementById("editDetails");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Toast
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message, type = "success") {
  clearTimeout(toastTimer);
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.classList.remove("hidden");

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// Local State
let records = [];

// 1. Check DB Connection Status
async function checkStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();

    if (data.connected) {
      dbStatus.className = "status-badge online";
      dbStatus.innerHTML = '<span class="status-dot"></span> MongoDB Online';
    } else {
      dbStatus.className = "status-badge offline";
      dbStatus.innerHTML = '<span class="status-dot"></span> MongoDB Offline';
    }
  } catch (err) {
    dbStatus.className = "status-badge offline";
    dbStatus.innerHTML = '<span class="status-dot"></span> Server Offline';
  }
}

// 2. Fetch All Records (READ)
async function fetchRecords() {
  try {
    const res = await fetch("/api/records");
    if (!res.ok) throw new Error("Failed to load records");
    records = await res.json();
    renderRecords(records);
  } catch (err) {
    recordsTbody.innerHTML = `<tr><td colspan="4" class="empty-state">Error loading records: ${err.message}</td></tr>`;
  }
}

// Render Records to Table
function renderRecords(data) {
  recordCount.textContent = data.length;

  if (data.length === 0) {
    recordsTbody.innerHTML = `<tr><td colspan="4" class="empty-state">No records found in database. Add one on the left!</td></tr>`;
    return;
  }

  recordsTbody.innerHTML = data
    .map(
      (item) => `
    <tr>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${escapeHtml(item.email)}</td>
      <td>${escapeHtml(item.department || "-")}</td>
      <td>
        <button class="action-btn action-edit" onclick="openEditModal('${item._id}')">Edit</button>
        <button class="action-btn action-delete" onclick="deleteRecord('${item._id}')">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// 3. Create Record (CREATE)
recordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const department = document.getElementById("department").value.trim();
  const details = document.getElementById("details").value.trim();

  try {
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, department, details }),
    });

    if (!res.ok) throw new Error("Could not create record");

    recordForm.reset();
    showToast("Record successfully saved to MongoDB!");
    fetchRecords();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// 4. Update Record (UPDATE)
function openEditModal(id) {
  const item = records.find((r) => r._id === id);
  if (!item) return;

  editId.value = item._id;
  editName.value = item.name;
  editEmail.value = item.email;
  editDepartment.value = item.department || "";
  editDetails.value = item.details || "";

  editModal.classList.remove("hidden");
}

function closeEditModal() {
  editModal.classList.add("hidden");
  editForm.reset();
}

closeModalBtn.addEventListener("click", closeEditModal);
cancelEditBtn.addEventListener("click", closeEditModal);

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = editId.value;
  const name = editName.value.trim();
  const email = editEmail.value.trim();
  const department = editDepartment.value.trim();
  const details = editDetails.value.trim();

  try {
    const res = await fetch(`/api/records/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, department, details }),
    });

    if (!res.ok) throw new Error("Could not update record");

    closeEditModal();
    showToast("Record updated successfully!");
    fetchRecords();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// 5. Delete Record (DELETE)
async function deleteRecord(id) {
  if (!confirm("Are you sure you want to delete this document from MongoDB?")) return;

  try {
    const res = await fetch(`/api/records/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete record");

    showToast("Record deleted from MongoDB!");
    fetchRecords();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Search Filter
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = records.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      (item.department && item.department.toLowerCase().includes(query))
  );
  renderRecords(filtered);
});

// Refresh Button
refreshBtn.addEventListener("click", () => {
  fetchRecords();
  checkStatus();
  showToast("Refreshed!");
});

// Utility: Prevent XSS
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  checkStatus();
  fetchRecords();
});
