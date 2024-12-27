<?php

namespace ShuvroRoy\NovaDynamicViews;

use Illuminate\Http\Request;
use Laravel\Nova\Nova;
use Laravel\Nova\Tool;

class NovaDynamicViews extends Tool
{
    public function boot(): void
    {
        Nova::mix('nova-dynamic-views', __DIR__.'/../dist/mix-manifest.json');
    }

    public function menu(Request $request): array
    {
        return [];
    }
}
