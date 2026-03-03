-- Run in Supabase SQL editor if your schema does not have these constraints.
-- Required for scripts/sync_scroll.py upsert (on_conflict).

-- scene_titles: one row per (scroll_id, volume_num, chapter)
-- ALTER TABLE scene_titles ADD CONSTRAINT scene_titles_scroll_volume_chapter_key UNIQUE (scroll_id, volume_num, chapter);

-- images: one row per (scroll_id, volume_num, chapter, index)
-- ALTER TABLE images ADD CONSTRAINT images_scroll_volume_chapter_index_key UNIQUE (scroll_id, volume_num, chapter, index);

-- If your images table links to scene_titles, ensure column exists:
-- ALTER TABLE images ADD COLUMN IF NOT EXISTS scene_title_id BIGINT REFERENCES scene_titles(id);
