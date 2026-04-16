-- =============================================
-- V8: Add payment review auditability fields
-- =============================================

ALTER TABLE payments
    ADD COLUMN decision_comment TEXT,
    ADD COLUMN reviewed_by_user_id UUID,
    ADD COLUMN reviewed_at TIMESTAMP;
