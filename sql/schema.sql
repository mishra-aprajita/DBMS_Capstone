-- =====================================================================
-- Smart Campus Resource & Lab Booking System
-- schema.sql  |  Member 1 - Database Design & Core SQL
-- Target DBMS : MySQL 8.0.16+ (CHECK constraints are enforced)
-- Normal form : 3NF / BCNF (see normalization documentation)
-- =====================================================================

DROP DATABASE IF EXISTS smart_campus;
CREATE DATABASE smart_campus
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE smart_campus;

-- ---------------------------------------------------------------------
-- 1. DEPARTMENT
-- ---------------------------------------------------------------------
CREATE TABLE department (
    dept_id     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    dept_code   VARCHAR(10)   NOT NULL,
    dept_name   VARCHAR(100)  NOT NULL,
    CONSTRAINT pk_department      PRIMARY KEY (dept_id),
    CONSTRAINT uq_department_code UNIQUE (dept_code),
    CONSTRAINT uq_department_name UNIQUE (dept_name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. APP_USER  (identity + role; "USER" is a reserved word, so app_user)
-- ---------------------------------------------------------------------
CREATE TABLE app_user (
    user_id     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    dept_id     INT UNSIGNED  NOT NULL,
    full_name   VARCHAR(100)  NOT NULL,
    email       VARCHAR(120)  NOT NULL,
    phone       VARCHAR(15)   NULL,
    role        ENUM('STUDENT','FACULTY','COORDINATOR','ADMIN','MAINTENANCE','MANAGEMENT')
                              NOT NULL,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_app_user       PRIMARY KEY (user_id),
    CONSTRAINT uq_app_user_email UNIQUE (email),
    CONSTRAINT fk_user_dept      FOREIGN KEY (dept_id) REFERENCES department (dept_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_user_email     CHECK (email LIKE '%_@_%._%')
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. LOCATION  (lab / classroom / hall)
-- ---------------------------------------------------------------------
CREATE TABLE location (
    location_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    dept_id        INT UNSIGNED NOT NULL,
    building       VARCHAR(60)  NOT NULL,
    floor_no       TINYINT      NOT NULL DEFAULT 0,
    room_no        VARCHAR(20)  NOT NULL,
    location_type  ENUM('LAB','CLASSROOM','SEMINAR_HALL','OTHER') NOT NULL,
    capacity       SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT pk_location      PRIMARY KEY (location_id),
    CONSTRAINT uq_location_room UNIQUE (building, room_no),
    CONSTRAINT fk_location_dept FOREIGN KEY (dept_id) REFERENCES department (dept_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_location_cap  CHECK (capacity > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. RESOURCE_TYPE  (category)
-- ---------------------------------------------------------------------
CREATE TABLE resource_type (
    type_id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    type_name          VARCHAR(50)  NOT NULL,
    description        VARCHAR(255) NULL,
    requires_approval  BOOLEAN      NOT NULL DEFAULT TRUE,
    max_booking_hours  TINYINT UNSIGNED NOT NULL DEFAULT 4,
    CONSTRAINT pk_resource_type      PRIMARY KEY (type_id),
    CONSTRAINT uq_resource_type_name UNIQUE (type_name),
    CONSTRAINT ck_type_max_hours     CHECK (max_booking_hours BETWEEN 1 AND 24)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. RESOURCE  (bookable item)
-- ---------------------------------------------------------------------
CREATE TABLE resource (
    resource_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    resource_code   VARCHAR(30)  NOT NULL,
    resource_name   VARCHAR(100) NOT NULL,
    type_id         INT UNSIGNED NOT NULL,
    location_id     INT UNSIGNED NOT NULL,
    coordinator_id  INT UNSIGNED NOT NULL,
    capacity        SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    status          ENUM('AVAILABLE','UNDER_MAINTENANCE','RETIRED')
                                 NOT NULL DEFAULT 'AVAILABLE',
    purchase_date   DATE         NULL,
    CONSTRAINT pk_resource          PRIMARY KEY (resource_id),
    CONSTRAINT uq_resource_code     UNIQUE (resource_code),
    CONSTRAINT fk_resource_type     FOREIGN KEY (type_id) REFERENCES resource_type (type_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_resource_location FOREIGN KEY (location_id) REFERENCES location (location_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_resource_coord    FOREIGN KEY (coordinator_id) REFERENCES app_user (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_resource_capacity CHECK (capacity > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. BOOKING  (reservation header)
-- ---------------------------------------------------------------------
CREATE TABLE booking (
    booking_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      INT UNSIGNED NOT NULL,
    purpose      VARCHAR(200) NOT NULL,
    start_time   DATETIME     NOT NULL,
    end_time     DATETIME     NOT NULL,
    status       ENUM('PENDING','APPROVED','REJECTED','CANCELLED','COMPLETED')
                              NOT NULL DEFAULT 'PENDING',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_booking      PRIMARY KEY (booking_id),
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES app_user (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_booking_time CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. BOOKING_ITEM  (resources in a booking; resolves booking M:N resource)
-- ---------------------------------------------------------------------
CREATE TABLE booking_item (
    booking_item_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id       INT UNSIGNED NOT NULL,
    resource_id      INT UNSIGNED NOT NULL,
    CONSTRAINT pk_booking_item     PRIMARY KEY (booking_item_id),
    CONSTRAINT uq_booking_resource UNIQUE (booking_id, resource_id),
    CONSTRAINT fk_bi_booking       FOREIGN KEY (booking_id) REFERENCES booking (booking_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_bi_resource      FOREIGN KEY (resource_id) REFERENCES resource (resource_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. APPROVAL  (decision on a booking)
-- ---------------------------------------------------------------------
CREATE TABLE approval (
    approval_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id   INT UNSIGNED NOT NULL,
    approver_id  INT UNSIGNED NOT NULL,
    decision     ENUM('APPROVED','REJECTED') NOT NULL,
    remarks      VARCHAR(255) NULL,
    decided_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_approval          PRIMARY KEY (approval_id),
    CONSTRAINT uq_approval_booking  UNIQUE (booking_id),          -- one decision per booking
    CONSTRAINT fk_approval_booking  FOREIGN KEY (booking_id) REFERENCES booking (booking_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_approval_approver FOREIGN KEY (approver_id) REFERENCES app_user (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. MAINTENANCE  (downtime / repair)
-- ---------------------------------------------------------------------
CREATE TABLE maintenance (
    maintenance_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    resource_id        INT UNSIGNED NOT NULL,
    reported_by        INT UNSIGNED NOT NULL,
    issue_description  VARCHAR(255) NOT NULL,
    start_time         DATETIME     NOT NULL,
    end_time           DATETIME     NULL,                         -- NULL = still ongoing
    status             ENUM('SCHEDULED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
    cost               DECIMAL(10,2) NULL,
    CONSTRAINT pk_maintenance      PRIMARY KEY (maintenance_id),
    CONSTRAINT fk_maint_resource   FOREIGN KEY (resource_id) REFERENCES resource (resource_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_maint_reporter   FOREIGN KEY (reported_by) REFERENCES app_user (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_maint_time       CHECK (end_time IS NULL OR end_time > start_time),
    CONSTRAINT ck_maint_cost       CHECK (cost IS NULL OR cost >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. USAGE_LOG  (actual check-in / check-out per booked resource)
-- ---------------------------------------------------------------------
CREATE TABLE usage_log (
    usage_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_item_id  INT UNSIGNED NOT NULL,
    checkin_time     DATETIME     NOT NULL,
    checkout_time    DATETIME     NULL,
    condition_notes  VARCHAR(255) NULL,
    CONSTRAINT pk_usage_log      PRIMARY KEY (usage_id),
    CONSTRAINT uq_usage_item     UNIQUE (booking_item_id),
    CONSTRAINT fk_usage_item     FOREIGN KEY (booking_item_id) REFERENCES booking_item (booking_item_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_usage_time     CHECK (checkout_time IS NULL OR checkout_time > checkin_time)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. CANCELLATION  (history)
-- ---------------------------------------------------------------------
CREATE TABLE cancellation (
    cancellation_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id       INT UNSIGNED NOT NULL,
    cancelled_by     INT UNSIGNED NOT NULL,
    cancelled_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason           VARCHAR(255) NULL,
    CONSTRAINT pk_cancellation        PRIMARY KEY (cancellation_id),
    CONSTRAINT uq_cancellation_book   UNIQUE (booking_id),
    CONSTRAINT fk_cancel_booking      FOREIGN KEY (booking_id) REFERENCES booking (booking_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cancel_user         FOREIGN KEY (cancelled_by) REFERENCES app_user (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Supporting indexes (speed up availability / overlap queries)
-- ---------------------------------------------------------------------
CREATE INDEX idx_booking_time      ON booking (start_time, end_time);
CREATE INDEX idx_booking_status    ON booking (status);
CREATE INDEX idx_booking_user      ON booking (user_id);
CREATE INDEX idx_bi_resource       ON booking_item (resource_id);
CREATE INDEX idx_resource_type     ON resource (type_id);
CREATE INDEX idx_resource_location ON resource (location_id);
CREATE INDEX idx_maint_resource    ON maintenance (resource_id, start_time, end_time);
CREATE INDEX idx_user_role         ON app_user (role);
smart_campussyssmart_campus