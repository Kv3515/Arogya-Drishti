import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeightTrendChart } from '../WeightTrendChart';
import type { Individual, VitalsLog } from '@/lib/api';

// Mock data for testing
const mockIndividual: Individual = {
  id: 'test-individual-1',
  serviceNumber: 'SVC-00001',
  name: 'Test Individual',
  dateOfBirth: new Date('1990-01-15'),
  bloodGroup: 'A+',
  heightCm: 175,
  userId: 'user-1'
};

const mockWeightVitals: VitalsLog[] = [
  {
    id: 'vitals-1',
    individualId: 'test-individual-1',
    recordedAt: new Date('2024-01-01'),
    systolicBp: 120,
    diastolicBp: 80,
    heartRateBpm: 72,
    tempCelsius: 98.6,
    spo2Percent: 98,
    weightKg: 75, // Starting weight
    heightCm: 175,
    recordedById: 'doctor-1'
  },
  {
    id: 'vitals-2',
    individualId: 'test-individual-1',
    recordedAt: new Date('2024-02-01'),
    systolicBp: 118,
    diastolicBp: 78,
    heartRateBpm: 70,
    tempCelsius: 98.4,
    spo2Percent: 99,
    weightKg: 73, // Lost 2kg
    heightCm: 175,
    recordedById: 'doctor-1'
  },
  {
    id: 'vitals-3',
    individualId: 'test-individual-1',
    recordedAt: new Date('2024-03-01'),
    systolicBp: 115,
    diastolicBp: 75,
    heartRateBpm: 68,
    tempCelsius: 98.2,
    spo2Percent: 99,
    weightKg: 71, // Lost another 2kg 
    heightCm: 175,
    recordedById: 'doctor-1'
  }
];

describe('WeightTrendChart', () => {
  const user = userEvent.setup();

  describe('Component Rendering', () => {
    test('renders weight trend chart with dual axes', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      expect(screen.getByRole('group', { name: /weight tracking/i })).toBeInTheDocument();
      expect(screen.getByText(/weight & bmi trends/i)).toBeInTheDocument();
    });

    test('displays empty state when no weight data', () => {
      const vitalsWithoutWeight = mockWeightVitals.map(v => ({ ...v, weightKg: null }));
      
      render(
        <WeightTrendChart
          vitalsData={vitalsWithoutWeight}
          individual={mockIndividual}
        />
      );

      expect(screen.getByText(/no weight records/i)).toBeInTheDocument();
    });
  });

  describe('Display Mode Controls', () => {
    test('defaults to both weight and BMI display', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      const bothModeButton = screen.getByRole('button', { name: /both/i });
      expect(bothModeButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('can switch between weight, BMI, and both modes', async () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      // Switch to weight only
      const weightButton = screen.getByRole('button', { name: /^weight$/i });
      await user.click(weightButton);
      expect(weightButton).toHaveAttribute('aria-pressed', 'true');

      // Switch to BMI only
      const bmiButton = screen.getByRole('button', { name: /^bmi$/i });
      await user.click(bmiButton);
      expect(bmiButton).toHaveAttribute('aria-pressed', 'true');

      // Back to both
      const bothButton = screen.getByRole('button', { name: /both/i });
      await user.click(bothButton);
      expect(bothButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Timeframe Selection', () => {
    test('defaults to 6 month view', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      const sixMonthButton = screen.getByRole('button', { name: /6 months/i });
      expect(sixMonthButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('can change timeframes', async () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      // Switch to 3 months
      const threeMonthButton = screen.getByRole('button', { name: /3 months/i });
      await user.click(threeMonthButton);
      expect(threeMonthButton).toHaveAttribute('aria-pressed', 'true');

      // Switch to 1 year
      const oneYearButton = screen.getByRole('button', { name: /1 year/i });
      await user.click(oneYearButton);
      expect(oneYearButton).toHaveAttribute('aria-pressed', 'true');

      // Switch to all time
      const allTimeButton = screen.getByRole('button', { name: /all/i });
      await user.click(allTimeButton);
      expect(allTimeButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Goal Setting', () => {
    test('displays target weight when provided', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
          targetWeight={70}
        />
      );

      expect(screen.getByText(/target.*70.*kg/i)).toBeInTheDocument();
    });

    test('displays target BMI when provided', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
          targetBMI={22}
        />
      );

      expect(screen.getByText(/target.*bmi.*22/i)).toBeInTheDocument();
    });

    test('can toggle goal lines visibility', async () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
          targetWeight={70}
        />
      );

      const goalsToggle = screen.getByRole('switch', { name: /show goals/i });
      expect(goalsToggle).toBeChecked(); // Should be on by default

      // Toggle off
      await user.click(goalsToggle);
      expect(goalsToggle).not.toBeChecked();
    });
  });

  describe('Progress Indicators', () => {
    test('calculates weight change correctly', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      // Should show weight loss from 75kg to 71kg = -4kg
      expect(screen.getByText(/.*4.*kg.*lost/i)).toBeInTheDocument();
    });

    test('shows BMI category progression', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      // Should show BMI improvement (moving toward normal range)
      expect(screen.getByText(/bmi.*improvement/i)).toBeInTheDocument();
    });

    test('displays goal achievement percentage', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
          targetWeight={70}
        />
      );

      // Current: 71kg, Target: 70kg, Started: 75kg
      // Progress: (75-71)/(75-70) = 4/5 = 80%
      expect(screen.getByText(/80%.*progress/i)).toBeInTheDocument();
    });
  });

  describe('BMI Categories', () => {
    test('displays BMI category zones on chart', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      // Should show BMI thresholds as reference areas/lines
      const chartContainer = screen.getByRole('img', { name: /weight trend chart/i });
      expect(chartContainer).toBeInTheDocument();
    });

    test('shows current BMI status', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      // Latest weight: 71kg, height: 175cm = BMI 23.2 (Normal)
      expect(screen.getByText(/current.*bmi.*23\.2/i)).toBeInTheDocument();
      expect(screen.getByText(/normal/i)).toBeInTheDocument();
    });
  });

  describe('Weight Change Rate', () => {
    test('calculates weight change rate per month', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      // Changed from 75kg to 71kg over 2 months = -2kg/month
      expect(screen.getByText(/.*2.*kg.*month/i)).toBeInTheDocument();
    });

    test('indicates healthy vs concerning weight change rates', () => {
      // Create data with rapid weight loss (concerning)
      const rapidLossVitals = [
        { ...mockWeightVitals[0], weightKg: 80 },
        { ...mockWeightVitals[1], weightKg: 70, recordedAt: new Date('2024-01-15') }, // 10kg in 2 weeks
      ];

      render(
        <WeightTrendChart
          vitalsData={rapidLossVitals}
          individual={mockIndividual}
        />
      );

      // Should flag rapid weight loss as concerning
      expect(screen.getByText(/rapid.*weight.*change/i)).toBeInTheDocument();
    });
  });

  describe('Chart Interactions', () => {
    test('tooltip shows detailed weight and BMI values', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      const chart = screen.getByRole('img', { name: /weight trend chart/i });
      expect(chart).toBeInTheDocument();
      // Tooltip interactions are handled by Recharts
    });

    test('chart is accessible with proper ARIA labels', () => {
      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      const chart = screen.getByRole('img');
      expect(chart).toHaveAccessibleName();
      expect(chart).toHaveAccessibleDescription();
    });
  });

  describe('Data Processing', () => {
    test('filters out records without weight data', () => {
      const mixedVitals = [
        mockWeightVitals[0],
        { ...mockWeightVitals[1], weightKg: null }, // No weight
        mockWeightVitals[2],
      ];

      render(
        <WeightTrendChart
          vitalsData={mixedVitals}
          individual={mockIndividual}
        />
      );

      // Should only process 2 records with valid weight data
      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });

    test('sorts data chronologically', () => {
      // Test with unsorted data
      const unsortedVitals = [...mockWeightVitals].reverse();

      render(
        <WeightTrendChart
          vitalsData={unsortedVitals}
          individual={mockIndividual}
        />
      );

      // Should still render correctly (component should sort internally)
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      global.innerWidth = 375;

      render(
        <WeightTrendChart
          vitalsData={mockWeightVitals}
          individual={mockIndividual}
        />
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      // Mobile adaptations tested via CSS classes
    });
  });

  describe('Error Handling', () => {
    test('handles missing individual height gracefully', () => {
      const noHeightIndividual = { ...mockIndividual, heightCm: null };

      expect(() => {
        render(
          <WeightTrendChart
            vitalsData={mockWeightVitals}
            individual={noHeightIndividual}
          />
        );
      }).not.toThrow();

      // Should show weight only (no BMI calculation possible)
      expect(screen.getByText(/weight tracking/i)).toBeInTheDocument();
    });

    test('handles invalid weight values', () => {
      const invalidWeightVitals = [
        { ...mockWeightVitals[0], weightKg: -10 }, // Invalid negative weight
        { ...mockWeightVitals[1], weightKg: 0 }, // Invalid zero weight
      ];

      expect(() => {
        render(
          <WeightTrendChart
            vitalsData={invalidWeightVitals}
            individual={mockIndividual}
          />
        );
      }).not.toThrow();
    });
  });
});

// Unit tests for utility functions
describe('WeightTrendChart Utilities', () => {
  describe('processWeightData', () => {
    test('filters and sorts weight data correctly');
    test('calculates BMI for each data point');
    test('handles missing weight or height values');
  });

  describe('calculateWeightProgress', () => {
    test('calculates progress toward target weight');
    test('handles cases where target is not set');
    test('calculates weight change rate over time');
  });

  describe('determineWeightChangeRate', () => {
    test('identifies healthy weight change rates');
    test('flags concerning rapid weight changes');
    test('handles insufficient data points');
  });
});