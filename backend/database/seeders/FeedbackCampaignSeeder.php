<?php

namespace Database\Seeders;

use App\Models\FeedbackCampaign;
use Illuminate\Database\Seeder;

class FeedbackCampaignSeeder extends Seeder
{
    public function run(): void
    {
        FeedbackCampaign::seedDefaultCampaignsIfEmpty();
    }
}
