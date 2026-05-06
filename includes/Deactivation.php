<?php

namespace Pninja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

class Deactivation
{
    public static function init()
    {
        flush_rewrite_rules();
    }
}
