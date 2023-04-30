<?php

namespace ShuvroRoy\NovaDynamicViews;

use Laravel\Nova\Nova;
use Laravel\Nova\Tool;
use Illuminate\Http\Request;

class NovaDynamicViews extends Tool
{
    public function boot(): void
    {
        Nova::script('nova-dynamic-views', __DIR__.'/../dist/js/tool.js');
    }

    public function menu(Request $request): array
    {
        return [];
    }
}
