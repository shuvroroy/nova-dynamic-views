# Nova dynamic views

[![PHP Version Require](http://poser.pugx.org/shuvroroy/nova-dynamic-views/require/php)](https://packagist.org/packages/shuvroroy/nova-dynamic-views)
[![Latest Stable Version](http://poser.pugx.org/shuvroroy/nova-dynamic-views/v)](https://packagist.org/packages/shuvroroy/nova-dynamic-views)
[![Total Downloads](http://poser.pugx.org/shuvroroy/nova-dynamic-views/downloads)](https://packagist.org/packages/shuvroroy/nova-dynamic-views) 
[![License](http://poser.pugx.org/shuvroroy/nova-dynamic-views/license)](https://packagist.org/packages/shuvroroy/nova-dynamic-views)

This package will help to add some custom placeholder components like `custom-index-header`, `custom-index-toolbar`, `custom-detail-header`, `custom-detail-toolbar`, etc in various section in views. It provides a much easier API for it and it allows you to use these "placeholder" components multiple times without overwriting each other.

![screenshot](https://user-images.githubusercontent.com/21066418/235350026-dd4a649f-01f2-4057-a6e6-9e147ec76fb6.png)

## Support For This Project

<a href="https://www.buymeacoffee.com/shuvroroy" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

## Requirements

* PHP (^8.1 or higher)
* Laravel Nova (^4.0 or higher)

## Installation

Require the package with composer

```
composer require shuvroroy/nova-dynamic-views
```

Register the tool in the `tools` method in `\App\Providers\NovaServiceProvider`:

```php 
use ShuvroRoy\NovaDynamicViews\NovaDynamicViews;

...

public function tools()
{
    return [
        new NovaDynamicViews()
    ];
}
```

## Usage

Let's say you want to add a custom button to the `toolbar` of all `index` views. Just create a vue component for it, as you would do if you use the `custom-index-header` (see section "Create custom component" if you don't know how to). Let's call it `my-index-toolbar-btn`. Now the only thing you have to do is register it to your `\App\Ņova\Resource` class, within a new method called `customIndexToolbarComponents`, which returns a `\ShuvroRoy\NovaDynamicViews\CustomComponents` object:

```php
public function customIndexToolbarComponents(): CustomComponents
{
    return CustomComponents::make()
       ->addItem('my-index-toolbar-btn');
}
```

Thats it. Now you should see the content of your component in the toolbar.

### Provide extra data

If you want to add extra data (for example a label) to your component (without extra request), just add it to the `addItem` method as second parameter (as array):

```php
public function customIndexToolbarComponents(): CustomComponents
{
    return CustomComponents::make()
       ->addItem('my-index-toolbar-btn', [
           'label' => 'My label'
       ]); 
}
```

### Access resource data

You have access to the ressource class in all methods by using `$this`. On `detail` and `edit` components, you have access to the ID of the current model with `request('id')`. So if you need the model itself in your `customDetailHeaderComponents`, `customDetailToolbarComponents` or your `customUpdateHeaderComponents`, you can query for it like so:

```php
public function customDetailToolbarComponents(): CustomComponents
{
    $model = $this->model()->query()->where('id', request('id'))->first();

    //...
}
```

### Add (tailwind) class to the container

If you want to add additional CSS classes to the container div of a section (for example add `flex w-full justify-end items-center mx-3` to the `customIndexToolbarComponents` section), add the `class` in the `make` function (or use the `setClass` method):

```php
public function customIndexToolbarComponents(): CustomComponents
{
    return CustomComponents::make('flex w-full justify-end items-center mx-3')
       ->addItem('my-index-toolbar-btn'); 
}
```

### Full usage example

```php
use ShuvroRoy\NovaDynamicViews\CustomComponents;

class Resource extends \Laravel\Nova\Resource 
{
    ...

    /**
     * Using the `custom-index-toolbar` placeholder component
     * 
     * @return CustomComponents
     */
    public function customIndexToolbarComponents(): CustomComponents
    {
        return CustomComponents::make('flex w-full justify-end items-center mx-3')
            ->addItem('my-index-toolbar-btn', [
                'title' => 'My first btn'
            ])
            ->addItem('my-index-toolbar-btn', [
                'title' => 'My second btn'
            ]);
    }

    /**
     * Using the `custom-detail-header` placeholder component
     * 
     * @return CustomComponents
     */
    public function customDetailHeaderComponents(): CustomComponents
    {
        $model = $this->model()->query()->where('id', request('id'))->first();
        
        return CustomComponents::make()
           ->addItem('my-other-component', [
                'id' => $model->id,
                'name' => $model->name    
           ]);
    }
}
```


### Use only on specific resources

If you want to show this button only on a specific resource, for example only for Users, just add this method to the `\App\Nova\User` class. 

## Available methods and areas

All `custom-*-*` nova placeholders are available as camel case methods postfixed with `Components`:

- ✅ `customIndexHeaderComponents`
- ✅ `customIndexToolbarComponents`
- ✅ `customDetailHeaderComponents`
- ✅ `customDetailToolbarComponents`
- ✅ `customCreateHeaderComponents`
- ✅ `customAttachHeaderComponents`
- ✅ `customUpdateAttachHeaderComponents`
- ✅ `customUpdateHeaderComponents`
- ✅ `customLensHeaderComponents`

## Create custom component

This is just a kick start documentation for this. For more info, see https://nova.laravel.com/docs/4.0/customization/resource-tools.html

Create a new resource tool with artisan:

```bash
php artisan nova:resource-tool acme/my-index-toolbar-btn
```

and say yes to all questions of the prompt. Now you can use this component (located ad `nova-components/my-index-toolbar-btn`) inside your `customXXXComponents` (f.e. `customIndexToolbarComponents`)

## Credits

- [Shuvro Roy](https://github.com/shuvroroy)
- [Bernhard Hörmann](https://github.com/bernhardh)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
