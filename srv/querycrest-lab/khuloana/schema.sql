CREATE TABLE programmes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    day_of_week VARCHAR(20)  NOT NULL,
    time_slot   TIME         NOT NULL,
    capacity    INTEGER      NOT NULL CHECK (capacity > 0),
    instructor  VARCHAR(100) NOT NULL
);

CREATE TABLE bookings (
    id           SERIAL PRIMARY KEY,
    programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    member_name  VARCHAR(100) NOT NULL,
    member_email VARCHAR(150) NOT NULL,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status       VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                 CHECK (status IN ('confirmed','cancelled')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO programmes (name, description, day_of_week, time_slot, capacity, instructor) VALUES
('HIIT Blast',     'High-intensity interval training', 'Monday',    '06:00', 20, 'Naledi M.'),
('Power Yoga',     'Strength-focused vinyasa flow',    'Tuesday',   '18:00', 15, 'Sipho K.'),
('Spin Sprint',    'Indoor cycling intervals',         'Wednesday', '17:30', 25, 'Aisha R.'),
('Boxing Basics',  'Beginner boxing technique',        'Thursday',  '07:00', 12, 'Thabo L.'),
('Pilates Core',   'Mat pilates for core stability',   'Friday',    '17:00', 18, 'Lerato N.');
