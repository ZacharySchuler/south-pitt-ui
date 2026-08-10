CREATE TABLE memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    event_date TEXT,
    title TEXT,
    caption TEXT NOT NULL,
    source TEXT NOT NULL,
    submitted_by TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE memory_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id INTEGER NOT NULL,
    storage_provider TEXT NOT NULL,
    storage_id TEXT NOT NULL,
    original_filename TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(memory_id) REFERENCES memories(id)
);

CREATE INDEX idx_memories_year_event_created
ON memories(year DESC, event_date DESC, created_at DESC);
