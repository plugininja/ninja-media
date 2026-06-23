<?php

namespace Pninja\NM\Models;

defined( 'ABSPATH' ) || exit( 'No direct script access allowed' );

use Exception;

use function is_array;
use function is_int;

use WP_Error;

/**
 * Abstract Database Model for Ninja Media Plugin
 *
 * Provides a robust foundation for database operations with WordPress
 * including CRUD operations, validation, error handling, and query building.
 *
 * Features:
 * - Type-safe CRUD operations with comprehensive error handling
 * - Flexible query building and condition management
 * - Built-in pagination and sorting utilities
 * - Data validation and sanitization
 * - Transaction support and batch operations
 * - Security measures against cloning and serialization
 * - Consistent error reporting with WP_Error integration
 *
 * @package Pninja\NM\Models
 * @since 1.0.0
 * @author Pninja Team
 */
abstract class BaseModel
{
    /**
     * WordPress database connection instance
     * @var \wpdb
     */
    protected $database;

    /**
     * Full table name with WordPress prefix
     * @var string
     */
    protected $tableName;

    /**
     * Default maximum records per page for pagination
     */
    public const DEFAULT_ITEMS_PER_PAGE = 20;

    /**
     * Maximum allowed items per page to prevent memory issues
     */
    public const MAX_ITEMS_PER_PAGE = 1000;

    /**
     * Supported database output formats
     */
    public const OUTPUT_FORMATS = [
        'OBJECT'            => OBJECT,
        'ARRAY_ASSOCIATIVE' => ARRAY_A,
        'ARRAY_NUMERIC'     => ARRAY_N,
        'BOOLEAN'           => 'bool'
    ];

    /**
     * Database error codes
     */
    public const ERROR_CODES = [
        'INVALID_DATA'      => 'invalid_data',
        'DATABASE_ERROR'    => 'database_error',
        'NOT_FOUND'         => 'not_found',
        'VALIDATION_FAILED' => 'validation_failed',
        'OPERATION_FAILED'  => 'operation_failed'
    ];

    /**
     * Initialize the database model with table configuration
     *
     * @param string $tableSuffix Table suffix to append to WordPress prefix
     * @throws Exception If database connection fails
     */
    public function __construct($tableSuffix)
    {
        global $wpdb;

        if (!$wpdb instanceof \wpdb) {
            throw new Exception('WordPress database connection not available.');
        }

        $this->database  = $wpdb;
        $this->tableName = $this->buildTableName($tableSuffix);
    }

    /**
     * Build full table name with WordPress prefix
     *
     * @param string $tableSuffix Table suffix
     * @return string Full table name
     */
    private function buildTableName($tableSuffix)
    {
        return $this->database->prefix . sanitize_key($tableSuffix);
    }

    // ========================================
    // ERROR HANDLING METHODS
    // ========================================

    /**
     * Create a standardized database error
     *
     * @param string $errorMessage Database error message
     * @return WP_Error
     */
    protected function createDatabaseError($errorMessage)
    {
        return new WP_Error(
            self::ERROR_CODES['DATABASE_ERROR'],
            /* translators: %s: Database error message */
            sprintf(__('Database error: %s', 'ninja-media'), $errorMessage)
        );
    }

    /**
     * Create a standardized validation error
     *
     * @param string $message Error message
     * @return WP_Error
     */
    protected function createValidationError($message)
    {
        return new WP_Error(
            self::ERROR_CODES['VALIDATION_FAILED'],
            $message
        );
    }

    /**
     * Create a standardized operation error
     *
     * @param string $message Error message
     * @return WP_Error
     */
    protected function createOperationError($message)
    {
        return new WP_Error(
            self::ERROR_CODES['OPERATION_FAILED'],
            $message
        );
    }

    /**
     * Create a standardized not found error
     *
     * @param string $resource Resource name that was not found
     * @return WP_Error
     */
    protected function createNotFoundError($resource = 'Record')
    {
        return new WP_Error(
            self::ERROR_CODES['NOT_FOUND'],
            /* translators: %s: Resource name */
            sprintf(__('%s not found.', 'ninja-media'), $resource)
        );
    }

    /**
     * Validate output format
     *
     * @param mixed $output Output format to validate
     * @param mixed $default Default format if invalid
     * @return mixed Valid output format
     */
    protected function validateOutputFormat($output, $default = OBJECT)
    {
        $validFormats = array_values(self::OUTPUT_FORMATS);

        return in_array($output, $validFormats, true) ? $output : $default;
    }

    /**
     * Disallow cloning of this class
     *
     * @throws Exception
     */
    public function __clone()
    {
        throw new Exception('Clone is not allowed.');
    }

    /**
     * Disallow serialization of this class
     *
     * @throws Exception
     */
    public function __sleep()
    {
        throw new Exception('Serialization is forbidden.');
    }

    /**
     * Disallow deserialization of this class
     *
     * @throws Exception
     */
    public function __wakeup()
    {
        throw new Exception(esc_html__('Deserialization is forbidden.', 'ninja-media'));
    }

    // ========================================
    // CORE CRUD OPERATIONS
    // ========================================

    /**
     * Count total records in the table with optional conditions
     *
     * @param string $whereCondition Optional WHERE conditions (without WHERE keyword)
     * @param array $conditionData Values for prepared statement placeholders
     * @return int|WP_Error Number of records or error
     */
    public function countRecords($whereCondition = '', $conditionData = [])
    {
        if (!empty($whereCondition) && empty($conditionData)) {
            return $this->createValidationError(__('Condition data cannot be empty when using WHERE conditions.', 'ninja-media'));
        }

        $sql    = "SELECT COUNT(*) FROM {$this->tableName}";
        $params = [];

        if (!empty($whereCondition)) {
            $sql .= " WHERE {$whereCondition}";
            $params = $conditionData;
        }

        if (!empty($params)) {
            // Ensure numeric array for spread operator to prevent "Cannot unpack array with string keys" error
            $params = array_values($params);

            $result = $this->database->get_var($this->database->prepare($sql, ...$params));

        } else {
            $result = $this->database->get_var($sql);
        }

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        return (int) $result;
    }

    /**
     * Create a new record in the database
     *
     * @param array $recordData Associative array of column => value pairs
     * @param array $dataFormats Array of format strings (%s, %d, %f) for each value
     * @param string $returnFormat Return format: 'bool', ARRAY_A, ARRAY_N, or OBJECT
     * @return bool|array|object|WP_Error Success status, inserted record, or error
     */
    protected function createRecord(array $recordData, array $dataFormats, $returnFormat = 'bool')
    {
        if (empty($recordData)) {
            return $this->createValidationError('Record data cannot be empty for insert operation.');
        }

        $returnFormat = $this->validateOutputFormat($returnFormat, 'bool');

        $inserted = $this->database->insert($this->tableName, $recordData, $dataFormats);

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        if (!$inserted) {
            return $this->createOperationError(__('Failed to insert record into database.', 'ninja-media'));
        }

        if ($returnFormat === 'bool') {
            return true;
        }

        $insertedId = $this->database->insert_id;
        if (is_int($insertedId) && $insertedId > 0) {
            return $this->findSingleRecord("SELECT * FROM {$this->tableName} WHERE id = %d", [$insertedId], $returnFormat);
        }

        return $inserted;
    }

    /**
     * Update existing records in the database
     *
     * @param array $updateData Associative array of column => value pairs to update
     * @param array $whereConditions Array of where conditions for the update
     * @param array $dataFormats Array of format strings for update data
     * @param array $whereFormats Array of format strings for where conditions
     * @param string $returnFormat Return format: 'bool', ARRAY_A, ARRAY_N, or OBJECT
     * @return bool|array|object|WP_Error Success status, updated record, or error
     */
    protected function updateRecords(array $updateData, array $whereConditions, array $dataFormats, array $whereFormats, $returnFormat = 'bool')
    {
        if (empty($updateData)) {
            return $this->createValidationError(__('Update data cannot be empty for update operation.', 'ninja-media'));
        }

        if (empty($whereConditions)) {
            return $this->createValidationError(__('Where conditions cannot be empty for update operation.', 'ninja-media'));
        }

        $returnFormat = $this->validateOutputFormat($returnFormat, 'bool');

        $updated = $this->database->update($this->tableName, $updateData, $whereConditions, $dataFormats, $whereFormats);

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        if ($updated === false) {
            return $this->createOperationError(__('Failed to update records in database.', 'ninja-media'));
        }

        if ($returnFormat === 'bool') {
            return $updated > 0;
        }

        if (isset($whereConditions['id'])) {
            return $this->findSingleRecord("SELECT * FROM {$this->tableName} WHERE id = %d", [(int) $whereConditions['id']], $returnFormat);
        }

        return $updated;
    }

    /**
     * Delete records from the database with flexible condition support
     *
     * Supports both associative arrays for simple conditions and raw SQL for complex conditions.
     *
     * @param array|string $whereConditions Delete conditions: associative array or raw SQL string
     * @param array $conditionFormats Format strings for where conditions
     * @param bool $allowDeleteAll Allow deletion of all records (dangerous operation)
     * @param array $conditionValues Values for raw SQL placeholders
     * @return int|WP_Error Number of deleted records or error
     */
    protected function deleteRecords($whereConditions = [], $conditionFormats = [], $allowDeleteAll = false, $conditionValues = [])
    {
        if (is_array($whereConditions) && !empty($whereConditions)) {
            $result = $this->database->delete($this->tableName, $whereConditions, $conditionFormats);
        } elseif (is_string($whereConditions) && !empty($whereConditions)) {
            $sql = "DELETE FROM {$this->tableName} WHERE {$whereConditions}";
            if (!empty($conditionValues)) {
                // Ensure numeric array for spread operator to prevent "Cannot unpack array with string keys" error
                $conditionValues = array_values($conditionValues);
                $prepared        = $this->database->prepare($sql, ...$conditionValues);
                $result          = $this->database->query($prepared);
            } else {
                $result = $this->database->query($sql);
            }
        } else {
            if (!$allowDeleteAll) {
                return new WP_Error(
                    'no_where_clause',
                    __('Delete operation blocked: WHERE clause is required for safety.', 'ninja-media')
                );
            }
            $result = $this->database->query("DELETE FROM {$this->tableName}");
        }

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        if ($result === false) {
            return $this->createOperationError(__('Failed to delete records from database.', 'ninja-media'));
        }

        return (int) $result;
    }

    /**
     * Find multiple records using custom SQL query
     *
     * @param string $sqlQuery The SQL query to execute
     * @param array $queryParameters Array of values for prepared statement placeholders
     * @param string $returnFormat Output format: OBJECT, ARRAY_A, or ARRAY_N
     * @return array|WP_Error Array of records or error
     */
    protected function findMultipleRecords($sqlQuery, array $queryParameters = [], $returnFormat = OBJECT)
    {
        $returnFormat = $this->validateOutputFormat($returnFormat, OBJECT);

        if (empty($sqlQuery)) {
            return $this->createValidationError(__('SQL query cannot be empty.', 'ninja-media'));
        }

        if (!empty($queryParameters)) {
            // Ensure numeric array for spread operator to prevent "Cannot unpack array with string keys" error
            $queryParameters = array_values($queryParameters);
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
            $result = $this->database->get_results($this->database->prepare($sqlQuery, ...$queryParameters), $returnFormat);
        } else {
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
            $result = $this->database->get_results($sqlQuery, $returnFormat);
        }

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        return is_array($result) ? $result : [];
    }

    /**
     * Find a single record using custom SQL query
     *
     * @param string $sqlQuery The SQL query to execute
     * @param array $queryParameters Array of values for prepared statement placeholders
     * @param string $returnFormat Output format: OBJECT, ARRAY_A, or ARRAY_N
     * @return object|array|null|WP_Error Single record, null if not found, or error
     */
    protected function findSingleRecord($sqlQuery, array $queryParameters = [], $returnFormat = ARRAY_A)
    {
        $returnFormat = $this->validateOutputFormat($returnFormat, OBJECT);

        if (empty($sqlQuery)) {
            return $this->createValidationError(__('SQL query cannot be empty.', 'ninja-media'));
        }

        // Only use prepare() if there are arguments to bind
        if (!empty($queryParameters)) {
            // Ensure numeric array for spread operator to prevent "Cannot unpack array with string keys" error
            $queryParameters = array_values($queryParameters);
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
            $result = $this->database->get_row($this->database->prepare($sqlQuery, ...$queryParameters), $returnFormat);
        } else {
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
            $result = $this->database->get_row($sqlQuery, $returnFormat);
        }

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        return $result;
    }

    /**
     * Get the table name for this model
     *
     * @return string The full table name including prefix
     */
    public function getTableName()
    {
        return $this->tableName;
    }

    // ========================================
    // UTILITY AND VALIDATION METHODS
    // ========================================

    /**
     * Check if records exist based on given conditions
     *
     * @param array $whereConditions Associative array of column => value conditions
     * @param array $conditionFormats Array of format strings for conditions
     * @return bool|WP_Error True if records exist, false if not, error on database failure
     */
    protected function recordExists(array $whereConditions, array $conditionFormats = [])
    {
        if (empty($whereConditions)) {
            return $this->createValidationError(__('Where conditions cannot be empty for existence check.', 'ninja-media'));
        }

        $whereClause  = [];
        $placeholders = [];

        foreach ($whereConditions as $column => $value) {
            $whereClause[]  = "`{$column}` = {$conditionFormats[$column]}";
            $placeholders[] = $value;
        }

        $sql = "SELECT 1 FROM {$this->tableName} WHERE " . implode(' AND ', $whereClause) . " LIMIT 1";

        // Ensure numeric array for spread operator to prevent "Cannot unpack array with string keys" error
        $placeholders = array_values($placeholders);
        $result       = $this->database->get_var($this->database->prepare($sql, ...$placeholders));

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        return !is_null($result);
    }

    /**
     * Get a single column value from the first matching record
     *
     * @param string $columnName The column name to retrieve
     * @param array $whereConditions Array of where conditions
     * @param array $conditionFormats Array of format strings for conditions
     * @return mixed|WP_Error The column value or error
     */
    protected function getColumnValue($columnName, array $whereConditions, array $conditionFormats = [])
    {
        if (empty($columnName)) {
            return $this->createValidationError(__('Column name cannot be empty.', 'ninja-media'));
        }

        if (empty($whereConditions) || empty($conditionFormats)) {
            return $this->createValidationError(__('Where conditions cannot be empty.', 'ninja-media'));
        }

        $whereClause  = [];
        $placeholders = [];

        foreach ($whereConditions as $column => $value) {
            $whereClause[]  = "`{$column}` = $conditionFormats[$column]";
            $placeholders[] = $value;
        }

        $sql = "SELECT `{$columnName}` FROM {$this->tableName} WHERE " . implode(' AND ', $whereClause) . " LIMIT 1";

        // Ensure numeric array for spread operator to prevent "Cannot unpack array with string keys" error
        $placeholders = array_values($placeholders);
        $result       = $this->database->get_var($this->database->prepare($sql, ...$placeholders));

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        return $result;
    }

    /**
     * Sanitize and validate order direction
     *
     * @param string $order The order direction (ASC or DESC)
     * @return string Valid order direction
     */
    protected function sanitizeOrder($order)
    {
        $order = strtoupper(trim($order));

        return in_array($order, ['ASC', 'DESC'], true) ? $order : 'DESC';
    }

    /**
     * Sanitize and validate order by column
     *
     * @param string $orderBy The column to order by
     * @param array $allowedColumns Array of allowed column names
     * @return string Valid column name or default
     */
    protected function sanitizeOrderBy($orderBy, array $allowedColumns)
    {
        $orderBy = trim($orderBy);

        return in_array($orderBy, $allowedColumns, true) ? $orderBy : ($allowedColumns[0] ?? 'id');
    }

    /**
     * Sanitize pagination parameters
     *
     * @param int $page The page number
     * @param int $perPage Items per page
     * @return array Sanitized pagination parameters
     */
    protected function sanitizePagination($page, $perPage)
    {
        $page    = max(1, (int) $page);
        $perPage = max(0, min(self::MAX_ITEMS_PER_PAGE, (int) $perPage));
        $offset  = ($page - 1) * $perPage;

        return [
            'page'    => $page,
            'perPage' => $perPage,
            'offset'  => $offset
        ];
    }

    // ========================================
    // BATCH OPERATIONS
    // ========================================

    /**
     * Insert multiple records in a batch operation
     *
     * @param array $recordsData Array of record arrays, each containing data for one record
     * @param array $dataFormats Array of format strings for the data
     * @return array|WP_Error Array with success/failure counts or error
     */
    protected function batchCreateRecords(array $recordsData, array $dataFormats)
    {
        if (empty($recordsData)) {
            return $this->createValidationError(__('Records data cannot be empty for batch insert operation.', 'ninja-media'));
        }

        $successCount = 0;
        $failureCount = 0;
        $totalCount   = count($recordsData);
        $errors       = [];

        foreach ($recordsData as $index => $record) {
            if (!is_array($record)) {
                $failureCount++;
                /* translators: %d: index of the record in the batch */
                $errors[] = sprintf(__('Record at index %d is not an array.', 'ninja-media'), $index);
                continue;
            }

            $result = $this->createRecord($record, $dataFormats);
            if (!is_wp_error($result) && $result) {
                $successCount++;
            } else {
                $failureCount++;
                /* translators: %d: index of the record in the batch */
                $errors[] = is_wp_error($result) ? $result->get_error_message() : sprintf(__('Failed to insert record at index %d', 'ninja-media'), $index);
            }
        }

        return [
            'total'        => $totalCount,
            'success'      => $successCount,
            'failed'       => $failureCount,
            'errors'       => $errors,
            'success_rate' => $totalCount > 0 ? round(($successCount / $totalCount) * 100, 2) : 0
        ];
    }

    // ========================================
    // ADVANCED QUERY BUILDING METHODS
    // ========================================

    /**
     * Build a flexible WHERE clause from conditions array
     *
     * @param array $conditions Associative array of conditions
     * @param string $operator Logical operator (AND/OR)
     * @return array ['clause' => string, 'values' => array]
     */
    protected function buildWhereClause(array $conditions, $operator = 'AND')
    {
        if (empty($conditions)) {
            return ['clause' => '', 'values' => []];
        }

        $operator = strtoupper($operator);
        if (!in_array($operator, ['AND', 'OR'], true)) {
            $operator = 'AND';
        }

        $clauses = [];
        $values  = [];

        foreach ($conditions as $column => $value) {
            if (is_array($value)) {
                // Handle IN clauses
                $placeholders = array_fill(0, count($value), '%s');
                $clauses[]    = "`{$column}` IN (" . implode(',', $placeholders) . ")";
                $values       = array_merge($values, $value);
            } elseif ($value === null) {
                $clauses[] = "`{$column}` IS NULL";
            } else {
                $clauses[] = "`{$column}` = %s";
                $values[]  = $value;
            }
        }

        return [
            'clause' => implode(" {$operator} ", $clauses),
            'values' => $values
        ];
    }

    /**
     * Find records with flexible conditions and pagination
     *
     * @param array $conditions WHERE conditions
     * @param array $options Query options (limit, offset, orderBy, order)
     * @param string $returnFormat Return format
     * @return array|WP_Error
     */
    public function findRecordsWhere(array $conditions = [], array $options = [], $returnFormat = OBJECT)
    {
        $returnFormat = $this->validateOutputFormat($returnFormat, OBJECT);

        $sql    = "SELECT * FROM {$this->tableName}";
        $values = [];

        if (!empty($conditions)) {
            $whereClause = $this->buildWhereClause($conditions);
            $sql .= " WHERE " . $whereClause['clause'];
            $values = $whereClause['values'];
        }

        // Add ordering
        if (!empty($options['orderBy'])) {
            $orderBy = sanitize_key($options['orderBy']);
            $order   = $this->sanitizeOrder($options['order'] ?? 'ASC');
            $sql .= " ORDER BY `{$orderBy}` {$order}";
        }

        // Add pagination
        if (isset($options['limit'])) {
            $limit = max(1, min(self::MAX_ITEMS_PER_PAGE, (int) $options['limit']));
            $sql .= " LIMIT {$limit}";

            if (isset($options['offset'])) {
                $offset = max(0, (int) $options['offset']);
                $sql .= " OFFSET {$offset}";
            }
        }

        return $this->findMultipleRecords($sql, $values, $returnFormat);
    }

    public function getPaginatedRecords(array $conditions = [], $page = 1, $itemsPerPage = null, $orderBy = 'id', $order = 'DESC')
    {
        if ($itemsPerPage === null) {
            $itemsPerPage = self::DEFAULT_ITEMS_PER_PAGE;
        }

        $pagination = $this->sanitizePagination($page, $itemsPerPage);

        $options = [
            'orderBy' => $orderBy,
            'order'   => $order,
            'limit'   => $pagination['perPage'],
            'offset'  => $pagination['offset']
        ];

        $records = $this->findRecordsWhere($conditions, $options);

        if (is_wp_error($records)) {
            return $records;
        }

        $whereClause = $this->buildWhereClause($conditions);
        $countSql    = "SELECT COUNT(*) FROM {$this->tableName}";

        if (!empty($whereClause['clause'])) {
            $countSql .= " WHERE " . $whereClause['clause'];
        }

        if (!empty($whereClause['values'])) {
            $whereValues = array_values($whereClause['values']);
            $totalCount  = $this->database->get_var($this->database->prepare($countSql, ...$whereValues));
        } else {
            $totalCount = $this->database->get_var($countSql);
        }

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        return [
            'records'    => $records,
            'pagination' => [
                'current_page' => $pagination['page'],
                'per_page'     => $pagination['perPage'],
                'total_items'  => (int) $totalCount,
                'total_pages'  => ceil($totalCount / $pagination['perPage']),
                'has_next'     => $pagination['page'] * $pagination['perPage'] < $totalCount,
                'has_previous' => $pagination['page'] > 1
            ]
        ];
    }

    // ========================================
    // HELPER AND ACCESSOR METHODS
    // ========================================

    public function getTableSuffix()
    {
        return str_replace($this->database->prefix, '', $this->tableName);
    }

    protected function executeRawQuery($sql, array $parameters = [])
    {
        if (empty($parameters)) {
            return $this->database->query($sql);
        }

        $parameters = array_values($parameters);

        return $this->database->query($this->database->prepare($sql, ...$parameters));
    }

    protected function beginTransaction()
    {
        return $this->database->query('START TRANSACTION') !== false;
    }

    protected function commitTransaction()
    {
        return $this->database->query('COMMIT') !== false;
    }

    protected function rollbackTransaction()
    {
        return $this->database->query('ROLLBACK') !== false;
    }

    public const MIME_TYPE_MAP = [
		'jpg'  => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'png'  => 'image/png',
		'gif'  => 'image/gif',
		'bmp'  => 'image/bmp',
		'svg'  => 'image/svg+xml',
		'pdf'  => 'application/pdf',
		'doc'  => 'application/msword',
		'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'xls'  => 'application/vnd.ms-excel',
		'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'ppt'  => 'application/vnd.ms-powerpoint',
		'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'txt'  => 'text/plain',
		'zip'  => 'application/zip',
		'rar'  => 'application/x-rar-compressed',
		'video' => 'video/%',
		'audio' => 'audio/%',
	];

    public static function formatAttachment(int $attachmentId): ?array
    {
        $post = get_post($attachmentId);

        if (!$post || $post->post_type !== 'attachment') {
            return null;
        }

        $url      = wp_get_attachment_url($attachmentId) ?: '';
        $filePath = get_attached_file($attachmentId);
        $fileSize = $filePath && file_exists($filePath) ? filesize($filePath) : 0;
        $extension = $url ? strtolower(pathinfo($url, PATHINFO_EXTENSION)) : '';

        $size_map     = ['small' => 'thumbnail', 'medium' => 'medium', 'large' => 'large'];
        $thumb_setting = \Pninja\NM\Utils\Helpers::getSetting('display.settings.thumbnailSize', 'medium');
        $wp_size      = $size_map[$thumb_setting] ?? 'medium';
        $thumb_src    = wp_get_attachment_image_src($attachmentId, $wp_size);
        $thumbnailUrl = $thumb_src ? $thumb_src[0] : $url;

        $replacedAt = (string) get_post_meta($attachmentId, '_pnpnm_replaced_at', true);
        if ($replacedAt !== '') {
            $url          = add_query_arg('v', $replacedAt, $url);
            $thumbnailUrl = add_query_arg('v', $replacedAt, $thumbnailUrl);
        }

        $isUsed = get_post_meta($attachmentId, '_pnpnm_media_used', true) === '1';

        return [
            'id'           => $attachmentId,
            'name'         => $post->post_title ?: basename($filePath ?: ''),
            'url'          => $url,
            'thumbnailUrl' => $thumbnailUrl,
            'extension'    => $extension,
            'size'         => (int) $fileSize,
            'createdAt'    => $post->post_date,
            'updatedAt'    => $post->post_modified,
            'location'     => $isUsed ? self::getLocationData($attachmentId) : [],
            'alt'          => (string) get_post_meta($attachmentId, '_wp_attachment_image_alt', true),
            'caption'      => $post->post_excerpt,
            'description'  => $post->post_content,
            'isWatermarked' => metadata_exists('post', $attachmentId, '_pnpnm_watermarked')
                && get_post_meta($attachmentId, '_pnpnm_watermarked', true) === '1',
            'isFavorite'    => get_post_meta($attachmentId, '_pnpnm_favorite_' . get_current_user_id(), true) === '1',
        ];
    }

    private static function getLocationData(int $attachmentId): array
    {
        global $wpdb;

        $excluded_types    = "'attachment', 'revision', 'nav_menu_item'";
        $excluded_statuses = "'trash', 'auto-draft'";

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        $thumbnail_ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT p.ID FROM {$wpdb->postmeta} pm
                 JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                 WHERE pm.meta_key = '_thumbnail_id'
                   AND pm.meta_value = %s
                   AND p.post_status NOT IN ({$excluded_statuses})
                   AND p.post_type NOT IN ({$excluded_types})
                 LIMIT 20",
                (string) $attachmentId
            )
        );

        $content_ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts}
                 WHERE post_status NOT IN ({$excluded_statuses})
                   AND post_type NOT IN ({$excluded_types})
                   AND post_content LIKE %s
                 LIMIT 20",
                '%wp-image-' . $attachmentId . '%'
            )
        );

        // phpcs:enable

        $all_ids = array_unique(array_merge(
            array_map('intval', $thumbnail_ids ?: []),
            array_map('intval', $content_ids ?: [])
        ));

        $locations = [];
        foreach ($all_ids as $post_id) {
            $post = get_post($post_id);
            if (!$post) {
                continue;
            }
            $locations[] = [
                'name' => $post->post_title ?: "#{$post_id}",
                'url'  => (string) (get_permalink($post_id) ?: ''),
            ];
        }

        return $locations;
    }

    public static function syncUsageFlag(int $attachmentId): void
    {
        global $wpdb;

        $posts    = $wpdb->posts;
        $postmeta = $wpdb->postmeta;
        $excluded_types   = "'attachment', 'revision', 'nav_menu_item'";
        $excluded_statuses = "'trash', 'auto-draft'";

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- hardcoded exclusion lists, not user input.

        $is_thumbnail = (bool) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT EXISTS(
                    SELECT 1 FROM {$postmeta}
                    WHERE meta_key = '_thumbnail_id'
                      AND meta_value = %s
                    LIMIT 1
                )",
                (string) $attachmentId
            )
        );

        if ($is_thumbnail) {
            update_post_meta($attachmentId, '_pnpnm_media_used', '1');
            return;
        }

        $is_in_content = (bool) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT EXISTS(
                    SELECT 1 FROM {$posts}
                    WHERE post_status NOT IN ({$excluded_statuses})
                      AND post_type NOT IN ({$excluded_types})
                      AND post_content LIKE %s
                    LIMIT 1
                )",
                '%wp-image-' . $attachmentId . '%'
            )
        );

        if ($is_in_content) {
            update_post_meta($attachmentId, '_pnpnm_media_used', '1');
            return;
        }

        $rel_path = get_post_meta($attachmentId, '_wp_attached_file', true);

        if ($rel_path !== '' && $rel_path !== false) {
            $is_in_path = (bool) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT EXISTS(
                        SELECT 1 FROM {$posts}
                        WHERE post_status NOT IN ({$excluded_statuses})
                          AND post_type NOT IN ({$excluded_types})
                          AND post_content LIKE %s
                        LIMIT 1
                    )",
                    '%' . $wpdb->esc_like((string) $rel_path) . '%'
                )
            );

            if ($is_in_path) {
                update_post_meta($attachmentId, '_pnpnm_media_used', '1');
                return;
            }
        }

        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        delete_post_meta($attachmentId, '_pnpnm_media_used');
    }
}
