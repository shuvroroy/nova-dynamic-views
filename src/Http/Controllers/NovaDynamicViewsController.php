<?php

namespace ShuvroRoy\NovaDynamicViews\Http\Controllers;

use Illuminate\Routing\Controller;
use Laravel\Nova\Http\Requests\ResourceDetailRequest;
use Illuminate\Support\Str;
use ShuvroRoy\NovaDynamicViews\CustomComponents;

class NovaDynamicViewsController extends Controller
{
    public function __invoke(ResourceDetailRequest $request, string $resource, string $method): CustomComponents|array
    {
        $resourceClass = $request->resource();
        $model = $request->model();
        $method = Str::camel('custom-' . $method . '-components');
        $resource = new $resourceClass($model);

        if(method_exists($resource, $method)) {
            $data = $resource->$method();
            if($data) {
                return $data;
            }
        }

        return [];
    }
}
