<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Filter;
use App\Models\FilterSnapshot;
use App\Models\Template;
use App\Models\TemplateSnapshot;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class DesktopTemplateOptionsSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DesktopDemoSeeder::class);

        $email = env('TEST_OPERATOR_EMAIL', 'operator@photobooth.test');
        $operator = User::query()->where('email', $email)->firstOrFail();
        $event = Event::query()
            ->where('partner_id', $operator->partner_id)
            ->where('event_code', env('TEST_EVENT_CODE', DesktopDemoSeeder::EVENT_CODE))
            ->firstOrFail();
        $assetRoot = realpath(base_path('../shared'));

        if (! $assetRoot) {
            throw new RuntimeException('Folder shared tidak ditemukan.');
        }

        $definitions = $this->templateDefinitions($assetRoot);

        DB::transaction(function () use ($definitions, $event, $operator): void {
            $snapshotIds = [];

            foreach ($definitions as $definition) {
                $storagePath = 'templates/desktop-test/'.$definition['paper_size'].'/'.$definition['filename'];
                Storage::disk('public')->put($storagePath, file_get_contents($definition['source_path']));

                $template = Template::query()->updateOrCreate(
                    [
                        'partner_id' => $operator->partner_id,
                        'name' => $definition['name'],
                    ],
                    [
                        'paper_size' => $definition['paper_size'],
                        'preview_path' => $storagePath,
                        'thumbnail_path' => $storagePath,
                        'json_layout' => [
                            'layout' => count($definition['frames']) > 2 ? 'grid' : 'strip',
                            'canvas' => [
                                'width' => $definition['width'],
                                'height' => $definition['height'],
                                'background' => '#ffffff',
                            ],
                            'frames' => $definition['frames'],
                        ],
                        'psd_path' => null,
                        'png_path' => $storagePath,
                        'version' => 1,
                        'status' => 'published',
                    ]
                );

                $snapshot = TemplateSnapshot::query()->updateOrCreate(
                    ['template_id' => $template->id, 'version' => $template->version],
                    [
                        'name' => $template->name,
                        'paper_size' => $template->paper_size,
                        'preview_path' => $template->preview_path,
                        'thumbnail_path' => $template->thumbnail_path,
                        'json_layout' => $template->json_layout,
                        'psd_path' => null,
                        'png_path' => $template->png_path,
                        'created_at' => now(),
                    ]
                );
                $snapshotIds[] = $snapshot->id;
            }

            $event->templateSnapshots()->sync(collect($snapshotIds)->mapWithKeys(
                fn (int $id, int $order) => [$id => ['sort_order' => $order, 'is_default' => $order === 0]]
            )->all());
            $event->update(['template_snapshot_id' => $snapshotIds[0]]);

            $this->seedFilters($event, $operator->partner_id);
            $event->printOptions()->delete();
            $event->printOptions()->createMany([
                ['paper_size' => '2r', 'unit_quantity' => 2, 'quantity_step' => 2, 'price' => 35000, 'is_active' => true],
                ['paper_size' => '4r', 'unit_quantity' => 1, 'quantity_step' => 1, 'price' => 35000, 'is_active' => true],
            ]);
        });

        $twoR = collect($definitions)->where('paper_size', '2r')->count();
        $fourR = collect($definitions)->where('paper_size', '4r')->count();
        $this->command?->info('Shared desktop templates seeded successfully.');
        $this->command?->line("Operator: {$operator->email} | Event: {$event->event_code}");
        $this->command?->line("Templates: {$twoR} x 2R, {$fourR} x 4R");
    }

    private function templateDefinitions(string $assetRoot): array
    {
        $definitions = [];

        foreach (['2R' => '2r', '4R' => '4r'] as $folder => $paperSize) {
            foreach (glob($assetRoot.DIRECTORY_SEPARATOR.$folder.DIRECTORY_SEPARATOR.'*.png') ?: [] as $sourcePath) {
                [$width, $height, $frames] = $this->detectTransparentFrames($sourcePath);
                $filename = Str::slug(pathinfo($sourcePath, PATHINFO_FILENAME)).'.png';
                $definitions[] = [
                    'name' => 'Shared '.$folder.' - '.pathinfo($sourcePath, PATHINFO_FILENAME),
                    'paper_size' => $paperSize,
                    'filename' => $filename,
                    'source_path' => $sourcePath,
                    'width' => $width,
                    'height' => $height,
                    'frames' => $frames,
                ];
            }
        }

        if ($definitions === []) {
            throw new RuntimeException('Tidak ada PNG template di folder shared/2R atau shared/4R.');
        }

        return $definitions;
    }

    private function detectTransparentFrames(string $path): array
    {
        $image = imagecreatefrompng($path);
        if (! $image) {
            throw new RuntimeException("Template tidak dapat dibaca: {$path}");
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $step = 4;
        $gridWidth = (int) ceil($width / $step);
        $gridHeight = (int) ceil($height / $step);
        $transparent = [];

        for ($gridY = 0; $gridY < $gridHeight; $gridY++) {
            for ($gridX = 0; $gridX < $gridWidth; $gridX++) {
                $color = imagecolorat($image, min($width - 1, $gridX * $step), min($height - 1, $gridY * $step));
                if ((($color >> 24) & 0x7F) >= 100) {
                    $transparent[$gridY * $gridWidth + $gridX] = true;
                }
            }
        }
        imagedestroy($image);

        $frames = [];
        while ($transparent !== []) {
            $first = array_key_first($transparent);
            unset($transparent[$first]);
            $queue = [$first];
            $minX = $maxX = $first % $gridWidth;
            $minY = $maxY = intdiv($first, $gridWidth);
            $count = 0;

            while ($queue !== []) {
                $cell = array_pop($queue);
                $x = $cell % $gridWidth;
                $y = intdiv($cell, $gridWidth);
                $count++;
                $minX = min($minX, $x);
                $maxX = max($maxX, $x);
                $minY = min($minY, $y);
                $maxY = max($maxY, $y);

                foreach ([[$x - 1, $y], [$x + 1, $y], [$x, $y - 1], [$x, $y + 1]] as [$nextX, $nextY]) {
                    if ($nextX < 0 || $nextY < 0 || $nextX >= $gridWidth || $nextY >= $gridHeight) {
                        continue;
                    }
                    $next = $nextY * $gridWidth + $nextX;
                    if (isset($transparent[$next])) {
                        unset($transparent[$next]);
                        $queue[] = $next;
                    }
                }
            }

            $frameWidth = min($width, ($maxX + 1) * $step) - $minX * $step;
            $frameHeight = min($height, ($maxY + 1) * $step) - $minY * $step;
            if ($count * $step * $step >= $width * $height * 0.015) {
                $frames[] = [
                    'x' => $minX * $step,
                    'y' => $minY * $step,
                    'width' => $frameWidth,
                    'height' => $frameHeight,
                ];
            }
        }

        usort($frames, fn (array $left, array $right) => [$left['y'], $left['x']] <=> [$right['y'], $right['x']]);

        if ($frames === []) {
            $frames = [['x' => 60, 'y' => 60, 'width' => $width - 120, 'height' => $height - 120]];
        }

        return [$width, $height, $frames];
    }

    private function seedFilters(Event $event, int $partnerId): void
    {
        $definitions = [
            ['name' => 'Natural', 'brightness' => 0, 'contrast' => 0, 'saturation' => 0, 'white_balance' => 0],
            ['name' => 'Warm', 'brightness' => 5, 'contrast' => 4, 'saturation' => 12, 'white_balance' => 8],
            ['name' => 'Cool', 'brightness' => 2, 'contrast' => 5, 'saturation' => -5, 'white_balance' => -10],
            ['name' => 'Black & White', 'brightness' => 0, 'contrast' => 15, 'saturation' => -100, 'white_balance' => 0],
        ];
        $snapshotIds = [];

        foreach ($definitions as $definition) {
            $filter = Filter::query()->updateOrCreate(
                ['partner_id' => $partnerId, 'name' => $definition['name']],
                array_merge($definition, ['lut_path' => null, 'sharpness' => 0, 'intensity' => 100, 'version' => 1, 'is_active' => true])
            );
            $snapshotIds[] = FilterSnapshot::query()->updateOrCreate(
                ['filter_id' => $filter->id, 'version' => 1],
                array_merge($definition, ['lut_path' => null, 'sharpness' => 0, 'intensity' => 100])
            )->id;
        }

        $event->filterSnapshots()->sync(collect($snapshotIds)->mapWithKeys(
            fn (int $id, int $order) => [$id => ['sort_order' => $order, 'is_default' => $order === 0]]
        )->all());
        $event->update(['filter_snapshot_id' => $snapshotIds[0]]);
    }
}
