<?php

namespace Pninja\NM\API;

defined('ABSPATH') || exit('No direct script access allowed');

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

abstract class BaseController
{
    protected string $namespace;
    protected string $rest_base;
    protected const HTTP_OK                    = 200;
    protected const HTTP_CREATED               = 201;
    protected const HTTP_BAD_REQUEST           = 400;
    protected const HTTP_UNAUTHORIZED          = 401;
    protected const HTTP_FORBIDDEN             = 403;
    protected const HTTP_NOT_FOUND             = 404;
    protected const HTTP_INTERNAL_SERVER_ERROR = 500;

    public function __construct(string $namespace, string $rest_base)
    {
        $this->namespace = $namespace;
        $this->rest_base = "/$rest_base";
    }

    abstract public function register_routes(): void;

    public function checkPermission(WP_REST_Request $request): bool
    {
        return current_user_can('manage_options');
    }

    protected function successResponse($data, string $message = '', array $meta = []): WP_REST_Response
    {
        if ('' === $message) {
            $message = __('Success', 'ninja-media');
        }
        $response_data = [
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ];

        if (!empty($meta)) {
            $response_data['meta'] = $meta;
        }

        return new WP_REST_Response($response_data, self::HTTP_OK);
    }

    protected function errorResponse($error, int $status = self::HTTP_BAD_REQUEST, array $extra = []): WP_REST_Response
    {
        if ($error instanceof WP_Error) {
            $message = $error->get_error_message();
            $code    = $error->get_error_code();

            $statusMap = [
                'not_found'         => self::HTTP_NOT_FOUND,
                'validation_failed' => 422,
                'invalid_data'      => self::HTTP_BAD_REQUEST,
                'operation_failed'  => self::HTTP_INTERNAL_SERVER_ERROR,
                'database_error'    => self::HTTP_INTERNAL_SERVER_ERROR,
            ];

            $status = $statusMap[$code] ?? $status;

            $response_data = [
                'success' => false,
                'code'    => $code,
                'message' => $message,
            ];
        } else {
            $response_data = [
                'success' => false,
                'message' => (string) $error,
            ];
        }

        if (!empty($extra)) {
            $response_data['extra'] = $extra;
        }

        return new WP_REST_Response($response_data, $status);
    }

    protected function validateRequestData(WP_REST_Request $request, array $rules = []): array
    {
        $data = $request->get_json_params() ?: $request->get_params();

        foreach ($rules as $field => $rule) {
            if ($rule['required'] && !isset($data[$field])) {
                throw new \InvalidArgumentException(esc_html("Missing required field: {$field}"));
            }
        }

        return $data;
    }

    protected function handleException(\Exception $e, string $default_message = ''): WP_REST_Response
    {
        if ('' === $default_message) {
            $default_message = __('An error occurred.', 'ninja-media');
        }
        $message = $default_message;
        $status  = self::HTTP_INTERNAL_SERVER_ERROR;
        $extra   = [];

        if ($e instanceof \InvalidArgumentException) {
            $message = $e->getMessage();
            $status  = self::HTTP_BAD_REQUEST;
        }

        if ($e instanceof WP_Error) {
            $message   = $e->get_error_message() ?: $message;
            $errorCode = $e->get_error_code();
            $status    = is_numeric($errorCode) ? (int) $errorCode : self::HTTP_INTERNAL_SERVER_ERROR;
        }

        return $this->errorResponse($message, $status, $extra);
    }
}
