CREATE TABLE IF NOT EXISTS kondangan_relations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert initial relations
INSERT INTO kondangan_relations (name) VALUES 
('Teman Kuliah'), 
('Rekan Kerja'), 
('Keluarga Jauh'), 
('Teman SMA'), 
('Tetangga')
ON CONFLICT DO NOTHING;
