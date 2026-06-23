=== Ninja Media – Media Library Folders & File Manager ===
Contributors: plugininja, abdullaharham
Tags: media library folders, media folder, media library, file manager, media organizer
Requires at least: 6.2
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.3
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Media library folders for WordPress — create unlimited folders, drag & drop, bulk manage, SVG upload, and media organizer for any site.

== Description ==

Ninja Media is a Media Library Folder Management Plugin. Organize your media library into unlimited folders, drag and drop files, and manage thousands of attachments — all from your familiar WordPress media screen.

**Media Library Folder Management**

🔗 Official Website Link: [Official Website](https://plugininja.com/ninja-media)
🔗 Join Our FB Community: [Plugininja Facebook Group](https://www.facebook.com/groups/plugininja)

* Create, rename, and organize folders in Media Library.
* Drag and drop files between folders.
* Move folders to any position in the tree.
* Sort folders by name, date, or custom order
* Visual tree with breadcrumb navigation and expand/collapse
* The Uncategorized view collects all files not yet assigned to a folder

**Media Library Browser & File Manager**

* Browse media organized by folder with pagination (up to 200 files per page)
* Search media and folders by name
* Bulk-select files for batch operations
* Context menu -- right-click any file or folder for quick actions

**Media Library SVG Support**

* SVG upload support
* Automatic sanitization strips potentially harmful markup before saving

**Upload & Image Controls**

* Set a custom maximum upload file size, independent of the server default
* Configure WordPress's large-image scaling threshold
* Automatically generate all registered thumbnail sizes on upload

**Settings**

* Export and import your full configuration as a JSON file
* Auto-save -- changes are saved automatically as you make them

**Developer & Integration**

* Full REST API for all folder and media operations
* Filter and action hooks around every significant operation
* Properly enqueued assets, nonces, capability checks, and sanitized I/O throughout

**Pro Version**

= WebP Conversion (Pro) =
* Automatically convert JPEG and PNG uploads to WebP format
* Reduces file size and improves page-load performance

= Post-Type Folders (Pro) =
* Organize posts, pages, and any public custom post type into their own independent folder trees
* Works alongside the media folder system -- each post type has its own sidebar and folder tree
* Assign posts to folders from the standard WordPress admin list screens
* Supports third-party post types (Tutor LMS courses and more)
* Control which post types show folder panels from the Settings screen

= Download Folders as ZIP (Pro) =
* Export any folder (or multiple folders) as a ZIP archive
* Preserves original folder structure inside the archive
* Download link is returned immediately for direct browser download

= Replace Media (Pro) =
* Swap any attachment with a new file
* Preserves the original attachment ID, URL, metadata, folder assignments, and all post relationships -- existing links and embeds keep working

= Watermarks (Pro) =
* Apply text or image watermarks automatically on upload or in bulk to existing media
* Text watermarks: choose font family (including custom uploaded fonts), size, color, bold/italic, rotation, and opacity; supports {site_name} placeholder
* Image watermarks: set position, scale percentage, opacity, and tile pattern (horizontal/vertical spacing, diagonal)
* Restore original files at any time from the built-in backup stored in /uploads/pnpnm-originals/
* Apply to all registered thumbnail sizes, full size only, or a custom selection
* Advanced conditions: filter by image dimensions, file size, allowed extensions, user role, and post type

= Custom Watermark Fonts (Pro) =
* Upload your own TTF, OTF, WOFF, or WOFF2 font files
* Manage and delete uploaded fonts from the Watermark settings panel

= Favorites (Pro) =
* Star any media item to add it to your personal Favorites collection
* Favorites are per-user and persist across sessions

= Duplicate Media (Pro) =
* Create an exact copy of any media file with a single click
* Auto-generates a unique filename (filename-copy.ext, filename-copy-1.ext, etc.)
* Carries over all post meta to the new attachment

= Trash & Restore (Pro) =
* Send media to a soft-delete Trash bin instead of deleting permanently
* Browse all trashed files in the dedicated Trash view
* Restore files to their original folder at any time
* Permanently delete individual or all trashed files when ready

= Unused Media Detection (Pro) =
* Automatically identifies media files not referenced in any post or page
* The Dedicated Unused Files view lists every orphaned attachment
* Remove unused files in bulk, with an option to move them to Trash first

= Dynamic Folders (Pro) =
* Smart virtual folders that group media automatically by file type/extension
* No manual sorting required -- files appear in their dynamic folder the moment they are uploaded

= Theme Selection (Pro) =
* Choose from four visual styles: Default, Bold, Plugininja, or Beautiful

= Media Details on Hover (Pro) =
* Show file name, type, and size as a tooltip when hovering over a media item in the grid

= Show Folder ID (Pro) =
* Display the numeric folder ID in the topbar and More menu for developer reference

= Folder Color Picker (Pro) =
* Assign a custom hex color to any folder for visual organization in the tree

== Third Party / External Services ==

This plugin uses Freemius (https://freemius.com) as its licensing and update management platform. Freemius may collect and transmit data to its servers in the following situations:

**Free version:** When the plugin is activated, Freemius displays an optional opt-in dialog. If the site administrator opts in, the following data may be sent to Freemius servers:

* Site URL and admin email address
* WordPress version, PHP version, and server environment
* Plugin version and activation status

Opting in is not required to use the plugin. If you skip or decline, no data is sent.

**Pro version:** When a Pro license is active, Freemius communicates with its servers to validate the license and check for updates. The following data is sent:

* License key and activation status
* Site URL
* WordPress and plugin version
* Freemius Website: https://freemius.com
* Freemius Terms of Service: https://freemius.com/terms/
* Freemius Privacy Policy: https://freemius.com/privacy/

== Privacy Policy ==

This plugin integrates Freemius for license management and optional usage tracking. If the site administrator opts in to sharing data during plugin activation, non-personal diagnostic information is transmitted to Freemius. No visitor or user data is ever collected.

For full details, see the Third Party / External Services section above
and the Freemius Privacy Policy at https://freemius.com/privacy/

== Installation ==

1. Upload the `ninja-media` folder to the `/wp-content/plugins/` directory, or install the plugin through the WordPress Plugins screen directly.
2. Activate the plugin through the Plugins screen in WordPress.
3. Go to **Ninja Media > File Manager** in the admin sidebar to start organizing your files.
4. Configure SVG support, upload limits, and other options under **Ninja Media > Settings**.

== Frequently Asked Questions ==

= Will activating the plugin affect my existing media files? =

No. Activating the plugin does not move, rename, or alter any existing files. It adds an organizational layer on top of your existing media library.

= Does it work with media that is already uploaded? =

Yes. All existing attachments appear in the Uncategorized view immediately after activation. You can move them into folders at any time.

= Is SVG upload safe? =

The plugin includes built-in SVG sanitization that strips potentially dangerous markup (scripts, external references, event handlers) before saving the file. Sanitization is on by default.

= What happens to my data if I deactivate the plugin? =

Deactivation does not remove any data. Your folders, settings, and media assignments remain intact. Data is only removed if you delete the plugin and have enabled "Delete data on uninstall" in the Tools settings (this option is off by default).

= Is the plugin compatible with Multisite? =

Yes, Multisite is fully supported.

= Does this plugin work with Elementor, WooCommerce, or other page builders? =

Yes, this plugin works with Elementor, WooCommerce, and others.

= Can I apply watermarks to images I already uploaded? (Pro) =

Yes, via the bulk-apply tool in the Watermark settings panel. This is a Pro feature.

= Does the Replace Media feature break existing links? (Pro) =

No. When you replace an attachment, the plugin preserves the original attachment ID, URL, and all post relationships. Your existing links and embeds continue to work unchanged.

= What watermark font formats are supported? (Pro) =

TTF, OTF, WOFF, and WOFF2. Several built-in system fonts (Sans Serif, Serif, Monospace, DejaVu Sans) are also available without uploading anything. Custom font upload is a Pro feature.

= Can I restore original images after applying a watermark? (Pro) =

Yes. The plugin stores a backup of the original file in /uploads/pnpnm-originals/ before applying a watermark. You can restore any image to its original state from the Watermark settings at any time.

= What happens to trashed media? (Pro) =

Trashed media is soft-deleted -- it is hidden from normal views but not permanently removed. You can browse, restore, or permanently delete trashed items from the Trash view at any time.

== Contributors ==

This plugin is developed and maintained by:

* Plugininja -- Lead development and architecture
* Abdullah Arham -- Core development and feature implementation

Contributions, bug reports, and feature suggestions are welcome on GitHub: https://github.com/plugininja/ninja-media

== Changelog ==

= 1.0.3 - 2026-06-15 =
* Added: Frontend image lightbox -- click any image on your site to open a full-screen viewer.
* Added: In-browser image editor -- crop, rotate, flip, and resize attachments directly from the media library.
* Added: Default Featured Image -- set a site-wide fallback image for posts that have no featured image set; outputs Open Graph and Twitter card meta tags automatically.
* Added: WordPress Abilities API integration -- exposes folder and file operations to MCP clients for AI-assisted media management.
* Fixed: Image processor reliability improvements and WP Filesystem compliance.

= 1.0.2 - 2026-05-18 =
* Fixed: Gutenberg and Classic editor sidebar issue.
* Fixed: Tutor LMS sidebar issue.
* Fixed: Elementor sidebar responsive issue.

= 1.0.1 - 2026-05-17 =
* Fixes a post-type library container timing issue. Update recommended for all Pro users using Post-Type Folders.
* Added: Favorites -- mark and filter media items per user. (Pro)
* Added: Automatic thumbnail generation on upload.
* Added: Text and image watermarks with custom font upload (Pro).
* Added: Replace Media with link and ID preservation (Pro).
* Added: Duplicate Media with unique filename generation (Pro).
* Added: Trash and Restore for soft-delete media management (Pro).
* Added: Unused media detection and bulk-remove tool (Pro).
* Added: Dynamic Folders -- auto-group media by file type (Pro).
* Added: WebP conversion on upload (Pro).
* Added: Download folders as ZIP (Pro).
* Added: Post-Type Folders for posts, pages, and custom post types (Pro).
* Added: Theme selection -- Default, Bold, Plugininja, or Beautiful (Pro).
* Added: Media details tooltip on hover (Pro).
* Added: Folder color picker (Pro).
* Added: Show Folder ID toggle (Pro).

= 1.0.0 - 2026-05-10 =
* Initial release.
* Folder management for media library and custom post types.
* SVG upload with sanitization.
* Bulk selection and context menu.
* Auto organization rules.
* Upload size limit and large-image threshold controls.
* Uncategorized view groups all media not assigned to any folder.
* Settings panel with export/import and auto-save.

== Upgrade Notice ==

= 1.0.3 =
Adds frontend lightbox, in-browser image editor, default featured image fallback, and WP Abilities API support. Update recommended for all users.

= 1.0.2 =
Fixes Gutenberg, Classic editor, Elementor sidebar, and Tutor LMS sidebar issues. Update recommended for all users.

= 1.0.0 =
Initial release -- no upgrade steps required.