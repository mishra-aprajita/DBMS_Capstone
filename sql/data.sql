-- =====================================================================
-- Smart Campus Resource & Lab Booking System
-- data.sql  |  Member 1 - realistic sample dataset
-- Run AFTER schema.sql
-- Demo scenario: LAB-305 (resource 1) booked 23-Nov-2026 10:00-12:00
--   -> booking 3 (11:00-13:00) is REJECTED (overlap)
--   -> booking 2 (12:00-14:00) is APPROVED (back-to-back, no overlap)
-- =====================================================================
USE smart_campus;

-- ---------------------------------------------------------------------
INSERT INTO department (dept_id, dept_code, dept_name) VALUES
(1, 'CSE',   'Computer Science and Engineering'),
(2, 'ECE',   'Electronics and Communication Engineering'),
(3, 'ME',    'Mechanical Engineering'),
(4, 'EEE',   'Electrical and Electronics Engineering'),
(5, 'ADMIN', 'Central Administration');

-- ---------------------------------------------------------------------
INSERT INTO app_user (user_id, dept_id, full_name, email, phone, role, is_active, created_at) VALUES
(1,  1, 'Dr. Anita Sharma',    'anita.sharma@campus.edu',    '9810000001', 'FACULTY',     TRUE, '2025-07-01 09:00:00'),
(2,  2, 'Prof. Rajesh Verma',  'rajesh.verma@campus.edu',    '9810000002', 'FACULTY',     TRUE, '2025-07-01 09:00:00'),
(3,  3, 'Dr. Meena Iyer',      'meena.iyer@campus.edu',      '9810000003', 'FACULTY',     TRUE, '2025-07-01 09:00:00'),
(4,  1, 'Rohan Gupta',         'rohan.gupta@campus.edu',     '9810000004', 'STUDENT',     TRUE, '2025-08-10 10:00:00'),
(5,  1, 'Priya Singh',         'priya.singh@campus.edu',     '9810000005', 'STUDENT',     TRUE, '2025-08-10 10:05:00'),
(6,  2, 'Aman Khan',           'aman.khan@campus.edu',       '9810000006', 'STUDENT',     TRUE, '2025-08-11 11:00:00'),
(7,  3, 'Sneha Patel',         'sneha.patel@campus.edu',     '9810000007', 'STUDENT',     TRUE, '2025-08-11 11:10:00'),
(8,  4, 'Karan Mehta',         'karan.mehta@campus.edu',     '9810000008', 'STUDENT',     TRUE, '2025-08-12 09:30:00'),
(9,  1, 'Neha Joshi',          'neha.joshi@campus.edu',      '9810000009', 'STUDENT',     TRUE, '2025-08-12 09:45:00'),
(10, 1, 'Vikram Rao',          'vikram.rao@campus.edu',      '9810000010', 'COORDINATOR', TRUE, '2024-06-15 09:00:00'),
(11, 2, 'Sunita Desai',        'sunita.desai@campus.edu',    '9810000011', 'COORDINATOR', TRUE, '2024-06-15 09:00:00'),
(12, 5, 'Arjun Nair',          'arjun.nair@campus.edu',      '9810000012', 'ADMIN',       TRUE, '2023-01-05 09:00:00'),
(13, 5, 'Deepak Yadav',        'deepak.yadav@campus.edu',    '9810000013', 'MAINTENANCE', TRUE, '2023-03-20 09:00:00'),
(14, 5, 'Kavita Menon',        'kavita.menon@campus.edu',    '9810000014', 'MANAGEMENT',  TRUE, '2022-04-01 09:00:00'),
(15, 4, 'Dr. Suresh Kulkarni', 'suresh.kulkarni@campus.edu', '9810000015', 'FACULTY',     TRUE, '2025-07-01 09:00:00'),
(16, 2, 'Ishita Bose',         'ishita.bose@campus.edu',     '9810000016', 'STUDENT',     TRUE, '2025-08-12 10:15:00');

-- ---------------------------------------------------------------------
INSERT INTO location (location_id, dept_id, building, floor_no, room_no, location_type, capacity) VALUES
(1, 1, 'Main Block',       3, 'Lab-305',   'LAB',          60),
(2, 1, 'Main Block',       3, 'Lab-306',   'LAB',          40),
(3, 5, 'Main Block',       1, 'Hall-A',    'SEMINAR_HALL', 150),
(4, 1, 'Main Block',       2, 'SC-201',    'CLASSROOM',    80),
(5, 2, 'ECE Block',        1, 'EL-101',    'LAB',          45),
(6, 3, 'Innovation Center',0, 'MS-001',    'LAB',          30),
(7, 5, 'Library Block',    2, 'Hall-B',    'SEMINAR_HALL', 100),
(8, 3, 'ME Block',         1, 'RL-102',    'LAB',          20);

-- ---------------------------------------------------------------------
INSERT INTO resource_type (type_id, type_name, description, requires_approval, max_booking_hours) VALUES
(1, 'Laboratory',         'Computer and electronics labs',              TRUE,  4),
(2, 'Seminar Hall',       'Large halls for seminars and events',        TRUE,  8),
(3, 'Smart Classroom',    'Classroom with smart board and AV system',   TRUE,  3),
(4, 'Projector',          'Portable projectors',                        FALSE, 4),
(5, 'IoT Kit',            'Arduino / Raspberry Pi / sensor kits',       TRUE,  6),
(6, '3D Printer',         'FDM 3D printers',                            TRUE,  6),
(7, 'Research Equipment', 'Oscilloscopes, spectrometers, analyzers',    TRUE,  4);

-- ---------------------------------------------------------------------
INSERT INTO resource (resource_id, resource_code, resource_name, type_id, location_id, coordinator_id, capacity, status, purchase_date) VALUES
(1,  'LAB-305',    'Computer Lab 305',           1, 1, 10, 60,  'AVAILABLE',         '2021-06-01'),
(2,  'LAB-306',    'Computer Lab 306',           1, 2, 10, 40,  'AVAILABLE',         '2021-06-01'),
(3,  'LAB-EL101',  'Electronics Lab 101',        1, 5, 11, 45,  'AVAILABLE',         '2020-08-15'),
(4,  'HALL-A',     'Seminar Hall A',             2, 3, 12, 150, 'AVAILABLE',         '2019-01-10'),
(5,  'HALL-B',     'Seminar Hall B',             2, 7, 12, 100, 'AVAILABLE',         '2022-02-20'),
(6,  'SC-201',     'Smart Classroom 201',        3, 4, 10, 80,  'AVAILABLE',         '2023-07-01'),
(7,  'PROJ-01',    'Epson Projector 01',         4, 4, 10, 1,   'AVAILABLE',         '2022-09-12'),
(8,  'PROJ-02',    'Epson Projector 02',         4, 3, 12, 1,   'AVAILABLE',         '2022-09-12'),
(9,  'IOT-KIT-01', 'Raspberry Pi IoT Kit 01',    5, 1, 10, 1,   'AVAILABLE',         '2024-01-18'),
(10, 'IOT-KIT-02', 'Arduino IoT Kit 02',         5, 5, 11, 1,   'AVAILABLE',         '2024-01-18'),
(11, '3DP-01',     'Creality 3D Printer 01',     6, 6, 12, 1,   'AVAILABLE',         '2023-11-05'),
(12, '3DP-02',     'Creality 3D Printer 02',     6, 6, 12, 1,   'UNDER_MAINTENANCE', '2023-11-05'),
(13, 'OSC-01',     'Digital Oscilloscope 01',    7, 5, 11, 1,   'AVAILABLE',         '2021-03-30'),
(14, 'SPEC-01',    'UV-Vis Spectrometer 01',     7, 8, 12, 1,   'AVAILABLE',         '2022-12-01'),
(15, 'LAB-RL102',  'Research Lab 102',           1, 8, 12, 20,  'AVAILABLE',         '2020-05-25');

-- ---------------------------------------------------------------------
INSERT INTO booking (booking_id, user_id, purpose, start_time, end_time, status, created_at) VALUES
(1,  1,  'DBMS practical - Batch A',          '2026-11-23 10:00:00', '2026-11-23 12:00:00', 'APPROVED',  '2026-11-18 10:00:00'),
(2,  4,  'Final-year project work',           '2026-11-23 12:00:00', '2026-11-23 14:00:00', 'APPROVED',  '2026-11-18 11:30:00'),
(3,  5,  'Mini-project demo preparation',     '2026-11-23 11:00:00', '2026-11-23 13:00:00', 'REJECTED',  '2026-11-18 12:00:00'),
(4,  2,  'Analog circuits experiment',        '2026-11-24 09:00:00', '2026-11-24 11:00:00', 'APPROVED',  '2026-11-19 09:15:00'),
(5,  6,  'IoT sensor prototype',              '2026-11-24 14:00:00', '2026-11-24 16:00:00', 'PENDING',   '2026-11-20 15:00:00'),
(6,  3,  'Prototype printing - gear housing', '2026-11-25 10:00:00', '2026-11-25 13:00:00', 'APPROVED',  '2026-11-19 14:00:00'),
(7,  1,  'Guest lecture on cloud databases',  '2026-11-25 14:00:00', '2026-11-25 15:00:00', 'APPROVED',  '2026-11-20 09:00:00'),
(8,  14, 'Annual Tech Symposium',             '2026-11-26 09:00:00', '2026-11-26 17:00:00', 'APPROVED',  '2026-11-10 10:00:00'),
(9,  7,  'Student club 3D printing workshop', '2026-11-26 11:00:00', '2026-11-26 13:00:00', 'CANCELLED', '2026-11-17 16:00:00'),
(10, 8,  'Inter-department quiz',             '2026-11-27 10:00:00', '2026-11-27 12:00:00', 'PENDING',   '2026-11-21 08:30:00'),
(11, 15, 'Power systems lab session',         '2026-11-20 10:00:00', '2026-11-20 12:00:00', 'COMPLETED', '2026-11-14 10:00:00'),
(12, 4,  'Raspberry Pi home automation',      '2026-11-18 14:00:00', '2026-11-18 16:00:00', 'COMPLETED', '2026-11-13 09:00:00'),
(13, 9,  'Web development practice',          '2026-11-19 10:00:00', '2026-11-19 12:00:00', 'COMPLETED', '2026-11-14 11:00:00'),
(14, 2,  'Signal analysis experiment',        '2026-11-10 09:00:00', '2026-11-10 12:00:00', 'COMPLETED', '2026-11-05 10:00:00'),
(15, 1,  'Data structures lab test',          '2026-10-15 10:00:00', '2026-10-15 12:00:00', 'COMPLETED', '2026-10-10 09:00:00'),
(16, 16, 'PCB enclosure printing',            '2026-10-20 14:00:00', '2026-10-20 17:00:00', 'COMPLETED', '2026-10-15 10:30:00'),
(17, 1,  'Smart classroom orientation',       '2026-10-22 09:00:00', '2026-10-22 11:00:00', 'COMPLETED', '2026-10-17 09:00:00'),
(18, 5,  'Self-study session',                '2026-11-28 15:00:00', '2026-11-28 17:00:00', 'CANCELLED', '2026-11-16 17:00:00'),
(19, 3,  'Material absorption spectra study', '2026-12-01 10:00:00', '2026-12-01 12:00:00', 'APPROVED',  '2026-11-20 13:00:00'),
(20, 7,  'Extra print job',                   '2026-11-30 10:00:00', '2026-11-30 12:00:00', 'REJECTED',  '2026-11-20 14:00:00');

-- ---------------------------------------------------------------------
INSERT INTO booking_item (booking_item_id, booking_id, resource_id) VALUES
(1,  1,  1),
(2,  2,  1),
(3,  3,  1),
(4,  4,  3),
(5,  4,  13),
(6,  5,  10),
(7,  6,  11),
(8,  7,  6),
(9,  7,  7),
(10, 8,  4),
(11, 9,  11),
(12, 10, 5),
(13, 11, 2),
(14, 12, 9),
(15, 13, 1),
(16, 14, 3),
(17, 14, 13),
(18, 15, 1),
(19, 16, 11),
(20, 17, 6),
(21, 18, 2),
(22, 19, 14),
(23, 20, 12);

-- ---------------------------------------------------------------------
INSERT INTO approval (approval_id, booking_id, approver_id, decision, remarks, decided_at) VALUES
(1,  1,  10, 'APPROVED', 'Regular practical slot',                       '2026-11-18 11:00:00'),
(2,  2,  10, 'APPROVED', 'Approved after faculty slot ends',             '2026-11-18 14:00:00'),
(3,  3,  10, 'REJECTED', 'Overlaps with booking 1 on LAB-305',           '2026-11-18 14:05:00'),
(4,  4,  11, 'APPROVED', NULL,                                           '2026-11-19 10:00:00'),
(5,  6,  12, 'APPROVED', 'Material supplied by department',              '2026-11-19 15:00:00'),
(6,  7,  10, 'APPROVED', NULL,                                           '2026-11-20 09:30:00'),
(7,  8,  12, 'APPROVED', 'Management event - priority booking',          '2026-11-10 12:00:00'),
(8,  9,  12, 'APPROVED', NULL,                                           '2026-11-17 17:00:00'),
(9,  11, 10, 'APPROVED', NULL,                                           '2026-11-14 12:00:00'),
(10, 12, 10, 'APPROVED', NULL,                                           '2026-11-13 10:00:00'),
(11, 13, 10, 'APPROVED', NULL,                                           '2026-11-14 12:30:00'),
(12, 14, 11, 'APPROVED', NULL,                                           '2026-11-05 11:00:00'),
(13, 15, 10, 'APPROVED', NULL,                                           '2026-10-10 10:00:00'),
(14, 16, 12, 'APPROVED', NULL,                                           '2026-10-16 09:00:00'),
(15, 17, 10, 'APPROVED', NULL,                                           '2026-10-17 10:00:00'),
(16, 18, 10, 'APPROVED', NULL,                                           '2026-11-16 18:00:00'),
(17, 19, 12, 'APPROVED', NULL,                                           '2026-11-20 15:00:00'),
(18, 20, 12, 'REJECTED', '3DP-02 is under maintenance',                  '2026-11-20 15:30:00');

-- ---------------------------------------------------------------------
INSERT INTO cancellation (cancellation_id, booking_id, cancelled_by, cancelled_at, reason) VALUES
(1, 9,  7, '2026-11-21 09:30:00', 'Workshop postponed to next month'),
(2, 18, 5, '2026-11-20 16:00:00', 'Exam schedule clash');

-- ---------------------------------------------------------------------
INSERT INTO maintenance (maintenance_id, resource_id, reported_by, issue_description, start_time, end_time, status, cost) VALUES
(1, 12, 13, 'Extruder jam - nozzle replacement pending',  '2026-11-15 08:00:00', NULL,                  'IN_PROGRESS', NULL),
(2, 7,  13, 'Projector lamp replacement',                 '2026-10-05 10:00:00', '2026-10-06 12:00:00', 'COMPLETED',   4500.00),
(3, 13, 11, 'Annual calibration of oscilloscope',         '2026-09-20 09:00:00', '2026-09-21 17:00:00', 'COMPLETED',   2500.00),
(4, 3,  13, 'Air-conditioning repair',                    '2026-11-05 08:00:00', '2026-11-06 18:00:00', 'COMPLETED',   8000.00),
(5, 9,  10, 'Sensor module replacement (planned)',        '2026-12-05 09:00:00', '2026-12-05 17:00:00', 'SCHEDULED',   NULL);

-- ---------------------------------------------------------------------
INSERT INTO usage_log (usage_id, booking_item_id, checkin_time, checkout_time, condition_notes) VALUES
(1, 13, '2026-11-20 09:58:00', '2026-11-20 12:05:00', 'All systems normal'),
(2, 14, '2026-11-18 14:05:00', '2026-11-18 15:55:00', 'Returned with all cables'),
(3, 15, '2026-11-19 10:02:00', '2026-11-19 12:00:00', 'Two keyboards need cleaning'),
(4, 16, '2026-11-10 09:00:00', '2026-11-10 11:50:00', NULL),
(5, 17, '2026-11-10 09:05:00', '2026-11-10 11:45:00', 'Probe tip slightly worn'),
(6, 18, '2026-10-15 10:00:00', '2026-10-15 12:10:00', 'Overran by 10 minutes'),
(7, 19, '2026-10-20 14:10:00', '2026-10-20 16:50:00', 'Print completed successfully'),
(8, 20, '2026-10-22 09:00:00', '2026-10-22 10:55:00', 'Smart board calibrated');

-- ---------------------------------------------------------------------
-- Quick sanity checks (row counts)
-- ---------------------------------------------------------------------
SELECT 'department' AS tbl, COUNT(*) AS n FROM department UNION ALL
SELECT 'app_user',      COUNT(*) FROM app_user      UNION ALL
SELECT 'location',      COUNT(*) FROM location      UNION ALL
SELECT 'resource_type', COUNT(*) FROM resource_type UNION ALL
SELECT 'resource',      COUNT(*) FROM resource      UNION ALL
SELECT 'booking',       COUNT(*) FROM booking       UNION ALL
SELECT 'booking_item',  COUNT(*) FROM booking_item  UNION ALL
SELECT 'approval',      COUNT(*) FROM approval      UNION ALL
SELECT 'cancellation',  COUNT(*) FROM cancellation  UNION ALL
SELECT 'maintenance',   COUNT(*) FROM maintenance   UNION ALL
SELECT 'usage_log',     COUNT(*) FROM usage_log;
