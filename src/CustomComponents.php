<?php

namespace ShuvroRoy\NovaDynamicViews;

class CustomComponents implements \JsonSerializable
{
    protected string $class;
    
    protected array $items = [];
    
    public static function make(string $class = ''): static
    {
        $obj = new static();
        $obj->class = $class;
        
        return $obj;
    }

    public function addItem(string $name, array $meta = []): static
    {
        $item = ['name'=> $name];
        if($meta) {
            $item['meta'] = $meta;
        }
        
        $this->items[] = $item;
        
        return $this;
    }

    public function setClass(string $class): static
    {
        $this->class = $class;
        
        return $this;
    }

    public function jsonSerialize(): array
    {
        return array_filter([
            'class' => $this->class,
            'items' => $this->items
        ]);
    }
}
