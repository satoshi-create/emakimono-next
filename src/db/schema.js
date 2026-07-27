import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const emakiLikes = sqliteTable(
  "emaki_likes",
  {
    id: text("id").primaryKey(),
    emakiId: text("emaki_id").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    emakiVisitorIdx: uniqueIndex("emaki_likes_emaki_visitor_idx").on(
      table.emakiId,
      table.visitorHash
    ),
  })
);

export const sceneLikes = sqliteTable(
  "scene_likes",
  {
    id: text("id").primaryKey(),
    emakiId: text("emaki_id").notNull(),
    sceneIndex: integer("scene_index").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    sceneVisitorIdx: uniqueIndex("scene_likes_scene_visitor_idx").on(
      table.emakiId,
      table.sceneIndex,
      table.visitorHash
    ),
  })
);

export const scrollFeedback = sqliteTable("scroll_feedback", {
  id: text("id").primaryKey(),
  emakiId: text("emaki_id").notNull(),
  choice: text("choice").notNull(),
  sceneIndex: integer("scene_index").notNull(),
  scrollRatio: real("scroll_ratio"),
  locale: text("locale"),
  visitorHash: text("visitor_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
