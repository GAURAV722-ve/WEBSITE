// ===== La Maison — Restaurant Booking App =====

// ===== Data =====
const TABLES = [
    { id: 1, label: 'T1', seats: 2, icon: '🪑', type: 'Window' },
    { id: 2, label: 'T2', seats: 2, icon: '🪑', type: 'Window' },
    { id: 3, label: 'T3', seats: 4, icon: '🍽️', type: 'Center' },
    { id: 4, label: 'T4', seats: 4, icon: '🍽️', type: 'Center' },
    { id: 5, label: 'T5', seats: 2, icon: '🪑', type: 'Bar' },
    { id: 6, label: 'T6', seats: 6, icon: '🛋️', type: 'Booth' },
    { id: 7, label: 'T7', seats: 4, icon: '🍽️', type: 'Center' },
    { id: 8, label: 'T8', seats: 2, icon: '🪑', type: 'Window' },
    { id: 9, label: 'T9', seats: 8, icon: '🛋️', type: 'Private' },
    { id: 10, label: 'T10', seats: 4, icon: '🍽️', type: 'Center' },
    { id: 11, label: 'T11', seats: 2, icon: '🪑', type: 'Bar' },
    { id: 12, label: 'T12', seats: 6, icon: '🛋️', type: 'Booth' },
    { id: 13, label: 'T13', seats: 4, icon: '🍽️', type: 'Center' },
    { id: 14, label: 'T14', seats: 2, icon: '🪑', type: 'Window' },
    { id: 15, label: 'T15', seats: 8, icon: '🛋️', type: 'Private' },
];

let bookings = JSON.parse(localStorage.getItem('lamaison_bookings') || '[]');
let selectedTable = null;

// ===== DOM Elements =====
const floorPlan = document.getElementById('floorPlan');
const bookingForm = document.getElementById('bookingForm');
const bookBtn = document.getElementById('bookBtn');
const tableHint = document.getElementById('tableHint');
const bookingDate = document.getElementById('bookingDate');
const bookingTime = document.getElementById('bookingTime');
const guestCount = document.getElementById('guestCount');
const confirmationModal = document.getElementById('confirmationModal');
const confirmationDetails = document.getElementById('confirmationDetails');
const confirmationId = document.getElementById('confirmationId');
const reservationsBody = document.getElementById('reservationsBody');
const emptyState = document.getElementById('emptyState');
const filterDate = document.getElementById('filterDate');
const clearFilter = document.getElementById('clearFilter');
const navbar = document.getElementById('navbar');
const mobileMenu = document.getElementById('mobileMenu');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    setMinDate();
    renderFloorPlan();
    renderDashboard();
    setupNavScrollSpy();
    setupMobileMenu();
    setupFormListeners();
});

// ===== Set min date to today =====
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    bookingDate.setAttribute('min', today);
    bookingDate.value = today;
}

// ===== Floor Plan =====
function renderFloorPlan() {
    floorPlan.innerHTML = '';
    const date = bookingDate.value;
    const time = bookingTime.value;

    TABLES.forEach(table => {
        const el = document.createElement('div');
        el.className = 'floor-table';
        el.dataset.tableId = table.id;

        const isBooked = isTableBooked(table.id, date, time);
        if (isBooked) {
            el.classList.add('booked');
        } else if (selectedTable === table.id) {
            el.classList.add('selected');
        } else {
            el.classList.add('available');
        }

        el.innerHTML = `
            <span class="table-icon">${table.icon}</span>
            <span class="table-label">${table.label}</span>
            <span class="table-seats">${table.seats} seats</span>
        `;

        if (!isBooked) {
            el.addEventListener('click', () => selectTable(table.id));
        }

        floorPlan.appendChild(el);
    });
}

function isTableBooked(tableId, date, time) {
    if (!date || !time) return false;
    return bookings.some(b =>
        b.tableId === tableId &&
        b.date === date &&
        b.time === time &&
        b.status !== 'cancelled'
    );
}

function selectTable(tableId) {
    if (selectedTable === tableId) {
        selectedTable = null;
        updateBookButton();
        renderFloorPlan();
        return;
    }

    selectedTable = tableId;
    updateBookButton();
    renderFloorPlan();

    const table = TABLES.find(t => t.id === tableId);
    showToast(`Selected ${table.label} — ${table.type} (${table.seats} seats)`, 'info');
}

function updateBookButton() {
    if (selectedTable) {
        const table = TABLES.find(t => t.id === selectedTable);
        bookBtn.disabled = false;
        bookBtn.textContent = `Book ${table.label} — ${table.type} (${table.seats} seats)`;
        tableHint.style.display = 'none';
    } else {
        bookBtn.disabled = true;
        bookBtn.textContent = 'Select a Table to Continue';
        tableHint.style.display = 'none';
    }
}

// ===== Form =====
function setupFormListeners() {
    bookingDate.addEventListener('change', () => {
        selectedTable = null;
        updateBookButton();
        renderFloorPlan();
    });

    bookingTime.addEventListener('change', () => {
        selectedTable = null;
        updateBookButton();
        renderFloorPlan();
    });

    bookingForm.addEventListener('submit', handleBooking);

    filterDate.addEventListener('change', () => renderDashboard());
    clearFilter.addEventListener('click', () => {
        filterDate.value = '';
        renderDashboard();
    });
}

function handleBooking(e) {
    e.preventDefault();

    const name = document.getElementById('guestName').value.trim();
    const email = document.getElementById('guestEmail').value.trim();
    const phone = document.getElementById('guestPhone').value.trim();
    const date = bookingDate.value;
    const time = bookingTime.value;
    const guests = guestCount.value;
    const requests = document.getElementById('specialRequests').value.trim();

    if (!name || !email || !phone || !date || !time || !guests) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (!selectedTable) {
        tableHint.style.display = 'block';
        showToast('Please select a table from the floor plan', 'error');
        return;
    }

    // Check again if still available
    if (isTableBooked(selectedTable, date, time)) {
        showToast('This table was just booked. Please pick another.', 'error');
        selectedTable = null;
        updateBookButton();
        renderFloorPlan();
        return;
    }

    const table = TABLES.find(t => t.id === selectedTable);
    const confirmId = generateConfirmationId();

    const booking = {
        id: confirmId,
        name, email, phone,
        date, time,
        guests: parseInt(guests),
        tableId: selectedTable,
        tableLabel: table.label,
        tableType: table.type,
        tableSeats: table.seats,
        requests,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveBookings();

    // Show confirmation
    showConfirmation(booking);

    // Reset
    bookingForm.reset();
    setMinDate();
    selectedTable = null;
    updateBookButton();
    renderFloorPlan();
    renderDashboard();

    showToast('🎉 Reservation confirmed!', 'success');
}

function generateConfirmationId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'LM-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function showConfirmation(booking) {
    const timeFormatted = formatTime(booking.time);
    const dateFormatted = formatDate(booking.date);

    confirmationDetails.innerHTML = `
        <div class="confirm-row"><span class="label">Guest</span><span class="value">${booking.name}</span></div>
        <div class="confirm-row"><span class="label">Date</span><span class="value">${dateFormatted}</span></div>
        <div class="confirm-row"><span class="label">Time</span><span class="value">${timeFormatted}</span></div>
        <div class="confirm-row"><span class="label">Party Size</span><span class="value">${booking.guests} Guest${booking.guests > 1 ? 's' : ''}</span></div>
        <div class="confirm-row"><span class="label">Table</span><span class="value">${booking.tableLabel} — ${booking.tableType}</span></div>
        ${booking.requests ? `<div class="confirm-row"><span class="label">Notes</span><span class="value">${booking.requests}</span></div>` : ''}
    `;

    confirmationId.textContent = `Confirmation: ${booking.id}`;
    confirmationModal.classList.add('active');
}

function closeModal() {
    confirmationModal.classList.remove('active');
}

// ===== Dashboard =====
function renderDashboard() {
    const dateFilter = filterDate.value;
    let filtered = bookings;

    if (dateFilter) {
        filtered = bookings.filter(b => b.date === dateFilter);
    }

    // Stats
    const activeBookings = bookings.filter(b => b.status === 'confirmed');
    document.getElementById('totalBookings').textContent = activeBookings.length;
    document.getElementById('totalGuests').textContent = activeBookings.reduce((sum, b) => sum + b.guests, 0);

    const today = new Date().toISOString().split('T')[0];
    const todayBookings = activeBookings.filter(b => b.date === today);
    document.getElementById('tablesBooked').textContent = todayBookings.length;

    // Table rows
    if (filtered.length === 0) {
        reservationsBody.innerHTML = '';
        emptyState.style.display = 'block';
        document.querySelector('.table-responsive').style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    document.querySelector('.table-responsive').style.display = 'block';

    // Sort newest first
    const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    reservationsBody.innerHTML = sorted.map(b => `
        <tr>
            <td style="font-family: monospace; color: var(--accent-1);">${b.id}</td>
            <td><strong>${b.name}</strong></td>
            <td>${formatDate(b.date)}</td>
            <td>${formatTime(b.time)}</td>
            <td>${b.guests}</td>
            <td>${b.tableLabel} (${b.tableType})</td>
            <td>
                <span class="status-badge ${b.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled'}">
                    ${b.status === 'confirmed' ? '✓ Confirmed' : '✗ Cancelled'}
                </span>
            </td>
            <td>
                ${b.status === 'confirmed' ? `<button class="btn btn-sm btn-danger" onclick="cancelBooking('${b.id}')">Cancel</button>` : '—'}
            </td>
        </tr>
    `).join('');
}

function cancelBooking(id) {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    booking.status = 'cancelled';
    saveBookings();
    renderFloorPlan();
    renderDashboard();
    showToast(`Reservation ${id} cancelled`, 'error');
}

// ===== Storage =====
function saveBookings() {
    localStorage.setItem('lamaison_bookings', JSON.stringify(bookings));
}

// ===== Helpers =====
function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Navigation =====
function setupNavScrollSpy() {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);

        // Active link
        const sections = ['home', 'booking', 'dashboard'];
        let current = '';
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section && window.scrollY >= section.offsetTop - 200) {
                current = id;
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });
}

function setupMobileMenu() {
    mobileMenu.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('open');
    });
}

// Make closeModal and cancelBooking globally accessible
window.closeModal = closeModal;
window.cancelBooking = cancelBooking;
