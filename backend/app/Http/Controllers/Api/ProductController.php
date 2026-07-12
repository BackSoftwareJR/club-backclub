<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(int $clubId): JsonResponse
    {
        $products = Product::query()
            ->where('club_id', $clubId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => ProductResource::collection($products),
        ]);
    }
}
