-- Create table required by Spring Modulith event publications to satisfy schema validation in tests
CREATE TABLE IF NOT EXISTS event_publication (
    id UUID PRIMARY KEY,
    event_id UUID,
    event_type VARCHAR(255),
    publication_date TIMESTAMP,
    completion_date TIMESTAMP,
    serialized_event TEXT,
    target_identifier VARCHAR(255),
    serialization_target VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_event_publication_event_id ON event_publication(event_id);
