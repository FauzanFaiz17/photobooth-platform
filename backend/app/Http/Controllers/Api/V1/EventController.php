<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Event\StoreEventRequest;
use App\Http\Requests\Event\UpdateEventRequest;
use App\Http\Resources\Event\EventCollection;
use App\Http\Resources\Event\EventResource;
use App\Models\Event;
use App\Services\EventService;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function __construct(
        protected EventService $eventService
    ) {
        $this->authorizeResource(Event::class, 'event');
    }

    /**
     * Display a listing of events.
     */
    public function index(Request $request)
    {
        $events = $this->eventService->index($request->all());

        return ApiResponse::success(
            new EventCollection($events),
            'Data event berhasil diambil.'
        );
    }

    /**
     * Store a newly created event.
     */
    public function store(StoreEventRequest $request)
    {
        $event = $this->eventService->store(
            $request->validated()
        );

        return ApiResponse::success(
            new EventResource($event),
            'Event berhasil dibuat.',
            201
        );
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event)
    {
        $event = $this->eventService->show($event);

        return ApiResponse::success(
            new EventResource($event),
            'Detail event berhasil diambil.'
        );
    }

    /**
     * Update the specified event.
     */
    public function update(
        UpdateEventRequest $request,
        Event $event
    ) {
        $event = $this->eventService->update(
            $event,
            $request->validated()
        );

        return ApiResponse::success(
            new EventResource($event),
            'Event berhasil diperbarui.'
        );
    }

    /**
     * Remove the specified event.
     */
    public function destroy(Event $event)
    {
        $this->eventService->destroy($event);

        return ApiResponse::success(
            null,
            'Event berhasil dihapus.'
        );
    }
}