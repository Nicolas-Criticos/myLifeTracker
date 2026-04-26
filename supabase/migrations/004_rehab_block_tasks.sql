-- Migration 004: Simplify olive rehab to single block task checklist
-- Replaces rehab_block_deliverables (static, lifetime) with
-- rehab_block_tasks (monthly, per-stage, ticked by Tracey or Nicris)
-- 2026-04-26

-- ── 1. Drop old deliverables table ───────────────────────────────────────────
DROP TABLE IF EXISTS rehab_block_deliverables CASCADE;

-- ── 2. Create rehab_block_tasks ───────────────────────────────────────────────
-- One row = one task on one block for one month.
-- activity_type drives what kind of work it is (same taxonomy as rehab_logs).
-- completed + completed_date = the single tick. That's it.

CREATE TABLE rehab_block_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      uuid NOT NULL REFERENCES rehab_blocks(id) ON DELETE CASCADE,
  month         text NOT NULL,           -- YYYY-MM  e.g. '2026-04'
  activity_type text NOT NULL,           -- same values as rehab_logs.activity_type
  title         text NOT NULL,           -- human label e.g. "Soil Fertilization"
  notes         text,                    -- optional context / products to use
  completed     boolean NOT NULL DEFAULT false,
  completed_date date,
  completed_by  text,                    -- 'tracey' | 'nicris' | null
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index for fast per-block-month queries
CREATE INDEX idx_rbt_block_month ON rehab_block_tasks(block_id, month);

-- ── 3. RLS (match existing rehab tables pattern — anon read, anon write) ──────
ALTER TABLE rehab_block_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select" ON rehab_block_tasks FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON rehab_block_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON rehab_block_tasks FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON rehab_block_tasks FOR DELETE USING (true);

-- ── 4. Seed April 2026 tasks based on actual block stage ─────────────────────
--
-- Block stage logic:
--   Blocks 7-10 (irrigation unknown/pending): only task = restore irrigation
--   Blocks 2-6 (irrigation restored, no fert yet): irrigation check + foliar spray (soil fert)
--   Block 1 (irrigation restored + soil fert done): full active rehab checklist
--
-- Block UUIDs (from rehab_blocks table):
--   Block 1:  def3e0e9-8fda-4a47-8b55-cbaebce805b2  (active, soil fert done)
--   Block 2:  60756589-4ad0-4b28-be43-10e0e37464b3  (restored, no fert)
--   Block 3:  883393cc-652f-4f6a-b073-8ed6e1c40bb5  (restored, no fert)
--   Block 4:  450f3ec9-1584-4e5d-9dec-6dfa6c81c9c9  (restored, no fert)
--   Block 5:  391537fa-84b5-48b5-b235-7c6554536baf  (restored, no fert)
--   Block 6:  0b706a6f-2d3b-4183-bc96-b1c6b73de2f7  (restored, no fert)
--   Block 7:  098f9b4e-4806-452c-9776-56ac57cdbffa  (pending)
--   Block 8:  e5027d30-8217-4f76-8eaa-3953fbd8999d  (pending)
--   Block 9:  e6ab0164-53c5-48c4-8905-2177fffcf4a8  (pending)
--   Block 10: fe3a0f6f-39ce-47a6-ba45-86759c4542f3  (pending)

-- BLOCK 1 — Full active rehab (irrigation done, soil fert done, now full programme)
INSERT INTO rehab_block_tasks (block_id, month, activity_type, title, notes, completed, completed_date, completed_by) VALUES
  ('def3e0e9-8fda-4a47-8b55-cbaebce805b2', '2026-04', 'irrigation',      'Irrigation check',         'Confirm all lines running, check for blockages', true, '2026-04-23', 'nicris'),
  ('def3e0e9-8fda-4a47-8b55-cbaebce805b2', '2026-04', 'soil_correction',  'Soil fertilization',       'Completed last week', true, '2026-04-25', 'tracey'),
  ('def3e0e9-8fda-4a47-8b55-cbaebce805b2', '2026-04', 'foliar_spray',     'Foliar spray',             'Recovery feed — apply after soil fert settles', false, null, null),
  ('def3e0e9-8fda-4a47-8b55-cbaebce805b2', '2026-04', 'nutrient_feed',    'Nutrient feed',            'Liquid feed via irrigation or foliar', false, null, null);

-- BLOCKS 2–6 — Irrigation restored, soil fert scheduled next week
INSERT INTO rehab_block_tasks (block_id, month, activity_type, title, notes, completed, completed_date, completed_by) VALUES
  -- Block 2
  ('60756589-4ad0-4b28-be43-10e0e37464b3', '2026-04', 'irrigation',     'Irrigation check',       'Blocks 1-6 restored — verify Block 2 lines', true, '2026-04-23', 'nicris'),
  ('60756589-4ad0-4b28-be43-10e0e37464b3', '2026-04', 'soil_correction', 'Soil fertilization',    'Scheduled next week', false, null, null),
  -- Block 3
  ('883393cc-652f-4f6a-b073-8ed6e1c40bb5', '2026-04', 'irrigation',     'Irrigation check',       'Verify Block 3 lines', true, '2026-04-24', 'tracey'),
  ('883393cc-652f-4f6a-b073-8ed6e1c40bb5', '2026-04', 'soil_correction', 'Soil fertilization',    'Scheduled next week', false, null, null),
  -- Block 4
  ('450f3ec9-1584-4e5d-9dec-6dfa6c81c9c9', '2026-04', 'irrigation',     'Irrigation check',       'Verify Block 4 lines', true, '2026-04-23', 'nicris'),
  ('450f3ec9-1584-4e5d-9dec-6dfa6c81c9c9', '2026-04', 'soil_correction', 'Soil fertilization',    'Scheduled next week', false, null, null),
  -- Block 5
  ('391537fa-84b5-48b5-b235-7c6554536baf', '2026-04', 'irrigation',     'Irrigation check',       'Verify Block 5 lines', true, '2026-04-23', 'nicris'),
  ('391537fa-84b5-48b5-b235-7c6554536baf', '2026-04', 'soil_correction', 'Soil fertilization',    'Scheduled next week', false, null, null),
  -- Block 6
  ('0b706a6f-2d3b-4183-bc96-b1c6b73de2f7', '2026-04', 'irrigation',     'Irrigation check',       'Verify Block 6 lines', true, '2026-04-23', 'nicris'),
  ('0b706a6f-2d3b-4183-bc96-b1c6b73de2f7', '2026-04', 'soil_correction', 'Soil fertilization',    'Scheduled next week', false, null, null);

-- BLOCKS 7–10 — Irrigation not yet restored, single task
INSERT INTO rehab_block_tasks (block_id, month, activity_type, title, notes) VALUES
  ('098f9b4e-4806-452c-9776-56ac57cdbffa', '2026-04', 'irrigation', 'Restore irrigation', 'Not yet started — assess line damage first'),
  ('e5027d30-8217-4f76-8eaa-3953fbd8999d', '2026-04', 'irrigation', 'Restore irrigation', 'Not yet started'),
  ('e6ab0164-53c5-48c4-8905-2177fffcf4a8', '2026-04', 'irrigation', 'Restore irrigation', 'Not yet started'),
  ('fe3a0f6f-39ce-47a6-ba45-86759c4542f3', '2026-04', 'irrigation', 'Restore irrigation', 'Not yet started');
