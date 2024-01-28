<?php

namespace ShuvroRoy\NovaDynamicViews;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Nova\Events\ServingNova;
use Laravel\Nova\Nova;
use Laravel\Nova\Http\Middleware\Authenticate;
use ShuvroRoy\NovaDynamicViews\Http\Middleware\Authorize;

class ToolServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->app->booted(function () {
            $this->routes();
        });
    }

    protected function routes(): void
    {
        if ($this->app->routesAreCached()) {
            return;
        }

        Route::middleware(['nova', Authenticate::class, Authorize::class])
                ->prefix('nova-vendor/nova-dynamic-views')
                ->group(__DIR__.'/../routes/api.php');
    }
}
