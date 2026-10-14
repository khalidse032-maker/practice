// ============================================
// CONFIGURATION & SECRET URL
// ============================================
const SECRET_URL =
  "mongodb+srv://khalidmkhalidcompk_db_user:khalid@cluster0.yihuv71.mongodb.net/university?appName=Cluster0";

const STORAGE_KEY = "university_records";

// Default Sample Data (used when local storage is empty)
const DEFAULT_RECORDS = [
  {
    _id: "doc_101",
    name: "Muhammad Khalid",
    email: "khalid@university.edu",
    department: "Software Engineering",
    details: "Lead Developer",
  },
  {
    _id: "doc_102",
    name: "Ayesha Ahmed",
    email: "ayesha@university.edu",
    department: "Computer Science",
    details: "AI & Data Science Track",
  },
  {
    _id: "doc_103",
    name: "Zain Ali",
    email: "zain@university.edu",
    department: "Cyber Security",
    details: "Semester 5",
  },
];

// ============================================
// DOM ELEMENTS
// ============================================
const recordForm = document.getElementById("recordForm");
const recordsTbody = document.getElementById("recordsTbody");
const recordCount = document.getElementById("recordCount");
const searchInput = document.getElementById("searchInput");
const secretUrlInput = document.getElementById("secretUrlInput");
const copyUrlBtn = document.getElementById("copyUrlBtn");
const exportBtn = document.getElementById("exportBtn");
const resetBtn = document.getElementById("resetBtn");

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

// Toast Notification
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

// ============================================
// STORAGE HELPERS (Local Persistence)
// ============================================
function getStoredRecords() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECORDS));
    return DEFAULT_RECORDS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_RECORDS;
  }
}

function saveStoredRecords(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let records = getStoredRecords();

// ============================================
// RENDER RECORDS (READ)
// ============================================
function renderRecords(dataToRender = records) {
  recordCount.textContent = dataToRender.length;

  if (dataToRender.length === 0) {
    recordsTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No records found. Fill the form on the left to add one!</td>
      </tr>
    `;
    return;
  }

  recordsTbody.innerHTML = dataToRender
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

// ============================================
// ADD RECORD (CREATE)
// ============================================
recordForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const department = document.getElementById("department").value.trim();
  const details = document.getElementById("details").value.trim();

  const newRecord = {
    _id: "doc_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    name,
    email,
    department,
    details,
    createdAt: new Date().toISOString(),
  };

  records.unshift(newRecord);
  saveStoredRecords(records);
  renderRecords(records);
  recordForm.reset();
  showToast("Record successfully created!");
});

// ============================================
// EDIT RECORD (UPDATE)
// ============================================
window.openEditModal = function (id) {
  const item = records.find((r) => r._id === id);
  if (!item) return;

  editId.value = item._id;
  editName.value = item.name;
  editEmail.value = item.email;
  editDepartment.value = item.department || "";
  editDetails.value = item.details || "";

  editModal.classList.remove("hidden");
};

function closeEditModal() {
  editModal.classList.add("hidden");
  editForm.reset();
}

closeModalBtn.addEventListener("click", closeEditModal);
cancelEditBtn.addEventListener("click", closeEditModal);

editForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = editId.value;
  const index = records.findIndex((r) => r._id === id);
  if (index === -1) return;

  records[index].name = editName.value.trim();
  records[index].email = editEmail.value.trim();
  records[index].department = editDepartment.value.trim();
  records[index].details = editDetails.value.trim();
  records[index].updatedAt = new Date().toISOString();

  saveStoredRecords(records);
  renderRecords(records);
  closeEditModal();
  showToast("Record updated successfully!");
});

// ============================================
// DELETE RECORD (DELETE)
// ============================================
window.deleteRecord = function (id) {
  if (!confirm("Are you sure you want to delete this record?")) return;

  records = records.filter((r) => r._id !== id);
  saveStoredRecords(records);
  renderRecords(records);
  showToast("Record deleted!");
};

// ============================================
// SEARCH & FILTER
// ============================================
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

// ============================================
// COPY SECRET URL
// ============================================
copyUrlBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(SECRET_URL).then(() => {
    showToast("Secret URL copied to clipboard!");
  }).catch(() => {
    secretUrlInput.select();
    document.execCommand("copy");
    showToast("Secret URL copied!");
  });
});

// ============================================
// EXPORT & RESET ACTIONS
// ============================================
exportBtn.addEventListener("click", () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "university_records.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Exported JSON successfully!");
});

resetBtn.addEventListener("click", () => {
  if (confirm("Reset to default sample records?")) {
    records = [...DEFAULT_RECORDS];
    saveStoredRecords(records);
    renderRecords(records);
    showToast("Reset to sample records!");
  }
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

// Initial Render
document.addEventListener("DOMContentLoaded", () => {
  renderRecords(records);
});
