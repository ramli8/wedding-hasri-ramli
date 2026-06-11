-- Create kondangans table
CREATE TABLE IF NOT EXISTS kondangans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relation_id INT NOT NULL,
    couple_name VARCHAR(255) NOT NULL,
    side VARCHAR(50) NOT NULL,
    gift_type VARCHAR(50) NOT NULL,
    gift_name VARCHAR(255) DEFAULT NULL,
    nominal DECIMAL(15,2) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP DEFAULT NULL,
    CONSTRAINT fk_kondangans_relation FOREIGN KEY (relation_id) REFERENCES kondangan_relations(id) ON DELETE RESTRICT
);

CREATE INDEX idx_kondangans_deleted_at ON kondangans(deleted_at);
