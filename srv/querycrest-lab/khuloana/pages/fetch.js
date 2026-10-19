const API = '';   // same origin
const $ = (sel) => document.querySelector(sel);

let programmesCache = [];
let bookingsCache   = [];

// ---------- PROGRAMMES ----------
async function loadProgrammes() {
  const list = $('#programme-list');
  const select = $('#programme_id');
  try {
    const res = await fetch(`${API}/api/programmes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    programmesCache = await res.json();

    list.innerHTML = programmesCache.length
      ? programmesCache.map(p => `
          <article class="card">
            <h3>${escapeHtml(p.name)}</h3>
            <p>${escapeHtml(p.description || '')}</p>
            <p class="meta">${escapeHtml(p.day_of_week)} · ${escapeHtml(String(p.time_slot).slice(0,5))}
               · ${p.capacity} places · ${escapeHtml(p.instructor)}</p>
          </article>`).join('')
      : '<p>No programmes available.</p>';

    select.innerHTML = '<option value="">— Select a programme —</option>' +
      programmesCache.map(p =>
        `<option value="${p.id}">${escapeHtml(p.name)} — ${escapeHtml(p.day_of_week)}</option>`
      ).join('');
  } catch (err) {
    list.innerHTML = `<p class="error">Could not load programmes: ${escapeHtml(err.message)}</p>`;
  }
}

// ---------- BOOKINGS ----------
async function loadBookings() {
  const box = $('#booking-list');
  try {
    const res = await fetch(`${API}/api/bookings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bookingsCache = await res.json();

    box.innerHTML = bookingsCache.length
      ? `<table>
           <thead><tr><th>Member</th><th>Programme</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
           <tbody>${bookingsCache.map(rowHtml).join('')}</tbody>
         </table>`
      : '<p>No bookings yet.</p>';
  } catch (err) {
    box.innerHTML = `<p class="error">Could not load bookings: ${escapeHtml(err.message)}</p>`;
  }
}

function rowHtml(b) {
  return `<tr data-id="${b.id}">
    <td>${escapeHtml(b.member_name)}<br><small>${escapeHtml(b.member_email)}</small></td>
    <td>${escapeHtml(b.programme_name)}</td>
    <td>${escapeHtml(String(b.booking_date).slice(0,10))}</td>
    <td><span class="status status-${b.status}">${escapeHtml(b.status)}</span></td>
    <td>
      ${b.status === 'confirmed'
        ? `<button data-action="cancel" data-id="${b.id}">Cancel</button>`
        : `<button data-action="confirm" data-id="${b.id}">Confirm</button>`}
      <button data-action="delete" data-id="${b.id}" class="danger">Delete</button>
    </td>
  </tr>`;
}

// Event delegation for row buttons
$('#booking-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;

  try {
    if (action === 'delete') {
      if (!confirm('Delete this booking permanently?')) return;
      const res = await fetch(`${API}/api/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
    } else {
      const status = action === 'cancel' ? 'cancelled' : 'confirmed';
      const res = await fetch(`${API}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
    await loadBookings();
  } catch (err) {
    alert(`Action failed: ${err.message}`);
  }
});

// ---------- CREATE FORM ----------
$('#booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#form-message');
  msg.textContent = '';

  const programme_id = $('#programme_id').value;
  const member_name  = $('#member_name').value.trim();
  const member_email = $('#member_email').value.trim();

  if (!programme_id) { msg.textContent = 'Please choose a programme.'; return; }
  if (member_name.length < 2) { msg.textContent = 'Please enter your full name.'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member_email)) {
    msg.textContent = 'Please enter a valid email address.'; return;
  }

  try {
    const res = await fetch(`${API}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programme_id: Number(programme_id), member_name, member_email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    msg.textContent = 'Booking confirmed!';
    e.target.reset();
    await loadBookings();
  } catch (err) {
    msg.textContent = `Booking failed: ${err.message}`;
  }
});

// XSS safety helper
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// Boot
loadProgrammes();
loadBookings();