-- Dream Tracker Table
-- Created: 2026-04-25

CREATE TABLE ops_dreams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  title text,
  narrative text NOT NULL,
  symbols text[] DEFAULT '{}',
  emotions text[] DEFAULT '{}',
  clarity int CHECK (clarity BETWEEN 1 AND 5) DEFAULT 3,
  lucid boolean DEFAULT false,
  recurring boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS policies (match existing pattern — anon can read/write)
ALTER TABLE ops_dreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dreams_select" ON ops_dreams FOR SELECT USING (true);
CREATE POLICY "dreams_insert" ON ops_dreams FOR INSERT WITH CHECK (true);
CREATE POLICY "dreams_update" ON ops_dreams FOR UPDATE USING (true);
CREATE POLICY "dreams_delete" ON ops_dreams FOR DELETE USING (true);
