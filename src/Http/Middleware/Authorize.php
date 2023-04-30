<?php

namespace ShuvroRoy\NovaDynamicViews\Http\Middleware;

use Laravel\Nova\Nova;
use ShuvroRoy\NovaDynamicViews\NovaDynamicViews;

class Authorize
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Illuminate\Http\Response
     */
    public function handle($request, $next)
    {
        $tool = collect(Nova::registeredTools())->first([$this, 'matchesTool']);

        return optional($tool)->authorize($request) ? $next($request) : abort(403);
    }

    /**
     * @param  \Laravel\Nova\Tool  $tool
     * @return bool
     */
    public function matchesTool($tool)
    {
        return $tool instanceof NovaDynamicViews;
    }
}
