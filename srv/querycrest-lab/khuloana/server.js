require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

//credentials from .env
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- PROGRAMMES
app.get('/api/programmes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, day_of_week, time_slot, capacity, instructor FROM programmes ORDER BY day_of_week, time_slot'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/programmes failed:', err.message);
    res.status(500).json({ error: 'Could not load programmes' });
  }
});

// ---------- BOOKINGS (full CRUD)
// CREATE
app.post('/api/bookings', async (req, res) => {
  const { programme_id, member_name, member_email } = req.body;

  if (!programme_id || !member_name || !member_email) {
    return res.status(400).json({ error: 'programme_id, member_name and member_email are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member_email)) {
    return res.status(400).json({ error: 'member_email is not valid' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings (programme_id, member_name, member_email)
       VALUES ($1, $2, $3)
       RETURNING id, programme_id, member_name, member_email, booking_date, status, created_at`,
      [programme_id, member_name.trim(), member_email.trim().toLowerCase()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {                       // FK violation
      return res.status(404).json({ error: 'Programme not found' });
    }
    console.error('POST /api/bookings failed:', err.message);
    res.status(500).json({ error: 'Could not create booking' });
  }
});

// READ all
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.programme_id, p.name AS programme_name,
              b.member_name, b.member_email, b.booking_date, b.status
       FROM bookings b
       JOIN programmes p ON p.id = b.programme_id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/bookings failed:', err.message);
    res.status(500).json({ error: 'Could not load bookings' });
  }
});

// UPDATE
app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { member_name, member_email, status } = req.body;

  if (!member_name && !member_email && !status) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  if (status && !['confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'status must be confirmed or cancelled' });
  }

  try {
    const result = await pool.query(
      `UPDATE bookings
         SET member_name  = COALESCE($1, member_name),
             member_email = COALESCE($2, member_email),
             status       = COALESCE($3, status)
       WHERE id = $4
       RETURNING id, programme_id, member_name, member_email, booking_date, status`,
      [member_name || null, member_email || null, status || null, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/bookings/:id failed:', err.message);
    res.status(500).json({ error: 'Could not update booking' });
  }
});

// DELETE
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/bookings/:id failed:', err.message);
    res.status(500).json({ error: 'Could not delete booking' });
  }
});

// Fallback so unknown /api routes return 404 instead of index.html
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`Fitness booking API listening on http://localhost:${PORT}`));