USE smart_campus;

-- 1. ROLLBACK demo: insert a test booking, then undo it completely
START TRANSACTION;

INSERT INTO booking (booking_id, user_id, purpose, start_time, end_time, status, created_at)
VALUES (99, 4, 'Temporary rollback test', '2026-11-29 10:00:00', '2026-11-29 11:00:00', 'PENDING', NOW());

SELECT booking_id, purpose, status FROM booking WHERE booking_id = 99;

ROLLBACK;

-- Verify booking 99 is NOT saved
SELECT booking_id, purpose, status FROM booking WHERE booking_id = 99;

-- 2. COMMIT demo: insert a valid booking + booking_item atomically and save it
START TRANSACTION;

INSERT INTO booking (booking_id, user_id, purpose, start_time, end_time, status, created_at)
VALUES (100, 4, 'Committed lab session', '2026-11-29 14:00:00', '2026-11-29 15:00:00', 'APPROVED', NOW());

INSERT INTO booking_item (booking_item_id, booking_id, resource_id)
VALUES (100, 100, 1);

COMMIT;

-- Verify booking 100 and its item ARE saved
SELECT b.booking_id, b.purpose, b.status, bi.resource_id
FROM booking b
JOIN booking_item bi ON b.booking_id = bi.booking_id
WHERE b.booking_id = 100;