CREATE TABLE `emaki_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`emaki_id` text NOT NULL,
	`visitor_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emaki_likes_emaki_visitor_idx` ON `emaki_likes` (`emaki_id`,`visitor_hash`);--> statement-breakpoint
CREATE TABLE `scene_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`emaki_id` text NOT NULL,
	`scene_index` integer NOT NULL,
	`visitor_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scene_likes_scene_visitor_idx` ON `scene_likes` (`emaki_id`,`scene_index`,`visitor_hash`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`page_url` text,
	`emaki_id` text,
	`locale` text,
	`created_at` integer NOT NULL
);
