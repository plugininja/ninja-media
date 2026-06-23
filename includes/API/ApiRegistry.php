<?php

namespace Pninja\NM\API;

use Pninja\NM\API\Controllers\Settings;
use Pninja\NM\API\Controllers\MediaLibrary;
use Pninja\NM\API\Controllers\Tools;
use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class ApiRegistry
{
    use Singleton;
    private array $controllers = [];

    public function __construct()
    {
        $this->register_controllers();
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    private function register_controllers(): void
    {
        $this->controllers = [
            'settings'      => new Settings(),
            'media-library' => new MediaLibrary(),
            'tools'         => new Tools(),
        ];
            
    }

    public function registerRoutes(): void
    {
        foreach ($this->controllers as $controller) {
            $controller->register_routes();
        }
    }

    public function get_controller(string $name): ?BaseController
    {
        return $this->controllers[$name] ?? null;
    }
}
