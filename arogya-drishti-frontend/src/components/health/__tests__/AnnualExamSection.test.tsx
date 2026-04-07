import { render, screen, fireEvent } from '@testing-library/react';
import { AnnualExamSection } from '../AnnualExamSection';
import { Individual, AnnualMedicalExam } from '@/lib/api';

describe('AnnualExamSection', () => {
  const mockIndividual: Individual = {
    id: '1',
    serviceNumber: 'SVC-00001',
    name: 'John Doe',
    rank: 'Captain',
    unitId: 'unit1',
    sex: 'Male',
    dateOfBirth: '1990-01-01',
    bloodGroup: 'A+',
    dutyStatus: 'active',
    fitnessStatus: 'fit',
    medicalCategory: '1A',
    heightCm: 180,
    weightKg: 75,
  };

  const mockExams: AnnualMedicalExam[] = [
    {
      id: 'exam1',
      individualId: '1',
      examDate: '2026-01-15',
      examinerDoctorId: 'doc1',
      visionLeft: '20/20',
      visionRight: '20/20',
      hearingStatus: 'Normal',
      bmi: 23.1,
      overallFitness: 'Fit',
      medicalCategory: '1A',
      shapeS: null, shapeH: null, shapeA: null, shapeP: null, shapeE: null,
      copeC: null, copeO: null, copeP: null, copeE: null,
      remarks: 'All parameters normal',
      nextExamDue: '2027-01-15',
      fitnessValidUntil: '2027-01-15',
    },
    {
      id: 'exam2',
      individualId: '1',
      examDate: '2025-01-10',
      examinerDoctorId: 'doc2',
      visionLeft: '20/25',
      visionRight: '20/20',
      hearingStatus: 'Mild hearing loss',
      bmi: 22.8,
      overallFitness: 'Monitor',
      medicalCategory: '3',
      shapeS: null, shapeH: null, shapeA: null, shapeP: null, shapeE: null,
      copeC: null, copeO: null, copeP: null, copeE: null,
      remarks: 'Minor vision correction needed',
      nextExamDue: '2026-01-10',
      fitnessValidUntil: '2026-01-10',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders annual exam section with header', () => {
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={mockExams} 
        />
      );
      
      expect(screen.getByText('Annual Medical Examinations')).toBeInTheDocument();
      expect(screen.getByText('2 exams on record')).toBeInTheDocument();
    });

    it('renders exam cards with correct dates and status', () => {
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={mockExams} 
        />
      );
      
      expect(screen.getByText('January 15, 2026')).toBeInTheDocument();
      expect(screen.getByText('January 10, 2025')).toBeInTheDocument();
      expect(screen.getByText('Fit')).toBeInTheDocument();
      expect(screen.getByText('Monitor')).toBeInTheDocument();
    });

    it('shows next exam due date for most recent exam', () => {
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={mockExams} 
        />
      );
      
      expect(screen.getByText(/Next exam due:/)).toBeInTheDocument();
      expect(screen.getByText(/January 15, 2027/)).toBeInTheDocument();
    });
  });

  describe('Exam Details Expansion', () => {
    it('expands exam details when clicked', () => {
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={mockExams} 
        />
      );
      
      const expandButton = screen.getByRole('button', { name: /expand exam details/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText('Vision Tests')).toBeInTheDocument();
      expect(screen.getByText('Left Eye: 20/20')).toBeInTheDocument();
      expect(screen.getByText('Right Eye: 20/20')).toBeInTheDocument();
      expect(screen.getByText('Hearing: Normal')).toBeInTheDocument();
      expect(screen.getByText('BMI: 23.1')).toBeInTheDocument();
    });

    it('collapses exam details when clicked again', () => {
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={mockExams} 
        />
      );
      
      const expandButton = screen.getByRole('button', { name: /expand exam details/i });
      fireEvent.click(expandButton);
      fireEvent.click(expandButton);
      
      expect(screen.queryByText('Vision Tests')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no exams available', () => {
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={[]} 
        />
      );
      
      expect(screen.getByText('No annual exams on record')).toBeInTheDocument();
      expect(screen.getByText(/Annual medical examinations are required yearly/)).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('displays correct status indicators for fitness levels', () => {
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={mockExams} 
        />
      );
      
      const fitBadge = screen.getByText('Fit');
      const monitorBadge = screen.getByText('Monitor');
      
      expect(fitBadge).toHaveClass('bg-green-100', 'text-green-800');
      expect(monitorBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  describe('Data Processing', () => {
    it('sorts exams by date in descending order', () => {
      const unsortedExams = [...mockExams].reverse();
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={unsortedExams} 
        />
      );
      
      const examElements = screen.getAllByText(/January \d+, \d{4}/);
      expect(examElements[0]).toHaveTextContent('January 15, 2026'); // Most recent first
      expect(examElements[1]).toHaveTextContent('January 10, 2025');
    });

    it('calculates BMI category correctly', async () => {
      render(
        <AnnualExamSection 
          individual={mockIndividual} 
          exams={mockExams} 
        />
      );
      
      const expandButton = screen.getByRole('button', { name: /expand exam details/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText(/Normal weight/)).toBeInTheDocument();
    });
  });
});