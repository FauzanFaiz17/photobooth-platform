<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Configuration\ConfigurationIndexRequest;
use App\Http\Requests\Configuration\TemplateRequest;
use App\Http\Resources\TemplateResource;
use App\Models\Template;
use App\Services\Configuration\TemplateService;
use App\Support\ApiResponse;

class TemplateController extends Controller
{
    public function __construct(protected TemplateService $service) {}

    public function index(ConfigurationIndexRequest $request)
    {
        $this->authorize('viewAny', Template::class);

        return TemplateResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function store(TemplateRequest $request)
    {
        $this->authorize('create', Template::class);

        return (new TemplateResource(
            $this->service->store($request->validated(), $request->user())
        ))->response()->setStatusCode(201);
    }

    public function show(Template $template)
    {
        $this->authorize('view', $template);

        return new TemplateResource($this->service->show($template));
    }

    public function update(TemplateRequest $request, Template $template)
    {
        $this->authorize('update', $template);

        return new TemplateResource(
            $this->service->update(
                $template,
                $request->validated(),
                $request->user()
            )
        );
    }

    public function destroy(Template $template)
    {
        $this->authorize('delete', $template);
        $this->service->destroy($template);

        return ApiResponse::success(null, 'Template deleted successfully.');
    }
}
