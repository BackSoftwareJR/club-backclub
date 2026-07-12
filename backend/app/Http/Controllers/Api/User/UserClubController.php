<?php

namespace App\Http\Controllers\Api\User;

use App\Exceptions\ForbiddenApiException;
use App\Http\Controllers\Controller;
use App\Http\Concerns\ResolvesJwtContext;
use App\Http\Requests\User\CreateClubRequest;
use App\Services\Club\ClubService;
use App\Services\Compliance\ActivityLogService;
use App\Services\Compliance\LegalTermsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserClubController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly ClubService $clubService,
        private readonly LegalTermsService $legalTermsService,
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $this->authUser($request);
        $currentClubId = $this->jwtClubId($request);

        return response()->json([
            'current_club_id' => $currentClubId,
            'clubs' => $this->clubService->listClubsForUser($user, $currentClubId),
        ]);
    }

    public function store(CreateClubRequest $request): JsonResponse
    {
        $user = $this->authUser($request);
        $validated = $request->validated();

        if ($validated['terms_version'] !== $this->legalTermsService->currentVersion()) {
            throw new ForbiddenApiException('Terms version mismatch. Reload and accept the current terms.');
        }

        $result = $this->clubService->createClubForOwner($user, $validated['name']);
        $club = $result['club'];
        $member = $result['member'];

        $this->legalTermsService->accept($user, $club->id, $request, $validated['terms_version']);

        $this->activityLogService->record(
            eventType: 'club_created',
            member: $member,
            request: $request,
            metadata: ['club_name' => $club->name],
        );

        $this->activityLogService->record(
            eventType: 'terms_accepted',
            member: $member,
            request: $request,
            metadata: array_merge(
                [
                    'terms_version' => $validated['terms_version'],
                    'context' => 'club_creation',
                ],
                $this->legalTermsService->identityDeclarationMetadata('club_creation'),
            ),
        );

        return response()->json([
            'club' => [
                'id' => $club->id,
                'name' => $club->name,
                'theme_config' => $club->resolvedThemeConfig(),
            ],
            'nfc_uid' => $result['nfc_uid'],
            'requires_pin_setup' => $member->requiresPinSetup(),
            'entry_path' => sprintf('/entry/%d/%s', $club->id, $member->nfc_uid),
        ], 201);
    }
}
