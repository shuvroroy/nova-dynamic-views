<?php

namespace ShuvroRoy\NovaDynamicViews;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Nova\Events\ServingNova;
use Laravel\Nova\Nova;
use ShuvroRoy\NovaDynamicViews\Http\Middleware\Authorize;

class ToolServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->app->booted(function () {
            $this->routes();
        });

        Nova::serving(function (ServingNova $event) {
            Nova::script('nova-dynamic-views', __DIR__.'/../dist/js/tool.js');
        });
    }

    protected function routes(): void
    {
        if ($this->app->routesAreCached()) {
            return;
        }

        Route::middleware(['nova'])
                ->prefix('nova-vendor/nova-dynamic-views')
                ->group(__DIR__.'/../routes/api.php');
    }
}
