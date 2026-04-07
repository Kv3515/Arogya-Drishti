# Phase 2 Health Dashboard Architecture

## SPARC Architecture Design - Phase 2 Components

### Overview

Phase 2 transforms basic health data displays into interactive, comprehensive health analytics with:
- Enhanced chart interactions (zoom, filter, hover details)
- Advanced medical data visualization with trend analysis
- Mobile-optimized touch interfaces for field medical personnel
- WCAG 2.1 AA accessibility compliance

---

## Component Architecture

### 1. VitalsMonitoringSection

**Purpose:** Replace basic VitalsChart with interactive time-series analytics

**File:** `src/components/health/VitalsMonitoringSection.tsx`

**Interface:**
```typescript
interface VitalsMonitoringSectionProps {
  vitalsData: VitalsLog[];
  individual: Individual;
  className?: string;
}

interface VitalsState {
  dateRange: '7d' | '30d' | '90d' | 'custom';
  customDateRange: { start: Date; end: Date };
  selectedMetrics: ('systolic' | 'diastolic' | 'heartRate' | 'spo2' | 'temperature')[];
  showThresholds: boolean;
}
```

**Key Features:**
- **Multi-metric time-series chart** with selectable metrics
- **Date range picker** (7d, 30d, 90d, custom)
- **Normal range bands** for each vital sign
- **Threshold alert markers** when values exceed safe ranges
- **Tooltip details** with exact values and timestamps
- **Export functionality** (PNG/PDF for medical records)

**Data Processing:**
```typescript
// Extend health calculations
const processVitalsForChart = (vitals: VitalsLog[], dateRange: DateRange) => {
  return vitals
    .filter(v => isInDateRange(v.recordedAt, dateRange))
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map(formatVitalForChart);
}

const getVitalThresholds = (metric: VitalMetric) => {
  // Medical thresholds for normal/warning/critical ranges
}
```

---

### 2. WeightTrendChart

**Purpose:** Dedicated weight/BMI tracking with goal monitoring

**File:** `src/components/health/WeightTrendChart.tsx`

**Interface:**
```typescript
interface WeightTrendChartProps {
  vitalsData: VitalsLog[];
  individual: Individual;
  targetWeight?: number;
  targetBMI?: number;
  className?: string;
}

interface WeightChartState {
  displayMode: 'weight' | 'bmi' | 'both';
  showGoals: boolean;
  timeframe: '3m' | '6m' | '1y' | 'all';
}
```

**Key Features:**
- **Dual-axis chart** (weight on left Y-axis, BMI on right Y-axis)
- **Target weight/BMI lines** with progress indicators
- **BMI category zones** (underweight/normal/overweight/obese)
- **Weight change rate** calculation (kg/month)
- **Goal achievement tracking** with percentage progress

**Calculations:**
```typescript
// Extend existing health calculations
const calculateWeightTrend = (vitals: VitalsLog[]) => {
  const weightChanges = vitals.map((v, i) => ({
    date: v.recordedAt,
    weight: v.weightKg,
    bmi: calculateBMI(v.weightKg, individual.heightCm),
    changeFromPrevious: i > 0 ? v.weightKg - vitals[i-1].weightKg : 0
  }));
  return weightChanges;
}
```

---

### 3. MedicalHistoryTimeline (Enhanced)

**Purpose:** Interactive timeline with filtering and detailed views

**File:** `src/components/health/MedicalHistoryTimeline.tsx`

**Interface:**
```typescript
interface EnhancedMedicalTimelineProps {
  medicalHistory: MedicalHistory[];
  className?: string;
}

interface TimelineState {
  filters: {
    visitType: string[];
    severity: ('mild' | 'moderate' | 'severe')[];
    dateRange: { start: Date; end: Date };
  };
  searchQuery: string;
  expandedItems: string[]; // history IDs
  sortOrder: 'newest' | 'oldest';
}
```

**Key Features:**
- **Expandable timeline cards** with full diagnosis details
- **Filter by visit type** (routine, emergency, follow-up, specialist)
- **Severity-based filtering** (mild/moderate/severe)
- **Search by condition** or diagnosis keywords
- **Prescription details** when expanded
- **Doctor information** with timestamps

---

### 4. AnnualExamSection

**Purpose:** Comprehensive examination results with historical trends

**File:** `src/components/health/AnnualExamSection.tsx`

**Interface:**
```typescript
interface AnnualExamSectionProps {
  examHistory: AnnualMedicalExam[];
  individual: Individual;
  className?: string;
}

interface ExamSectionState {
  selectedExamId?: string;
  comparisonMode: boolean;
  compareYears: string[];
}
```

**Key Features:**
- **Accordion-style exam history** grouped by year
- **Vision/hearing trend charts** over time
- **Fitness certification timeline** with validity tracking
- **Year-over-year comparison mode** for key metrics
- **Next exam due reminders** with countdown
- **Examiner information** and detailed remarks

---

## Data Flow Architecture

### State Management
```typescript
// Local component state using React hooks
const useHealthDashboard = () => {
  const [dateFilters, setDateFilters] = useState<DateFilters>()
  const [activeComponents, setActiveComponents] = useState<ComponentState>()
  // Shared filtering state across Phase 2 components
}
```

### API Integration
- **Existing endpoints:** Continue using Individual, VitalsLog, MedicalHistory, AnnualMedicalExam
- **No new API calls needed** - all data already available
- **Client-side calculations** for trends, filtering, and aggregations

### Performance Strategy
```typescript
// Optimize for large datasets
const useVitalsData = (individualId: string) => {
  return useMemo(() => 
    processVitalsForCharts(rawVitalsData), 
    [rawVitalsData, dateRange]
  );
}

// Virtual scrolling for extensive medical history
const usePaginatedHistory = (history: MedicalHistory[], pageSize = 20) => {
  // Implement windowing for 100+ medical records
}
```

---

## Component Integration

### File Structure
```
src/components/health/
├── HealthOverviewCard.tsx          ✅ (Phase 1)
├── VitalsMonitoringSection.tsx     🆕 (Phase 2)
├── WeightTrendChart.tsx           🆕 (Phase 2)
├── MedicalHistoryTimeline.tsx     🆕 (Phase 2)
├── AnnualExamSection.tsx          🆕 (Phase 2)
└── index.ts                       ✅ (Updated exports)
```

### Dashboard Integration
```typescript
// src/app/dashboard/me/page.tsx
export default function IndividualDashboard() {
  return (
    <div className="space-y-6">
      <HealthOverviewCard {...props} />
      
      {/* Phase 2 Components */}
      <VitalsMonitoringSection vitalsData={vitals} individual={individual} />
      <WeightTrendChart vitalsData={vitals} individual={individual} />
      <MedicalHistoryTimeline medicalHistory={history} />
      <AnnualExamSection examHistory={exams} individual={individual} />
    </div>
  );
}
```

---

## Design System Integration

### Color Scheme (Medical Theme)
```css
/* Continue Phase 1 medical design */
.VitalsMonitoringSection {
  --pulse-color: #10b981; /* emerald-500 for normal */
  --warning-color: #f59e0b; /* amber-500 for elevated */
  --critical-color: #ef4444; /* red-500 for dangerous */
}

.chart-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Responsive Design
```typescript
// Mobile-first chart configurations
const chartConfig = {
  mobile: { height: 250, margin: { top: 10, right: 10, bottom: 30, left: 40 } },
  tablet: { height: 300, margin: { top: 20, right: 30, bottom: 50, left: 60 } },
  desktop: { height: 400, margin: { top: 20, right: 30, bottom: 50, left: 80 } }
};
```

---

## Testing Strategy

### Unit Tests (90% Coverage Target)
```typescript
describe('VitalsMonitoringSection', () => {
  it('processes vitals data correctly for chart display');
  it('filters data by date range accurately');
  it('displays threshold alerts for abnormal values');
  it('handles empty datasets gracefully');
});

describe('WeightTrendChart', () => {
  it('calculates BMI trends correctly over time');
  it('shows progress toward weight goals');
  it('handles missing weight data points');
});
```

### Integration Tests
- **Chart interactions** (hover, zoom, filter)
- **Mobile touch events** on chart components
- **Accessibility navigation** with keyboard/screen readers
- **Data loading states** and error boundaries

### Performance Tests
- **Large dataset rendering** (1000+ vitals records)
- **Chart animation performance** on mobile devices
- **Memory usage** with extended chart interactions
- **Bundle size impact** of enhanced components

---

## Accessibility Compliance

### WCAG 2.1 AA Requirements
```typescript
// Screen reader support
<LineChart
  role="img"
  aria-label={`Vitals trend chart showing ${metrics.join(', ')} over ${dateRange}`}
  aria-describedby="vitals-chart-description"
>
```

### Keyboard Navigation
- **Tab order** through chart controls and filters
- **Arrow key navigation** in timeline components  
- **Enter/Space activation** for expandable items
- **Escape key** to close expanded details

### Color Accessibility
- **Sufficient contrast ratios** (4.5:1 minimum)
- **Pattern/shape differentiation** not relying solely on color
- **High contrast mode** support for vision-impaired users

---

## Implementation Priority

1. **VitalsMonitoringSection** (Extends existing VitalsChart)
2. **WeightTrendChart** (New component, moderate complexity)
3. **MedicalHistoryTimeline** (Enhance existing component)
4. **AnnualExamSection** (New component, highest complexity)

Next step: Begin TDD implementation starting with VitalsMonitoringSection.