<?php

namespace App\Services\Configuration;

use App\Contracts\MediaStorage;
use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TemplateService extends TenantConfigurationService
{
    protected string $modelClass = Template::class;

    public function __construct(protected MediaStorage $storage) {}

    public function store(array $data, User $user): Template
    {
        $image = $data['image'] ?? null;
        unset($data['image']);

        if ($image instanceof UploadedFile) {
            $data['png_path'] = $this->uploadPng($image);
        }

        return parent::store($data, $user);
    }

    public function update(Template|Model $template, array $data, User $user): Template
    {
        $image = $data['image'] ?? null;
        unset($data['image']);
        $oldPath = $template->png_path;

        if ($image instanceof UploadedFile) {
            $data['png_path'] = $this->uploadPng($image);
        }

        $updated = parent::update($template, $data, $user);

        if ($image instanceof UploadedFile && $oldPath && $oldPath !== $updated->png_path) {
            $this->storage->delete($oldPath);
        }

        return $updated;
    }

    public function destroy(Model $template): void
    {
        $path = $template->png_path;
        parent::destroy($template);

        if ($path) {
            $this->storage->delete($path);
        }
    }

    public function uploadAsset(Template $template, UploadedFile $file, string $type): Template
    {
        $column = $type.'_path';
        $oldPath = $template->{$column};
        $path = $this->uploadAssetFile($file, $type);

        $template->update([$column => $path, 'version' => $template->version + 1]);

        if ($oldPath && $oldPath !== $path) {
            $this->storage->delete($oldPath);
        }

        return $template->fresh()->load('partner');
    }

    private function uploadPng(UploadedFile $image): string
    {
        return $this->uploadAssetFile($image, 'png');
    }

    private function uploadAssetFile(UploadedFile $image, string $type): string
    {
        $path = 'template/'.$type.'/'.Str::uuid().'.png';
        $contents = file_get_contents($image->getRealPath());

        if ($contents === false || ! $this->storage->put($path, $contents)) {
            throw ValidationException::withMessages(['image' => 'Template PNG could not be stored.']);
        }

        return $path;
    }

    protected function applyDomainFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
    }
}
