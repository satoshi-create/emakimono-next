DROP TABLE IF EXISTS `feedback`;
--> statement-breakpoint
CREATE TABLE `scroll_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`emaki_id` text NOT NULL,
	`choice` text NOT NULL,
	`scene_index` integer NOT NULL,
	`scroll_ratio` real,
	`locale` text,
	`visitor_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
