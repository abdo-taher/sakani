<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\MarketingMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class MarketingMailController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'recipients'   => 'required|array|min:1',
            'recipients.*' => 'required|email',
            'subject'      => 'required|string|max:255',
            'heading'      => 'nullable|string|max:255',
            'body'         => 'required|string',
            'button_text'  => 'nullable|string|max:100',
            'button_url'   => 'nullable|url',
            'footer'       => 'nullable|string|max:500',
        ]);

        $sent = 0;
        $failed = [];

        foreach ($request->recipients as $email) {
            try {
                Mail::to($email)->send(new MarketingMail(
                    mailSubject: $request->subject,
                    heading:   $request->heading ?? $request->subject,
                    body:      $request->body,
                    buttonText: $request->button_text,
                    buttonUrl: $request->button_url,
                    footer:    $request->footer
                ));
                $sent++;
            } catch (\Exception $e) {
                Log::error("Marketing mail failed to {$email}: " . $e->getMessage());
                $failed[] = $email;
            }
        }

        return response()->json([
            'message' => "تم إرسال {$sent} رسائل بنجاح",
            'sent'    => $sent,
            'failed'  => $failed,
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'heading'   => 'nullable|string|max:255',
            'body'      => 'required|string',
            'button_text' => 'nullable|string|max:100',
            'button_url'  => 'nullable|url',
            'footer'    => 'nullable|string|max:500',
        ]);

        $html = view('emails.marketing', [
            'heading'    => $request->heading ?? 'سكني',
            'body'       => $request->body,
            'buttonText' => $request->button_text,
            'buttonUrl'  => $request->button_url,
            'footer'     => $request->footer,
        ])->render();

        return response()->json(['html' => $html]);
    }
}
