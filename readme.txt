=== Ninja Media ===
Contributors: plugininja, abdullaharham
Tags: media library, media folders, file manager, media organizer, watermark
Requires at least: 6.2
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Organize your WordPress media library with folders, watermarks, replace media, SVG support, and advanced file management tools.

== Description ==

Ninja Media gives you full control over your WordPress media library. Create folders and sub-folders, drag and drop files to organize them, apply image watermarks automatically on upload, replace existing media without breaking links, and control who can access which folders.

**Key Features**

* **Folders & Sub-folders** — Create an unlimited folder tree for your media library. Supports drag-and-drop file assignment.
* **Post-Type Folders** — Organize posts, pages, and any custom post type into folders, not just attachments.
* **Watermarks** — Automatically apply text or image watermarks to uploaded images. Control position, opacity, font, size, tiling, and more.
* **Custom Watermark Fonts** — Upload your own TTF, OTF, WOFF, or WOFF2 font files for text watermarks.
* **Replace Media** — Replace any attachment with a new file while preserving all post links and metadata.
* **SVG Support** — Enable SVG uploads with built-in sanitization to keep your site safe.
* **Bulk Selection** — Select multiple files at once for bulk move, delete, or folder assignment.
* **Dynamic Folders** — Automatically group media by type, date, unused files, and more.
* **Auto Organization** — Automatically assign uploaded media to the correct folder based on rules you define.
* **Context Menu** — Right-click on any file or folder for quick actions.
* **Undo Actions** — Undo recent file and folder operations.
* **Breadcrumb Navigation** — Navigate deep folder trees easily with a breadcrumb trail.
* **User Access Control** — Restrict folder access by user or role.
* **Upload Size Control** — Set a custom maximum upload size from the plugin settings.
* **REST API & WP-CLI Support** — Integrate with external tools via the REST API or manage the library from the command line.

== Installation ==

1. Upload the `ninja-media` folder to the `/wp-content/plugins/` directory, or install the plugin through the WordPress Plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to Ninja Media** to start organizing your files.
4. Configure watermarks, access control, and other options under **Settings → Ninja Media**.

== Frequently Asked Questions ==

= Will this plugin affect my existing media files? =

No. Activating the plugin does not move, rename, or alter any existing files. It adds an organizational layer on top of your existing media library.

= Is SVG upload safe? =

The plugin includes built-in SVG sanitization that strips potentially dangerous markup before saving the file. Sanitization is enabled by default and can be configured in the General settings.

= What watermark font formats are supported? =

TTF, OTF, WOFF, and WOFF2. You can also choose from several built-in fonts (Sans Serif, Serif, Monospace, DejaVu Sans).

= What happens to my data if I deactivate the plugin? =

Deactivation does not remove any data. Your folders, settings, and media remain intact. Data is only removed if you choose to delete the plugin and have enabled the "Delete data on uninstall" option in Tools settings.

= Is the plugin compatible with Multisite? =

Multisite compatibility is planned. Single-site installs are fully supported.

== Screenshots ==

1. The main media library view with folder tree and file grid.
2. Folder management — create, rename, and nest folders.

== Contributors ==

This plugin is brought to you by:

* **Plugin Ninja** - Lead development and architecture
* **Abdullah Arham** - Core development and feature implementation

**Want to contribute?**

Ninja Media is open source! Contributions are welcome on GitHub:
https://github.com/plugininja/ninja-media

Report bugs, suggest features, or submit pull requests to help make Ninja Media better for everyone.

== Changelog ==

= 1.0.0 =
* Initial release.
* Folder management for media library and custom post types.
* Text and image watermarks with custom font upload.
* Replace Media with link preservation.
* SVG upload with sanitization.
* Bulk selection and context menu.
* Dynamic folders (by type, date, unused).
* Auto organization rules.
* User and role-based folder access control.
* REST API and WP-CLI integration.

== Upgrade Notice ==

= 1.0.0 =
Initial release — no upgrade steps required.
