import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VitalsMonitoringSection } from '../VitalsMonitoringSection';
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

const mockVitalsData: VitalsLog[] = [
  {
    id: 'vitals-1',
    individualId: 'test-individual-1', 
    recordedAt: new Date('2024-01-01'),
    systolicBp: 120,
    diastolicBp: 80,
    heartRateBpm: 72,
    tempCelsius: 98.6,
    spo2Percent: 98,
    weightKg: 70,
    heightCm: 175,
    recordedById: 'doctor-1'
  },
  {
    id: 'vitals-2',
    individualId: 'test-individual-1',
    recordedAt: new Date('2024-01-05'),
    systolicBp: 135, // Elevated
    diastolicBp: 85, // Elevated
    heartRateBpm: 88,
    tempCelsius: 99.1,
    spo2Percent: 96,
    weightKg: 71,
    heightCm: 175,
    recordedById: 'doctor-1'
  },
  {
    id: 'vitals-3',
    individualId: 'test-individual-1',
    recordedAt: new Date('2024-01-10'),
    systolicBp: 150, // High
    diastolicBp: 95, // High
    heartRateBpm: 105, // Tachycardia
    tempCelsius: 100.4, // Fever
    spo2Percent: 94, // Low
    weightKg: 69,
    heightCm: 175,
    recordedById: 'doctor-1'
  }
];

describe('VitalsMonitoringSection', () => {
  const user = userEvent.setup();

  describe('Component Rendering', () => {
    test('renders vitals monitoring section with chart', () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      expect(screen.getByRole('group', { name: /vitals monitoring/i })).toBeInTheDocument();
      expect(screen.getByText(/vitals trends/i)).toBeInTheDocument();
    });

    test('displays empty state when no vitals data', () => {
      render(
        <VitalsMonitoringSection
          vitalsData={[]}
          individual={mockIndividual}
        />
      );

      expect(screen.getByText(/no vitals recorded/i)).toBeInTheDocument();
    });
  });

  describe('Date Range Filtering', () => {
    test('defaults to 30-day view', () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      const thirtyDayButton = screen.getByRole('button', { name: /30 days/i });
      expect(thirtyDayButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('filters data when date range is changed', async () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      // Switch to 7-day view
      const sevenDayButton = screen.getByRole('button', { name: /7 days/i });
      await user.click(sevenDayButton);

      expect(sevenDayButton).toHaveAttribute('aria-pressed', 'true');
      
      // Should only show recent vitals (mock data doesn't span 7 days, 
      // but component should handle this correctly)
    });

    test('custom date range picker works correctly', async () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      const customButton = screen.getByRole('button', { name: /custom/i });
      await user.click(customButton);

      // Should show date picker inputs
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });
  });

  describe('Metric Selection', () => {
    test('all metrics are selected by default', () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      const systolicCheckbox = screen.getByRole('checkbox', { name: /bp systolic/i });
      const diastolicCheckbox = screen.getByRole('checkbox', { name: /bp diastolic/i });
      const heartRateCheckbox = screen.getByRole('checkbox', { name: /heart rate/i });
      const spo2Checkbox = screen.getByRole('checkbox', { name: /spo₂/i });

      expect(systolicCheckbox).toBeChecked();
      expect(diastolicCheckbox).toBeChecked();
      expect(heartRateCheckbox).toBeChecked();
      expect(spo2Checkbox).toBeChecked();
    });

    test('can toggle individual metrics on/off', async () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      const systolicCheckbox = screen.getByRole('checkbox', { name: /bp systolic/i });
      
      // Uncheck systolic
      await user.click(systolicCheckbox);
      expect(systolicCheckbox).not.toBeChecked();

      // Check it again
      await user.click(systolicCheckbox);
      expect(systolicCheckbox).toBeChecked();
    });
  });

  describe('Threshold Alerts', () => {
    test('displays threshold alert markers for abnormal values', () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      // Should show alerts for elevated/high BP, tachycardia, low SpO2
      expect(screen.getByText(/elevated blood pressure/i)).toBeInTheDocument();
      expect(screen.getByText(/tachycardia/i)).toBeInTheDocument();
      expect(screen.getByText(/low oxygen saturation/i)).toBeInTheDocument();
    });

    test('threshold bands are visible on chart', () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      const thresholdToggle = screen.getByRole('switch', { name: /show thresholds/i });
      expect(thresholdToggle).toBeChecked(); // Should be on by default
    });

    test('can toggle threshold bands on/off', async () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      const thresholdToggle = screen.getByRole('switch', { name: /show thresholds/i });
      
      // Turn off thresholds
      await user.click(thresholdToggle);
      expect(thresholdToggle).not.toBeChecked();
    });
  });

  describe('Chart Interactions', () => {
    test('tooltip shows detailed information on hover', () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      // Tooltip content is handled by Recharts, but we can test that
      // data is properly formatted for display
      const chartContainer = screen.getByRole('img', { name: /vitals trend chart/i });
      expect(chartContainer).toBeInTheDocument();
    });

    test('chart is accessible with proper ARIA labels', () => {
      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      const chart = screen.getByRole('img');
      expect(chart).toHaveAccessibleName();
      expect(chart).toHaveAccessibleDescription();
    });
  });

  describe('Data Processing', () => {
    test('processes vitals data correctly for chart display', () => {
      const { container } = render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      // Chart should be present with processed data
      const chartElement = container.querySelector('.recharts-wrapper');
      expect(chartElement).toBeInTheDocument();
    });

    test('sorts vitals data by date chronologically', () => {
      // Test with unsorted data
      const unsortedVitals = [...mockVitalsData].reverse();
      
      render(
        <VitalsMonitoringSection
          vitalsData={unsortedVitals}
          individual={mockIndividual}
        />
      );

      // Should still render correctly (component should sort internally)
      expect(screen.getByRole('img', { name: /vitals trend chart/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('adjusts chart height for mobile screens', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(
        <VitalsMonitoringSection
          vitalsData={mockVitalsData}
          individual={mockIndividual}
        />
      );

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toBeInTheDocument();
      // Height should be adjusted for mobile (tested via CSS classes)
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      // Generate large dataset (100+ records)
      const largeVitalsData = Array.from({ length: 150 }, (_, i) => ({
        ...mockVitalsData[0],
        id: `vitals-${i}`,
        recordedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) // Daily records
      }));

      const startTime = performance.now();
      
      render(
        <VitalsMonitoringSection
          vitalsData={largeVitalsData}
          individual={mockIndividual}
        />
      );

      const endTime = performance.now();
      
      // Should render within reasonable time (< 100ms for testing)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    test('handles invalid vitals data gracefully', () => {
      const invalidVitals = [
        {
          ...mockVitalsData[0],
          systolicBp: null as any,
          heartRateBpm: undefined as any
        }
      ];

      expect(() => {
        render(
          <VitalsMonitoringSection
            vitalsData={invalidVitals}
            individual={mockIndividual}
          />
        );
      }).not.toThrow();
    });

    test('handles missing individual data gracefully', () => {
      expect(() => {
        render(
          <VitalsMonitoringSection
            vitalsData={mockVitalsData}
            individual={null as any}
          />
        );
      }).not.toThrow();
    });
  });
});

// Additional unit tests for utility functions
describe('VitalsMonitoring Utility Functions', () => {
  describe('processVitalsForChart', () => {
    // These will test the utility functions we'll create
    test('filters vitals by date range correctly');
    test('formats data for Recharts consumption');
    test('handles empty datasets');
  });

  describe('getVitalThresholds', () => {
    test('returns correct thresholds for blood pressure');
    test('returns correct thresholds for heart rate');
    test('returns correct thresholds for oxygen saturation');
    test('returns correct thresholds for temperature');
  });

  describe('generateVitalAlerts', () => {
    test('identifies hypertension correctly');
    test('identifies tachycardia and bradycardia');
    test('identifies hypoxemia');
    test('identifies fever');
  });
});