USE smart_campus;

DROP USER IF EXISTS 'campus_student'@'localhost';
DROP USER IF EXISTS 'campus_coordinator'@'localhost';

CREATE USER 'campus_student'@'localhost' IDENTIFIED BY 'Student@123';
CREATE USER 'campus_coordinator'@'localhost' IDENTIFIED BY 'Coord@123';

GRANT SELECT ON smart_campus.department TO 'campus_student'@'localhost';
GRANT SELECT ON smart_campus.location TO 'campus_student'@'localhost';
GRANT SELECT ON smart_campus.resource_type TO 'campus_student'@'localhost';
GRANT SELECT ON smart_campus.resource TO 'campus_student'@'localhost';
GRANT SELECT, INSERT ON smart_campus.booking TO 'campus_student'@'localhost';
GRANT SELECT, INSERT ON smart_campus.booking_item TO 'campus_student'@'localhost';

GRANT SELECT, INSERT, UPDATE ON smart_campus.booking TO 'campus_coordinator'@'localhost';
GRANT SELECT, INSERT, UPDATE ON smart_campus.booking_item TO 'campus_coordinator'@'localhost';
GRANT SELECT, INSERT, UPDATE ON smart_campus.approval TO 'campus_coordinator'@'localhost';
GRANT SELECT, INSERT, UPDATE ON smart_campus.maintenance TO 'campus_coordinator'@'localhost';

FLUSH PRIVILEGES;

SHOW GRANTS FOR 'campus_student'@'localhost';
SHOW GRANTS FOR 'campus_coordinator'@'localhost';

-- SQL Injection Prevention demo using prepared statement
SET @res_code = 'LAB-305';
PREPARE stmt_get_resource
FROM 'SELECT resource_id, resource_code, resource_name, status FROM resource WHERE resource_code = ?';
EXECUTE stmt_get_resource USING @res_code;
DEALLOCATE PREPARE stmt_get_resource;