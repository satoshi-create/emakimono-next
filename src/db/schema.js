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

// =============================================================================
// ポラロイド・コラボホワイトボード（複数人共有ルーム）
// =============================================================================

export const polaroidBoards = sqliteTable("polaroid_boards", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("みんなのポラロイドボード"),
  description: text("description").notNull().default(""),
  visibility: text("visibility").notNull().default("unlisted"), // 'unlisted' (限定公開) | 'public' (公開ボード)
  createdByHash: text("created_by_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const polaroidBoardItems = sqliteTable("polaroid_board_items", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => polaroidBoards.id, { onDelete: "cascade" }),
  scrollId: text("scroll_id").notNull(),
  sceneIndex: integer("scene_index").notNull().default(0),
  src: text("src").notNull(),
  panX: integer("pan_x").notNull().default(0),
  panY: integer("pan_y").notNull().default(0),
  zoom: text("zoom").notNull().default("1"),
  coverScale: text("cover_scale").notNull().default("1"),
  theme: text("theme").notNull().default("classic"),
  displayTitle: text("display_title").notNull().default(""),
  displayChapter: text("display_chapter").notNull().default(""),
  message: text("message").notNull().default(""),
  boardX: integer("board_x").notNull().default(0),
  boardY: integer("board_y").notNull().default(0),
  rotate: text("rotate").notNull().default("0"),
  zIndex: integer("z_index").notNull().default(1),
  authorName: text("author_name").notNull().default(""),
  visitorHash: text("visitor_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
