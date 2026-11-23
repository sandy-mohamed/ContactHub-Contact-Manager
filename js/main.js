"use strict";

const STORAGE_KEY = "contacthub_contacts";

// DOM Elements
const totalCountEl = document.getElementById("totalCount");
const favoritesCountEl = document.getElementById("favoritesCount");
const emergencyCountEl = document.getElementById("emergencyCount");
const contactsSubtitleEl = document.getElementById("contactsSubtitle");

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const contactsGrid = document.getElementById("contactsGrid");
const emptyState = document.getElementById("emptyState");
const emptyStateTitle = document.getElementById("emptyStateTitle");
const emptyStateText = document.getElementById("emptyStateText");

const favoritesListEl = document.getElementById("favoritesList");
const emergencyListEl = document.getElementById("emergencyList");

// Modal Elements
const openAddModalBtn = document.getElementById("openAddModalBtn");
const contactModalOverlay = document.getElementById("contactModalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const modalTitleEl = document.getElementById("modalTitle");
const saveBtnTextEl = document.getElementById("saveBtnText");

const contactForm = document.getElementById("contactForm");
const avatarInput = document.getElementById("avatarInput");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const modalAvatarPreview = document.getElementById("modalAvatarPreview");

const fullNameInput = document.getElementById("fullNameInput");
const phoneInput = document.getElementById("phoneInput");
const emailInput = document.getElementById("emailInput");
const addressInput = document.getElementById("addressInput");
const groupInput = document.getElementById("groupInput");
const notesInput = document.getElementById("notesInput");
const favoriteCheckbox = document.getElementById("favoriteCheckbox");
const emergencyCheckbox = document.getElementById("emergencyCheckbox");

const fullNameError = document.getElementById("fullNameError");
const phoneError = document.getElementById("phoneError");
const emailError = document.getElementById("emailError");

// State
let contacts = loadContacts();
let editingContactId = null;
let currentAvatarDataUrl = "";

// LocalStorage Helpers
function loadContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load contacts from localStorage:", err);
    return [];
  }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

// Utility Helpers
function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getGroupBadgeClass(group) {
  switch (group) {
    case "Family":
      return "badge-group-family";
    case "Friends":
      return "badge-group-friends";
    case "Work":
      return "badge-group-work";
    case "School":
      return "badge-group-school";
    default:
      return "badge-group-other";
  }
}

// Validation
function clearValidation() {
  [fullNameInput, phoneInput, emailInput].forEach((input) => {
    input.classList.remove("is-invalid");
  });
  fullNameError.textContent = "";
  phoneError.textContent = "";
  emailError.textContent = "";
}

function validateForm() {
  clearValidation();
  let isValid = true;

  const name = fullNameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();

  // Full Name validation: required, at least 2 characters
  const nameRegex = /^[a-zA-Z\u0600-\u06FF\s.'-]{2,50}$/;
  if (!name) {
    fullNameInput.classList.add("is-invalid");
    fullNameError.textContent = "Full name is required.";
    isValid = false;
  } else if (!nameRegex.test(name)) {
    fullNameInput.classList.add("is-invalid");
    fullNameError.textContent = "Please enter a valid name (at least 2 letters).";
    isValid = false;
  }

  // Phone validation: Egyptian mobile/landline or international 7-15 digits
  const phoneRegex = /^(\+20|0020|0)?1[0125][0-9]{8}$|^[+]?[0-9\s\-()]{7,15}$/;
  if (!phone) {
    phoneInput.classList.add("is-invalid");
    phoneError.textContent = "Phone number is required.";
    isValid = false;
  } else if (!phoneRegex.test(phone)) {
    phoneInput.classList.add("is-invalid");
    phoneError.textContent = "Please enter a valid phone number (e.g., 01012345678).";
    isValid = false;
  } else {
    // Check duplicate phone number (excluding the contact currently being edited)
    const duplicate = contacts.find(
      (c) => c.phone.replace(/\s+/g, "") === phone.replace(/\s+/g, "") && c.id !== editingContactId
    );
    if (duplicate) {
      phoneInput.classList.add("is-invalid");
      phoneError.textContent = `This phone number already belongs to ${duplicate.name}.`;
      isValid = false;
    }
  }

  // Email validation: optional, but must be valid if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      emailInput.classList.add("is-invalid");
      emailError.textContent = "Please enter a valid email address (e.g., name@example.com).";
      isValid = false;
    }
  }

  return isValid;
}

// Modal Controls
function updateModalAvatarPreview(avatarUrl) {
  if (avatarUrl) {
    modalAvatarPreview.innerHTML = `<img src="${avatarUrl}" alt="Contact Avatar" />`;
  } else {
    modalAvatarPreview.innerHTML = `<i class="fa-solid fa-user"></i>`;
  }
}

function openAddModal() {
  editingContactId = null;
  currentAvatarDataUrl = "";
  contactForm.reset();
  clearValidation();
  updateModalAvatarPreview("");
  modalTitleEl.textContent = "Add New Contact";
  saveBtnTextEl.textContent = "Save Contact";
  contactModalOverlay.classList.remove("d-none");
  setTimeout(() => fullNameInput.focus(), 50);
}

function openEditModal(id) {
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return;

  editingContactId = id;
  currentAvatarDataUrl = contact.avatar || "";
  clearValidation();

  fullNameInput.value = contact.name;
  phoneInput.value = contact.phone;
  emailInput.value = contact.email || "";
  addressInput.value = contact.address || "";
  groupInput.value = contact.group || "";
  notesInput.value = contact.notes || "";
  favoriteCheckbox.checked = Boolean(contact.isFavorite);
  emergencyCheckbox.checked = Boolean(contact.isEmergency);

  updateModalAvatarPreview(currentAvatarDataUrl);
  modalTitleEl.textContent = "Edit Contact";
  saveBtnTextEl.textContent = "Update Contact";
  contactModalOverlay.classList.remove("d-none");
  setTimeout(() => fullNameInput.focus(), 50);
}

function closeModal() {
  contactModalOverlay.classList.add("d-none");
  contactForm.reset();
  clearValidation();
  editingContactId = null;
  currentAvatarDataUrl = "";
}

// Render Functions
function renderStats() {
  const total = contacts.length;
  const favCount = contacts.filter((c) => c.isFavorite).length;
  const emgCount = contacts.filter((c) => c.isEmergency).length;

  totalCountEl.textContent = total;
  favoritesCountEl.textContent = favCount;
  emergencyCountEl.textContent = emgCount;
  contactsSubtitleEl.textContent = `Manage and organize your ${total} ${total === 1 ? "contact" : "contacts"}`;
}

function renderSidebarLists() {
  const favorites = contacts.filter((c) => c.isFavorite);
  const emergencies = contacts.filter((c) => c.isEmergency);

  if (favorites.length === 0) {
    favoritesListEl.innerHTML = `<p class="sidebar-empty-text mb-0">No favorites yet</p>`;
  } else {
    favoritesListEl.innerHTML = favorites
      .map(
        (c) => `
      <div class="sidebar-contact-item">
        <div class="d-flex align-items-center gap-2 min-w-0">
          <div class="sidebar-mini-avatar">
            ${
              c.avatar
                ? `<img src="${c.avatar}" alt="${escapeHtml(c.name)}" />`
                : escapeHtml(getInitials(c.name))
            }
          </div>
          <div class="min-w-0">
            <div class="sidebar-contact-name text-truncate">${escapeHtml(c.name)}</div>
            <div class="sidebar-contact-phone text-truncate">${escapeHtml(c.phone)}</div>
          </div>
        </div>
        <a href="tel:${escapeHtml(c.phone)}" class="sidebar-quick-call sidebar-call-green" title="Call ${escapeHtml(c.name)}">
          <i class="fa-solid fa-phone"></i>
        </a>
      </div>
    `
      )
      .join("");
  }

  if (emergencies.length === 0) {
    emergencyListEl.innerHTML = `<p class="sidebar-empty-text mb-0">No emergency contacts</p>`;
  } else {
    emergencyListEl.innerHTML = emergencies
      .map(
        (c) => `
      <div class="sidebar-contact-item">
        <div class="d-flex align-items-center gap-2 min-w-0">
          <div class="sidebar-mini-avatar">
            ${
              c.avatar
                ? `<img src="${c.avatar}" alt="${escapeHtml(c.name)}" />`
                : escapeHtml(getInitials(c.name))
            }
          </div>
          <div class="min-w-0">
            <div class="sidebar-contact-name text-truncate">${escapeHtml(c.name)}</div>
            <div class="sidebar-contact-phone text-truncate">${escapeHtml(c.phone)}</div>
          </div>
        </div>
        <a href="tel:${escapeHtml(c.phone)}" class="sidebar-quick-call sidebar-call-red" title="Emergency Call ${escapeHtml(c.name)}">
          <i class="fa-solid fa-phone"></i>
        </a>
      </div>
    `
      )
      .join("");
  }
}

function renderContacts() {
  const query = searchInput.value.trim().toLowerCase();
  clearSearchBtn.classList.toggle("d-none", query.length === 0);

  const filtered = contacts.filter((c) => {
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  });

  if (filtered.length === 0) {
    contactsGrid.innerHTML = "";
    emptyState.classList.remove("d-none");
    if (query) {
      emptyStateTitle.textContent = "No matching contacts";
      emptyStateText.textContent = `No results found for "${searchInput.value.trim()}"`;
    } else {
      emptyStateTitle.textContent = "No contacts found";
      emptyStateText.textContent = 'Click "Add Contact" to get started';
    }
    return;
  }

  emptyState.classList.add("d-none");
  contactsGrid.innerHTML = filtered
    .map((c) => {
      const initials = escapeHtml(getInitials(c.name));
      const groupBadge = c.group
        ? `<span class="badge-group ${getGroupBadgeClass(c.group)}">${escapeHtml(c.group)}</span>`
        : "";
      const emergencyBadge = c.isEmergency
        ? `<span class="badge-emergency-pill"><i class="fa-solid fa-heart-pulse"></i> Emergency</span>`
        : "";

      return `
      <div class="col-12 col-md-6">
        <article class="contact-card">
          <div class="contact-card-body">
            <div class="d-flex align-items-start gap-3">
              <div class="contact-avatar-wrapper">
                <div class="contact-avatar">
                  ${
                    c.avatar
                      ? `<img src="${c.avatar}" alt="${escapeHtml(c.name)}" />`
                      : initials
                  }
                </div>
                ${
                  c.isFavorite
                    ? `<span class="avatar-badge avatar-badge-fav" title="Favorite"><i class="fa-solid fa-star"></i></span>`
                    : ""
                }
                ${
                  c.isEmergency
                    ? `<span class="avatar-badge avatar-badge-emg" title="Emergency"><i class="fa-solid fa-heart-pulse"></i></span>`
                    : ""
                }
              </div>

              <div class="min-w-0 flex-grow-1">
                <h3 class="contact-name text-truncate">${escapeHtml(c.name)}</h3>
                <div class="contact-badges">
                  ${groupBadge}
                  ${emergencyBadge}
                </div>
              </div>
            </div>

            <div class="contact-info-list">
              <div class="contact-info-item">
                <span class="info-icon-box info-icon-phone"><i class="fa-solid fa-phone"></i></span>
                <span>${escapeHtml(c.phone)}</span>
              </div>
              ${
                c.email
                  ? `
                <div class="contact-info-item">
                  <span class="info-icon-box info-icon-email"><i class="fa-solid fa-envelope"></i></span>
                  <span class="text-truncate">${escapeHtml(c.email)}</span>
                </div>`
                  : ""
              }
              ${
                c.address
                  ? `
                <div class="contact-info-item">
                  <span class="info-icon-box info-icon-address"><i class="fa-solid fa-location-dot"></i></span>
                  <span>${escapeHtml(c.address)}</span>
                </div>`
                  : ""
              }
            </div>

            ${
              c.notes
                ? `<div class="contact-notes">${escapeHtml(c.notes)}</div>`
                : ""
            }
          </div>

          <div class="contact-card-footer">
            <div class="d-flex align-items-center gap-2">
              <a
                href="tel:${escapeHtml(c.phone)}"
                class="card-action-btn btn-call"
                title="Call ${escapeHtml(c.name)}"
                aria-label="Call ${escapeHtml(c.name)}"
              >
                <i class="fa-solid fa-phone"></i>
              </a>
              <a
                href="${c.email ? `mailto:${escapeHtml(c.email)}` : "#"}"
                class="card-action-btn btn-email ${c.email ? "" : "disabled"}"
                title="${c.email ? `Email ${escapeHtml(c.name)}` : "No email provided"}"
                aria-label="Email ${escapeHtml(c.name)}"
              >
                <i class="fa-solid fa-envelope"></i>
              </a>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button
                type="button"
                class="card-action-btn btn-fav ${c.isFavorite ? "active" : ""}"
                data-action="toggle-fav"
                data-id="${c.id}"
                title="${c.isFavorite ? "Remove from Favorites" : "Add to Favorites"}"
                aria-label="Toggle Favorite"
              >
                <i class="fa-solid fa-star"></i>
              </button>
              <button
                type="button"
                class="card-action-btn btn-emg ${c.isEmergency ? "active" : ""}"
                data-action="toggle-emg"
                data-id="${c.id}"
                title="${c.isEmergency ? "Remove from Emergency" : "Mark as Emergency"}"
                aria-label="Toggle Emergency"
              >
                <i class="fa-solid fa-heart-pulse"></i>
              </button>
              <button
                type="button"
                class="card-action-btn btn-edit"
                data-action="edit"
                data-id="${c.id}"
                title="Edit Contact"
                aria-label="Edit Contact"
              >
                <i class="fa-solid fa-pen"></i>
              </button>
              <button
                type="button"
                class="card-action-btn btn-delete"
                data-action="delete"
                data-id="${c.id}"
                title="Delete Contact"
                aria-label="Delete Contact"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </article>
      </div>
    `;
    })
    .join("");
}

function renderAll() {
  renderStats();
  renderContacts();
  renderSidebarLists();
}

// CRUD Actions
function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const contactData = {
    id: editingContactId || Date.now().toString(),
    name: fullNameInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    address: addressInput.value.trim(),
    group: groupInput.value,
    notes: notesInput.value.trim(),
    isFavorite: favoriteCheckbox.checked,
    isEmergency: emergencyCheckbox.checked,
    avatar: currentAvatarDataUrl,
  };

  const isEditing = Boolean(editingContactId);

  if (isEditing) {
    contacts = contacts.map((c) => (c.id === editingContactId ? contactData : c));
  } else {
    contacts.unshift(contactData);
  }

  saveContacts();
  renderAll();
  closeModal();

  Swal.fire({
    icon: "success",
    title: isEditing ? "Updated!" : "Added!",
    text: isEditing
      ? "Contact has been updated successfully."
      : "Contact has been added successfully.",
    timer: 1600,
    showConfirmButton: false,
  });
}

function toggleFavorite(id) {
  contacts = contacts.map((c) =>
    c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
  );
  saveContacts();
  renderAll();
}

function toggleEmergency(id) {
  contacts = contacts.map((c) =>
    c.id === id ? { ...c, isEmergency: !c.isEmergency } : c
  );
  saveContacts();
  renderAll();
}

function deleteContact(id) {
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return;

  Swal.fire({
    title: "Delete Contact?",
    text: `Are you sure you want to delete "${contact.name}"? This action cannot be undone.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      contacts = contacts.filter((c) => c.id !== id);
      saveContacts();
      renderAll();

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Contact has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
}

// Event Listeners
openAddModalBtn.addEventListener("click", openAddModal);
closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);

contactModalOverlay.addEventListener("click", (e) => {
  if (e.target === contactModalOverlay) {
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !contactModalOverlay.classList.contains("d-none")) {
    closeModal();
  }
});

changePhotoBtn.addEventListener("click", () => avatarInput.click());

avatarInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    currentAvatarDataUrl = event.target.result;
    updateModalAvatarPreview(currentAvatarDataUrl);
  };
  reader.readAsDataURL(file);
});

[fullNameInput, phoneInput, emailInput].forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("is-invalid");
  });
});

contactForm.addEventListener("submit", handleFormSubmit);

searchInput.addEventListener("input", renderContacts);
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderContacts();
  searchInput.focus();
});

contactsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;
  if (action === "toggle-fav") toggleFavorite(id);
  else if (action === "toggle-emg") toggleEmergency(id);
  else if (action === "edit") openEditModal(id);
  else if (action === "delete") deleteContact(id);
});

// Initial Render
renderAll();
