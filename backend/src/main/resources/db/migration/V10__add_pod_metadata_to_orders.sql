ALTER TABLE orders
    ADD COLUMN pod_object_key VARCHAR(400),
    ADD COLUMN pod_content_type VARCHAR(120),
    ADD COLUMN pod_size_bytes BIGINT,
    ADD COLUMN pod_uploaded_at TIMESTAMP;
