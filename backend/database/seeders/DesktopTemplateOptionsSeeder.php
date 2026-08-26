<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\FilterSnapshot;
use App\Models\Filter;
use App\Models\Template;
use App\Models\TemplateSnapshot;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DesktopTemplateOptionsSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('TEST_OPERATOR_EMAIL', 'operator@photobooth.test');
        $operator = User::query()->where('email', $email)->firstOrFail();

        if (! $operator->partner_id) {
            throw new \RuntimeException("Operator {$email} is not assigned to a partner.");
        }

        $event = Event::query()
            ->where('partner_id', $operator->partner_id)
            ->where('event_code', env('TEST_EVENT_CODE', DesktopDemoSeeder::EVENT_CODE))
            ->firstOrFail();

        $definitions = [
            ['name' => '2R Classic Grid', 'paper_size' => '2r', 'layout' => 'grid', 'frames' => $this->gridFrames(1200, 1800)],
            ['name' => '2R Portrait Duo', 'paper_size' => '2r', 'layout' => 'strip', 'frames' => $this->verticalFrames(1200, 1800, 2)],
            ['name' => '2R Fun Strip', 'paper_size' => '2r', 'layout' => 'strip', 'frames' => $this->verticalFrames(1200, 1800, 4)],
            ['name' => '4R Classic Four', 'paper_size' => '4r', 'layout' => 'grid', 'frames' => $this->gridFrames(1200, 1800)],
            ['name' => '4R Portrait Three', 'paper_size' => '4r', 'layout' => 'strip', 'frames' => $this->verticalFrames(1200, 1800, 3)],
            ['name' => '4R Wide Duo', 'paper_size' => '4r', 'layout' => 'grid', 'frames' => $this->horizontalFrames(1200, 1800, 2)],
        ];

        DB::transaction(function () use ($definitions, $event, $operator) {
            $snapshotIds = [];

            foreach ($definitions as $definition) {
                $template = Template::query()->updateOrCreate(
                    ['partner_id' => $operator->partner_id, 'name' => $definition['name']],
                    [
                        'paper_size' => $definition['paper_size'],
                        'preview_path' => null,
                        'thumbnail_path' => null,
                        'json_layout' => [
                            'layout' => $definition['layout'],
                            'canvas' => ['width' => 1200, 'height' => 1800, 'background' => '#ffffff'],
                            'frames' => $definition['frames'],
                        ],
                        'psd_path' => null,
                        'png_path' => null,
                        'version' => 1,
                        'status' => 'published',
                    ]
                );

                $snapshotIds[] = TemplateSnapshot::query()->firstOrCreate(
                    ['template_id' => $template->id, 'version' => $template->version],
                    [
                        'name' => $template->name,
                        'paper_size' => $template->paper_size,
                        'preview_path' => $template->preview_path,
                        'thumbnail_path' => $template->thumbnail_path,
                        'json_layout' => $template->json_layout,
                        'psd_path' => $template->psd_path,
                        'png_path' => $template->png_path,
                    ]
                )->id;
            }

            $event->templateSnapshots()->sync(collect($snapshotIds)->mapWithKeys(
                fn (int $id, int $order) => [$id => ['sort_order' => $order, 'is_default' => $order === 0]]
            )->all());

            $event->update(['template_snapshot_id' => $snapshotIds[0]]);

            $filterDefinitions = [
                ['name' => 'Natural', 'brightness' => 0, 'contrast' => 0, 'saturation' => 0, 'white_balance' => 0],
                ['name' => 'Warm', 'brightness' => 5, 'contrast' => 4, 'saturation' => 12, 'white_balance' => 8],
                ['name' => 'Cool', 'brightness' => 2, 'contrast' => 5, 'saturation' => -5, 'white_balance' => -10],
                ['name' => 'Black & White', 'brightness' => 0, 'contrast' => 15, 'saturation' => -100, 'white_balance' => 0],
            ];
            $filterSnapshotIds = [];
            foreach ($filterDefinitions as $definition) {
                $filter = Filter::query()->updateOrCreate(['partner_id' => $operator->partner_id, 'name' => $definition['name']], array_merge($definition, ['lut_path' => null, 'sharpness' => 0, 'intensity' => 100, 'version' => 1, 'is_active' => true]));
                $filterSnapshotIds[] = FilterSnapshot::query()->firstOrCreate(['filter_id' => $filter->id, 'version' => 1], array_merge($definition, ['lut_path' => null, 'sharpness' => 0, 'intensity' => 100]))->id;
            }
            $event->filterSnapshots()->sync(collect($filterSnapshotIds)->mapWithKeys(fn (int $id, int $order) => [$id => ['sort_order' => $order, 'is_default' => $order === 0]])->all());
            $event->update(['filter_snapshot_id' => $filterSnapshotIds[0]]);

            $event->printOptions()->delete();
            $event->printOptions()->createMany([
                ['paper_size' => '2r', 'unit_quantity' => 2, 'quantity_step' => 2, 'price' => 35000, 'is_active' => true],
                ['paper_size' => '4r', 'unit_quantity' => 1, 'quantity_step' => 1, 'price' => 35000, 'is_active' => true],
            ]);
        });

        $this->command?->info('Desktop template options seeded successfully.');
        $this->command?->line("Operator: {$operator->email}");
        $this->command?->line("Partner ID: {$operator->partner_id} | Event: {$event->event_code}");
        $this->command?->line('Templates: 3 x 2R, 3 x 4R');
    }

    private function gridFrames(int $width, int $height): array
    {
        return [
            ['x' => 60, 'y' => 60, 'width' => 510, 'height' => 795],
            ['x' => 630, 'y' => 60, 'width' => 510, 'height' => 795],
            ['x' => 60, 'y' => 945, 'width' => 510, 'height' => 795],
            ['x' => 630, 'y' => 945, 'width' => 510, 'height' => 795],
        ];
    }

    private function verticalFrames(int $width, int $height, int $count): array
    {
        $gap = 40;
        $frameHeight = (int) (($height - (($count + 1) * $gap)) / $count);

        return collect(range(0, $count - 1))->map(fn (int $index) => [
            'x' => 80,
            'y' => $gap + ($index * ($frameHeight + $gap)),
            'width' => $width - 160,
            'height' => $frameHeight,
        ])->all();
    }

    private function horizontalFrames(int $width, int $height, int $count): array
    {
        $gap = 60;
        $frameHeight = (int) (($height - (($count + 1) * $gap)) / $count);

        return collect(range(0, $count - 1))->map(fn (int $index) => [
            'x' => 60,
            'y' => $gap + ($index * ($frameHeight + $gap)),
            'width' => $width - 120,
            'height' => $frameHeight,
        ])->all();
    }
}
