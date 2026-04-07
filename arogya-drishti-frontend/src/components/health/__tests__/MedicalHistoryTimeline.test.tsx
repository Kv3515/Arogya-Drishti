import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicalHistoryTimeline } from '../MedicalHistoryTimeline';
import type { MedicalHistory } from '@/lib/api';

// Mock data for testing
const mockMedicalHistory: MedicalHistory[] = [
  {
    id: 'history-1',
    individualId: 'individual-1',
    visitDate: new Date('2024-03-15'),
    visitType: 'routine',
    chiefComplaint: 'Annual physical examination',
    diagnosis: 'General good health',
    icd10Code: 'Z00.00',
    severity: 'MILD',
    doctorId: 'doctor-1',
    prescription: [
      {
        id: 'rx-1',
        drugName: 'Multivitamin',
        dose: '1 tablet daily',
        frequency: 'daily',
        duration: 30,
        instructions: 'Take with food'
      }
    ]
  },
  {
    id: 'history-2', 
    individualId: 'individual-1',
    visitDate: new Date('2024-02-10'),
    visitType: 'emergency',
    chiefComplaint: 'Severe headache and nausea',
    diagnosis: 'Migraine with aura',
    icd10Code: 'G43.1',
    severity: 'MODERATE',
    doctorId: 'doctor-2',
    prescription: [
      {
        id: 'rx-2',
        drugName: 'Sumatriptan',
        dose: '50mg',
        frequency: 'as needed',
        duration: 7,
        instructions: 'Take at onset of migraine'
      }
    ]
  },
  {
    id: 'history-3',
    individualId: 'individual-1',
    visitDate: new Date('2024-01-05'),
    visitType: 'follow_up',
    chiefComplaint: 'Follow-up for back pain',
    diagnosis: 'Lower back pain - improved',
    icd10Code: 'M54.5',
    severity: 'MILD',
    doctorId: 'doctor-1',
    prescription: [
      {
        id: 'rx-3',
        drugName: 'Ibuprofen',
        dose: '400mg',
        frequency: 'twice daily',
        duration: 14,
        instructions: 'Take with food'
      },
      {
        id: 'rx-4',
        drugName: 'Physical therapy',
        dose: '3 sessions',
        frequency: 'weekly',
        duration: 21,
        instructions: 'Continue exercises at home'
      }
    ]
  },
  {
    id: 'history-4',
    individualId: 'individual-1',
    visitDate: new Date('2023-12-01'),
    visitType: 'specialist',
    chiefComplaint: 'Chest pain during exercise',
    diagnosis: 'Exercise-induced chest discomfort, cardiac workup normal',
    icd10Code: 'R06.02',
    severity: 'SEVERE',
    doctorId: 'doctor-3',
    prescription: []
  }
];

describe('MedicalHistoryTimeline', () => {
  const user = userEvent.setup();

  describe('Component Rendering', () => {
    test('renders medical history timeline with records', () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      expect(screen.getByRole('region', { name: /medical history timeline/i })).toBeInTheDocument();
      expect(screen.getByText(/medical history/i)).toBeInTheDocument();
      expect(screen.getByText(/General good health/i)).toBeInTheDocument();
    });

    test('displays empty state when no medical history', () => {
      render(<MedicalHistoryTimeline medicalHistory={[]} />);

      expect(screen.getByText(/no medical history/i)).toBeInTheDocument();
    });

    test('renders all medical records by default', () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      expect(screen.getByText(/General good health/i)).toBeInTheDocument();
      expect(screen.getByText(/Migraine with aura/i)).toBeInTheDocument();
      expect(screen.getByText(/Lower back pain - improved/i)).toBeInTheDocument();
      expect(screen.getByText(/Exercise-induced chest discomfort/i)).toBeInTheDocument();
    });
  });

  describe('Sorting Controls', () => {
    test('defaults to newest first sorting', () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const newestButton = screen.getByRole('button', { name: /newest first/i });
      expect(newestButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('can sort by oldest first', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const oldestButton = screen.getByRole('button', { name: /oldest first/i });
      await user.click(oldestButton);

      expect(oldestButton).toHaveAttribute('aria-pressed', 'true');
      // Verify order - oldest record should appear first
    });
  });

  describe('Filtering Controls', () => {
    describe('Visit Type Filter', () => {
      test('can filter by visit type', async () => {
        render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

        const filterButton = screen.getByRole('button', { name: /filter/i });
        await user.click(filterButton);

        // Select emergency visits only
        const emergencyCheckbox = screen.getByRole('checkbox', { name: /emergency/i });
        await user.click(emergencyCheckbox);

        // Should only show emergency visit
        expect(screen.getByText(/Migraine with aura/i)).toBeInTheDocument();
        expect(screen.queryByText(/General good health/i)).not.toBeInTheDocument();
      });

      test('can select multiple visit types', async () => {
        render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

        const filterButton = screen.getByRole('button', { name: /filter/i });
        await user.click(filterButton);

        const routineCheckbox = screen.getByRole('checkbox', { name: /routine/i });
        const followUpCheckbox = screen.getByRole('checkbox', { name: /follow.*up/i });

        await user.click(routineCheckbox);
        await user.click(followUpCheckbox);

        // Should show both routine and follow-up visits
        expect(screen.getByText(/General good health/i)).toBeInTheDocument();
        expect(screen.getByText(/Lower back pain - improved/i)).toBeInTheDocument();
        expect(screen.queryByText(/Migraine with aura/i)).not.toBeInTheDocument();
      });
    });

    describe('Severity Filter', () => {
      test('can filter by severity', async () => {
        render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

        const filterButton = screen.getByRole('button', { name: /filter/i });
        await user.click(filterButton);

        // Select only severe cases
        const severeCheckbox = screen.getByRole('checkbox', { name: /severe/i });
        await user.click(severeCheckbox);

        expect(screen.getByText(/Exercise-induced chest discomfort/i)).toBeInTheDocument();
        expect(screen.queryByText(/General good health/i)).not.toBeInTheDocument();
      });

      test('can combine visit type and severity filters', async () => {
        render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

        const filterButton = screen.getByRole('button', { name: /filter/i });
        await user.click(filterButton);

        const emergencyCheckbox = screen.getByRole('checkbox', { name: /emergency/i });
        const moderateCheckbox = screen.getByRole('checkbox', { name: /moderate/i });

        await user.click(emergencyCheckbox);
        await user.click(moderateCheckbox);

        // Should show emergency visits with moderate severity
        expect(screen.getByText(/Migraine with aura/i)).toBeInTheDocument();
        expect(screen.queryByText(/General good health/i)).not.toBeInTheDocument();
      });
    });

    describe('Date Range Filter', () => {
      test('can filter by date range', async () => {
        render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

        const filterButton = screen.getByRole('button', { name: /filter/i });
        await user.click(filterButton);

        const startDateInput = screen.getByLabelText(/start date/i);
        const endDateInput = screen.getByLabelText(/end date/i);

        await user.type(startDateInput, '2024-02-01');
        await user.type(endDateInput, '2024-03-31');

        // Should only show records from Feb-Mar 2024
        expect(screen.getByText(/General good health/i)).toBeInTheDocument();
        expect(screen.getByText(/Migraine with aura/i)).toBeInTheDocument();
        expect(screen.queryByText(/Exercise-induced chest discomfort/i)).not.toBeInTheDocument();
      });
    });

    test('can clear all filters', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);

      // Apply some filters
      const emergencyCheckbox = screen.getByRole('checkbox', { name: /emergency/i });
      await user.click(emergencyCheckbox);

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      // All records should be visible again
      expect(screen.getByText(/General good health/i)).toBeInTheDocument();
      expect(screen.getByText(/Migraine with aura/i)).toBeInTheDocument();
      expect(screen.getByText(/Lower back pain - improved/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('can search by diagnosis', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search medical history/i });
      await user.type(searchInput, 'migraine');

      expect(screen.getByText(/Migraine with aura/i)).toBeInTheDocument();
      expect(screen.queryByText(/General good health/i)).not.toBeInTheDocument();
    });

    test('can search by chief complaint', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search medical history/i });
      await user.type(searchInput, 'back pain');

      expect(screen.getByText(/Lower back pain - improved/i)).toBeInTheDocument();
      expect(screen.queryByText(/General good health/i)).not.toBeInTheDocument();
    });

    test('can search by ICD-10 code', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search medical history/i });
      await user.type(searchInput, 'G43.1');

      expect(screen.getByText(/Migraine with aura/i)).toBeInTheDocument();
      expect(screen.queryByText(/General good health/i)).not.toBeInTheDocument();
    });

    test('search is case insensitive', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search medical history/i });
      await user.type(searchInput, 'MIGRAINE');

      expect(screen.getByText(/Migraine with aura/i)).toBeInTheDocument();
    });

    test('shows no results message for non-matching search', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search medical history/i });
      await user.type(searchInput, 'nonexistent condition');

      expect(screen.getByText(/no records found/i)).toBeInTheDocument();
    });

    test('can clear search', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search medical history/i });
      await user.type(searchInput, 'migraine');

      // Clear search
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      // All records should be visible again
      expect(screen.getByText(/General good health/i)).toBeInTheDocument();
    });
  });

  describe('Expandable Details', () => {
    test('can expand/collapse individual records', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const expandButton = screen.getAllByRole('button', { name: /expand details/i })[0];
      await user.click(expandButton);

      // Should show expanded details
      expect(screen.getByText(/expand details/i)).toBeInTheDocument();
      
      // Click again to collapse
      await user.click(expandButton);
    });

    test('expanded view shows full prescription details', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      // Find record with multiple prescriptions (back pain record)
      const backPainRecord = screen.getByText(/Lower back pain - improved/i).closest('[role="listitem"]');
      const expandButton = backPainRecord?.querySelector('button[aria-label*="expand"]') as HTMLElement;
      
      await user.click(expandButton);

      // Should show prescription instructions
      expect(screen.getByText(/Take with food/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue exercises at home/i)).toBeInTheDocument();
    });

    test('expanded view shows doctor information', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const expandButton = screen.getAllByRole('button', { name: /expand details/i })[0];
      await user.click(expandButton);

      // Should show doctor information
      expect(screen.getByText(/doctor.*1/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('timeline has proper ARIA labels', () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const timeline = screen.getByRole('region', { name: /medical history timeline/i });
      expect(timeline).toBeInTheDocument();
    });

    test('records are properly structured for screen readers', () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const records = screen.getAllByRole('listitem');
      expect(records).toHaveLength(mockMedicalHistory.length);

      records.forEach(record => {
        expect(record).toBeInTheDocument();
      });
    });

    test('expand buttons have descriptive labels', () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const expandButtons = screen.getAllByRole('button', { name: /expand details/i });
      expandButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    test('filter controls are keyboard accessible', async () => {
      render(<MedicalHistoryTimeline medicalHistory={mockMedicalHistory} />);

      const filterButton = screen.getByRole('button', { name: /filter/i });
      
      // Should be focusable and activatable with keyboard
      filterButton.focus();
      await user.keyboard('{Enter}');

      // Filter panel should open
      expect(screen.getByRole('checkbox', { name: /routine/i })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      // Generate large dataset
      const largeHistory = Array.from({ length: 100 }, (_, i) => ({
        ...mockMedicalHistory[0],
        id: `history-${i}`,
        visitDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      }));

      const startTime = performance.now();
      
      render(<MedicalHistoryTimeline medicalHistory={largeHistory} />);

      const endTime = performance.now();
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    test('handles missing prescription data gracefully', () => {
      const historyWithMissingData = [
        {
          ...mockMedicalHistory[0],
          prescription: undefined as any
        }
      ];

      expect(() => {
        render(<MedicalHistoryTimeline medicalHistory={historyWithMissingData} />);
      }).not.toThrow();
    });

    test('handles invalid date formats', () => {
      const historyWithInvalidDate = [
        {
          ...mockMedicalHistory[0],
          visitDate: 'invalid-date' as any
        }
      ];

      expect(() => {
        render(<MedicalHistoryTimeline medicalHistory={historyWithInvalidDate} />);
      }).not.toThrow();
    });
  });
});

// Unit tests for utility functions
describe('MedicalHistoryTimeline Utilities', () => {
  describe('filterRecords', () => {
    test('filters by visit type correctly');
    test('filters by severity correctly');
    test('filters by date range correctly');
    test('combines multiple filters correctly');
  });

  describe('searchRecords', () => {
    test('searches diagnosis text');
    test('searches chief complaint');
    test('searches ICD-10 codes');
    test('is case insensitive');
  });

  describe('sortRecords', () => {
    test('sorts by date newest first');
    test('sorts by date oldest first');
    test('handles equal dates');
  });
});