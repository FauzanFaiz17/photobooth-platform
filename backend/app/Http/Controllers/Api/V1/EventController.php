<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Event\EventIndexRequest;
use App\Http\Requests\Event\StoreEventRequest;
use App\Http\Requests\Event\UpdateEventRequest;
use App\Http\Resources\Event\EventResource;
use App\Models\Event;
use App\Services\EventService;
use App\Support\ApiResponse;

class EventController extends Controller
{
    public function __construct(protected EventService $eventService) {}

    public function index(EventIndexRequest $request)
    {
        $this->authorize('viewAny', Event::class);

        return EventResource::collection(
            $this->eventService->index(
                $request->validated(),
                $request->user()
            )
        );
    }

    public function store(StoreEventRequest $request)
    {
        $this->authorize('create', Event::class);

        return (new EventResource(
            $this->eventService->store(
                $request->validated(),
                $request->user()
            )
        ))->response()->setStatusCode(201);
    }

    public function show(Event $event)
    {
        $this->authorize('view', $event);

        return new EventResource($this->eventService->show($event));
    }

    public function update(UpdateEventRequest $request, Event $event)
    {
        $this->authorize('update', $event);

        return new EventResource(
            $this->eventService->update($event, $request->validated())
        );
    }

    public function destroy(Event $event)
    {
        $this->authorize('delete', $event);
        $this->eventService->destroy($event);

        return ApiResponse::success(null, 'Event deleted successfully.');
    }
}
