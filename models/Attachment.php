<?php

namespace Pninja\NM\Models;

defined('ABSPATH') || exit('No direct script access allowed');

class Attachment extends BaseModel
{
	private const VALID_TYPES = [ 'all', 'trash', 'uncategorized', 'unused', 'used', 'with_folders', 'favorites' ];

	private const ORDER_BY_MAP = [
		'name'      => 'p.post_title',
		'size'      => 'p.ID',
		'createdAt' => 'p.post_date',
		'updatedAt' => 'p.post_modified',
	];

	public function __construct() {
		parent::__construct( 'posts' );
	}

	private static function build_meta_query( string $type ): array {
		switch ( $type ) {

			case 'uncategorized':
				return [
					'relation' => 'AND',
					[
						'relation' => 'OR',
						[
							'key'     => '_pnpnm_media_folder_id',
							'compare' => 'NOT EXISTS',
						],
						[
							'key'     => '_pnpnm_media_folder_id',
							'value'   => '',
							'compare' => '=',
						],
					],
					[
						'relation' => 'OR',
						[
							'key'     => '_pnpnm_media_trashed',
							'compare' => 'NOT EXISTS',
						],
						[
							'key'     => '_pnpnm_media_trashed',
							'value'   => '1',
							'compare' => '!=',
						],
					],
				];
				

			case 'with_folders':
				return [
					[
						'key'     => '_pnpnm_media_folder_id',
						'compare' => 'EXISTS',
					],
				];

			case 'favorites':
				return [
					[
						'key'     => '_pnpnm_favorite_' . get_current_user_id(),
						'value'   => '1',
						'compare' => '=',
					],
				];

			case 'all':
			default:
				return [
					'relation' => 'OR',
					[
						'key'     => '_pnpnm_media_trashed',
						'compare' => 'NOT EXISTS',
					],
					[
						'key'     => '_pnpnm_media_trashed',
						'value'   => '1',
						'compare' => '!=',
					],
				];
		}
	}

	private static function build_query_args( string $type, array $ids = [] ): array {
		$args = [
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'orderby'        => 'date',
			'order'          => 'DESC',
		];

		if ( ! empty( $ids ) ) {
			$args['post__in'] = array_map( 'absint', $ids );
		}

		$meta_query = self::build_meta_query( $type );
		if ( ! empty( $meta_query ) ) {
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- required for media type filtering; no viable alternative.
			$args['meta_query'] = $meta_query;
		}
		

		return $args;
	}
                        
	public static function get( string $type = 'all', bool $count = false, array $ids = [] ): int|array {
		if ( ! in_array( $type, self::VALID_TYPES, true ) ) {
			$type = 'all';
		}

		if ( $count ) {
			return self::count( $type, $ids );
		}

		$args    = self::build_query_args( $type, $ids );
		$results = get_posts( $args );

		return apply_filters( 'pnpnm_get_attachments', $results, $type, $ids );
	}

	public static function count( string $type = 'all', array $ids = [] ): int {
		$args                   = self::build_query_args( $type, $ids );
		$args['posts_per_page'] = 1;
		$args['no_found_rows']  = false;
		unset( $args['orderby'], $args['order'] );

		$query = new \WP_Query( $args );

		return (int) $query->found_posts;
	}

	public function query_paginated( array $args = [] ): array {
		$type      = (string) ( $args['type']      ?? 'all' );
		$extension = (string) ( $args['extension'] ?? '' );
		$search    = (string) ( $args['search']    ?? '' );

		$order = $this->sanitizeOrder( (string) ( $args['order'] ?? 'DESC' ) );

		$order_by = $this->sanitizeOrderBy(
			(string) ( $args['order_by'] ?? 'createdAt' ),
			array_keys( self::ORDER_BY_MAP )
		);

		$pagination = $this->sanitizePagination(
			(int) ( $args['page']     ?? 1 ),
			(int) ( $args['per_page'] ?? self::DEFAULT_ITEMS_PER_PAGE )
		);

		$where_frags = [
			"p.post_type = 'attachment'",
			"p.post_status = 'inherit'",
			$this->build_type_sql( $type ),
		];
		$where_vals = [];

		if ( 'dynamic' === $type ) {
			if ( '' !== $extension ) {
				$mime_frag = self::build_dynamic_bucket_sql( $extension );
				if ( '' !== $mime_frag ) {
					$where_frags[] = $mime_frag;
				}
			}
		} else {
			if ( '' !== $extension && isset( self::MIME_TYPE_MAP[ $extension ] ) ) {
				$where_frags[] = 'p.post_mime_type = %s';
				$where_vals[]  = self::MIME_TYPE_MAP[ $extension ];
			}
		}

		if ( '' !== $search && 'dynamic' !== $type ) {
			$where_frags[] = 'p.post_title LIKE %s';
			$where_vals[]  = '%' . $this->database->esc_like( $search ) . '%';
		}

		$where_frags = (array) apply_filters( 'pnpnm_attachment_query_frags', $where_frags, $args );

		$where_vals = (array) apply_filters( 'pnpnm_attachment_query_vals', $where_vals, $args );

		$order_by_col  = self::ORDER_BY_MAP[ $order_by ] ?? 'p.post_date';
		$where_sql     = implode( ' AND ', $where_frags );
		$select_params = array_merge( $where_vals, [ $pagination['perPage'], $pagination['offset'] ] );

		$count_sql = "SELECT COUNT(*) FROM {$this->tableName} p WHERE {$where_sql}";

		if ( ! empty( $where_vals ) ) {
			$total = (int) $this->database->get_var( $this->database->prepare( $count_sql, $where_vals ) );
		} else {
			$total = (int) $this->database->get_var( $count_sql );
		}

		$select_sql = "SELECT p.ID FROM {$this->tableName} p WHERE {$where_sql} ORDER BY {$order_by_col} {$order} LIMIT %d OFFSET %d";
		$rows       = $this->findMultipleRecords( $select_sql, $select_params, ARRAY_A );
		$ids        = ! is_wp_error( $rows ) ? array_map( 'intval', array_column( (array) $rows, 'ID' ) ) : [];

		return [
			'ids'   => $ids,
			'total' => $total,
		];
	}

	private function build_type_sql( string $type ): string {

		$pm = $this->database->postmeta;

		$not_trashed = "(
			NOT EXISTS (
				SELECT 1 FROM {$pm} pm_t
				WHERE pm_t.post_id = p.ID
				  AND pm_t.meta_key = '_pnpnm_media_trashed'
			)
			OR EXISTS (
				SELECT 1 FROM {$pm} pm_t2
				WHERE pm_t2.post_id = p.ID
				  AND pm_t2.meta_key = '_pnpnm_media_trashed'
				  AND pm_t2.meta_value != '1'
			)
		)";

		switch ( $type ) {
			case 'uncategorized':
				return "(
					NOT EXISTS (
						SELECT 1 FROM {$pm} pm_f
						WHERE pm_f.post_id = p.ID
						  AND pm_f.meta_key = '_pnpnm_media_folder_id'
						  AND pm_f.meta_value != ''
					)
				) AND {$not_trashed}";
			

			case 'favorites':
				$uid      = (int) get_current_user_id();
				$meta_key = '_pnpnm_favorite_' . $uid;
				return "EXISTS (
					SELECT 1 FROM {$pm} pm_fav
					WHERE pm_fav.post_id = p.ID
					  AND pm_fav.meta_key = '{$meta_key}'
					  AND pm_fav.meta_value = '1'
				)";

			case 'dynamic':
			case 'all':
			default:
				return $not_trashed;
		}
	}

	private static function build_dynamic_bucket_sql( string $bucket ): string {
		switch ( $bucket ) {
			case 'jpg':
			case 'jpeg':
				return "p.post_mime_type = 'image/jpeg'";
			case 'png':
				return "p.post_mime_type = 'image/png'";
			case 'gif':
				return "p.post_mime_type = 'image/gif'";
			case 'webp':
				return "p.post_mime_type = 'image/webp'";
			case 'svg':
				return "p.post_mime_type = 'image/svg+xml'";
			case 'pdf':
				return "p.post_mime_type = 'application/pdf'";
			case 'docx':
				return "p.post_mime_type LIKE '%wordprocessingml%'";
			case 'xlsx':
				return "p.post_mime_type LIKE '%spreadsheetml%'";
			case 'pptx':
				return "p.post_mime_type LIKE '%presentationml%'";
			case 'video':
				return "p.post_mime_type LIKE 'video/%'";
			case 'audio':
				return "p.post_mime_type LIKE 'audio/%'";
			case 'archive':
				return "p.post_mime_type IN (
					'application/zip',
					'application/x-rar-compressed',
					'application/x-tar',
					'application/x-7z-compressed'
				)";
			default:
				return '';
		}
	}

    public static function exists( int|array $ids ): bool
    {
        global $wpdb;

        $ids = is_array( $ids ) ? $ids : [ $ids ];
        $ids = array_filter( array_map( 'absint', $ids ) );

        if ( empty( $ids ) ) {
            return false;
        }

        $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- $placeholders is built from %d tokens only; standard WP pattern for IN clauses with a dynamic count.
        $count        = (int) $wpdb->get_var(
            $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE ID IN ($placeholders) AND post_type = 'attachment' AND post_status = 'inherit'", ...$ids )
        );
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare

        return $count === count( $ids );
    }

	public static function clear( string $type = 'all' ): void {
		$args = self::build_query_args( $type );
		$ids  = get_posts( $args );

		if ( empty( $ids ) ) {
			return;
		}

		foreach ( $ids as $id ) {
			wp_delete_attachment( $id, true );
		}

		wp_cache_delete( 'last_changed', 'pnpnm' );
	}
        
}
