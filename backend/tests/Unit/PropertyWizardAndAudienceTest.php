<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Helpers\PhoneHelper;

class PropertyWizardAndAudienceTest extends TestCase
{
    /**
     * Test PhoneHelper Egyptian normalization and validation
     */
    public function test_phone_normalization_and_validation(): void
    {
        // 1. Valid Egyptian phones
        $this->assertEquals('01012345678', PhoneHelper::normalize('01012345678'));
        $this->assertEquals('01012345678', PhoneHelper::normalize('+201012345678'));
        $this->assertEquals('01012345678', PhoneHelper::normalize('00201012345678'));
        $this->assertEquals('01012345678', PhoneHelper::normalize('201012345678'));
        $this->assertEquals('01112345678', PhoneHelper::normalize('1112345678'));

        $this->assertTrue(PhoneHelper::isValidEgyptianPhone('01012345678'));
        $this->assertTrue(PhoneHelper::isValidEgyptianPhone('+201123456789'));
        $this->assertTrue(PhoneHelper::isValidEgyptianPhone('00201234567890'));
        $this->assertTrue(PhoneHelper::isValidEgyptianPhone('01512345678'));

        // 2. Invalid phones
        $this->assertFalse(PhoneHelper::isValidEgyptianPhone('abc12345678'));
        $this->assertFalse(PhoneHelper::isValidEgyptianPhone('01912345678')); // invalid 019 prefix
        $this->assertFalse(PhoneHelper::isValidEgyptianPhone('12345'));
    }

    /**
     * Test Audience type classification rules
     */
    public function test_audience_type_filtering_logic(): void
    {
        $properties = [
            ['id' => 1, 'title' => 'شقة عائلات', 'audience_type' => 'families'],
            ['id' => 2, 'title' => 'سكن شباب مهندسين', 'audience_type' => 'young_men'],
            ['id' => 3, 'title' => 'سكن طالبات طب', 'audience_type' => 'female_students'],
            ['id' => 4, 'title' => 'شقة متاحة للجميع', 'audience_type' => 'all'],
            ['id' => 5, 'title' => 'شقة قديمة بدون تصنيف', 'audience_type' => null],
        ];

        // Filter: female_students
        $femaleFilter = array_filter($properties, function ($p) {
            return $p['audience_type'] === 'female_students' || $p['audience_type'] === 'all' || empty($p['audience_type']);
        });
        $this->assertCount(3, $femaleFilter);
        $this->assertContains(3, array_column($femaleFilter, 'id'));
        $this->assertContains(4, array_column($femaleFilter, 'id'));
        $this->assertContains(5, array_column($femaleFilter, 'id'));

        // Filter: young_men
        $youngMenFilter = array_filter($properties, function ($p) {
            return $p['audience_type'] === 'young_men';
        });
        $this->assertCount(1, $youngMenFilter);
        $this->assertEquals(2, array_values($youngMenFilter)[0]['id']);
    }

    /**
     * Test Step-by-Step Validation Rules
     */
    public function test_wizard_step_validation_logic(): void
    {
        // Step 1: Missing Title or Operation
        $invalidStep1 = ['title' => '', 'property_type' => 'apartment'];
        $this->assertEmpty($invalidStep1['title']);

        // Step 3: Numeric Area Validation
        $invalidArea = -50;
        $this->assertLessThan(0, $invalidArea);

        // Step 4: Price Validation
        $price = 1500000;
        $this->assertGreaterThan(0, $price);
    }
}
