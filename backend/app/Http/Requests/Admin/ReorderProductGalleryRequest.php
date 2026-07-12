<?php

namespace App\Http\Requests\Admin;

use App\Models\ProductMedia;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReorderProductGalleryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'media_ids' => ['required', 'array', 'min:1'],
            'media_ids.*' => ['integer', 'distinct'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $mediaIds = $this->input('media_ids');
            if (! is_array($mediaIds) || $mediaIds === []) {
                return;
            }

            $productId = (int) $this->route('product_id');
            $totalCount = ProductMedia::query()
                ->where('product_id', $productId)
                ->count();
            $count = ProductMedia::query()
                ->where('product_id', $productId)
                ->whereIn('id', $mediaIds)
                ->count();

            if ($count !== count($mediaIds)) {
                $validator->errors()->add('media_ids', 'All media IDs must belong to the selected product.');
            }

            if ($totalCount !== count($mediaIds)) {
                $validator->errors()->add('media_ids', 'Reorder payload must include every gallery image exactly once.');
            }
        });
    }
}
