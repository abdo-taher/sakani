<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background-color:#F7F1E8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F1E8;">
<tr><td align="center" style="padding:40px 20px;">

<!-- Main Card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(43,27,18,0.10);">

<!-- Header -->
<tr>
<td style="background-color:#2B1B12;padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#B08D57;font-size:28px;font-weight:800;letter-spacing:1px;">سكني</h1>
    <p style="margin:6px 0 0;color:#F7F1E8CC;font-size:13px;">شريكك العقاري في دمياط الجديدة</p>
</td>
</tr>

<!-- Heading -->
<tr>
<td style="padding:36px 40px 16px;text-align:center;">
    <h2 style="margin:0;color:#2B1B12;font-size:22px;font-weight:700;line-height:1.5;">{{ $heading }}</h2>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:0 40px 28px;">
    <div style="color:#4A2E1F;font-size:15px;line-height:1.8;text-align:center;white-space:pre-line;">{{ $body }}</div>
</td>
</tr>

@if($buttonText && $buttonUrl)
<!-- Button -->
<tr>
<td style="padding:0 40px 32px;text-align:center;">
    <a href="{{ $buttonUrl }}" style="display:inline-block;background-color:#B08D57;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:50px;">{{ $buttonText }}</a>
</td>
</tr>
@endif

<!-- Divider -->
<tr>
<td style="padding:0 40px;">
    <hr style="border:none;border-top:1px solid #E4D9C9;margin:0;">
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:24px 40px 32px;text-align:center;">
    <p style="margin:0 0 8px;color:#B08D57;font-size:13px;font-weight:600;">سكني — عقاراتك في دمياط الجديدة</p>
    @if($footer)
    <p style="margin:0;color:#8C7A6B;font-size:12px;line-height:1.6;">{{ $footer }}</p>
    @endif
    <p style="margin:12px 0 0;color:#B8AFA3;font-size:11px;">تم إرسال هذه الرسالة من منصة سكني</p>
</td>
</tr>

</table>
<!-- /Main Card -->

</td></tr>
</table>

</body>
</html>
