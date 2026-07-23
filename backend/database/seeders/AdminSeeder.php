<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'username' => 'SakaniAdmin2026',
            'password' => Hash::make('Password@123@sakani'),
            'role' => 'admin',
        ]);
    }
}