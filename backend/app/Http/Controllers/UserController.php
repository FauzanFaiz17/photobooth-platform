<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UserIndexRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;

class UserController extends Controller
{
    public function __construct(
        protected UserService $service
    ) {}
    /**
     * Display a listing of the resource.
     */
    public function index(UserIndexRequest $request)
    {
        $this->authorize('viewAny', User::class);

        $users = $this->service->index(
            $request->validated(),
            $request->user()
        );

        return UserResource::collection($users);
    }

    
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);

        $user = $this->service->store(
            $request->validated(),
            $request->user()
        );

        return (new UserResource($user))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        $this->authorize('view', $user);

        return new UserResource(
            $this->service->show($user)
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
    UpdateUserRequest $request,
    User $user
)    {
        $this->authorize('update', $user);

        $user = $this->service->update(
            $request->validated(),
            $user,
            $request->user()
        );

        return new UserResource($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
