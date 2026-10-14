<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeacherProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class TeacherKycDocumentController extends Controller
{
    /**
     * Stream or download a sensitive teacher KYC document securely.
     * Accessible via a cryptographically signed temporary URL OR an authenticated admin/owner session.
     */
    public function show(Request $request, TeacherProfile $profile, string $type): Response
    {
        // 1. التحقق الصارم من الأمان: توقيع رقمي صالح (Signed URL) أو جلسة مدير موثقة (Authenticated Admin) أو صاحب الملف نفسه
        $hasValidSignature = $request->hasValidSignature();
        $isAdmin = auth()->check() && (
            (method_exists(auth()->user(), 'hasRole') && auth()->user()->hasRole('admin'))
            || (property_exists(auth()->user(), 'role') && auth()->user()->role === 'admin')
        );
        $isOwner = auth()->check() && (int) auth()->id() === (int) $profile->user_id;

        if (! $hasValidSignature && ! $isAdmin && ! $isOwner) {
            abort(403, 'غير مصرح بالوصول إلى هذا المستند الحساس. الرابط غير صالح أو انتهت صلاحيته.');
        }

        // 2. التحقق من نوع المستند المطلوب
        if (! in_array($type, ['national_id', 'degree'], true)) {
            abort(404, 'نوع المستند غير مدعوم.');
        }

        $path = $type === 'national_id' ? $profile->national_id_path : $profile->degree_path;

        if (! $path) {
            abort(404, 'لم يتم تسجيل مسار لهذا المستند في ملف المعلم.');
        }

        // 3. التحقق من وجود الملف في وحدة التخزين (قرص kyc الخاص أو القرص الافتراضي كـ fallback)
        $diskName = config('filesystems.kyc_disk', 'kyc');
        $disk = Storage::disk($diskName);

        if (! $disk->exists($path)) {
            $fallbackDisk = Storage::disk(config('filesystems.default', 'public'));
            if ($fallbackDisk->exists($path)) {
                $disk = $fallbackDisk;
            } else {
                abort(404, 'الملف المطلوب غير موجود في وحدة التخزين الخاصة بالنظام.');
            }
        }

        $filename = basename($path);

        // 4. خيار التحميل المباشر للملف (Force Download)
        if ($request->boolean('download')) {
            return $disk->download($path, $filename, [
                'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
            ]);
        }

        // 5. البث المباشر المضمن (Inline Response للمعاينة في المتصفح والـ Modal)
        return $disk->response($path, $filename, [
            'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
