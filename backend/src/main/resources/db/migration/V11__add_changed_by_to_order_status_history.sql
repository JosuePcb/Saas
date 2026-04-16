-- =============================================
-- V11: Add changed_by to order_status_history
-- =============================================

ALTER TABLE order_status_history
    ADD COLUMN changed_by UUID;

CREATE INDEX idx_order_status_history_changed_by ON order_status_history(changed_by);
