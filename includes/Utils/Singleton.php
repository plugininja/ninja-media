<?php

namespace Pninja\NM\Utils;

defined('ABSPATH') || exit('No direct script access allowed');

trait Singleton
{
    private static $instance = null;

    public function __construct($args = null)
    {
        // Prevent instantiation.
    }

    final public static function getInstance($args = null, string $argsName = 'accountId')
    {
        if (null === static::$instance || static::$instance->getInstanceIdentifier($argsName) !== $args) {
            static::$instance = new static($args);
            if (method_exists(static::$instance, 'doHooks')) {
                static::$instance->doHooks();
            }
        }

        return static::$instance;
    }

    protected function getInstanceIdentifier(string $argsName)
    {
        return property_exists($this, $argsName) ? $this->{$argsName} : null;
    }
}
