<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MarketingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $subject,
        public string $heading,
        public string $body,
        public ?string $buttonText = null,
        public ?string $buttonUrl = null,
        public ?string $footer = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subject);
    }

    public function content(): Content
    {
        return new Content(
            htmlString: view('emails.marketing', [
                'heading'    => $this->heading,
                'body'       => $this->body,
                'buttonText' => $this->buttonText,
                'buttonUrl'  => $this->buttonUrl,
                'footer'     => $this->footer,
            ])->render()
        );
    }
}
