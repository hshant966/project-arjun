/**
 * FailuresLayer — Government failure indicators across India
 * Water contamination, infrastructure failures, scheme implementation gaps, institutional failures
 */
import { Viewer, Cartesian3, Color, HeightReference, LabelStyle, VerticalOrigin, NearFarScalar } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

type FailureCategory = 'water' | 'infrastructure' | 'scheme' | 'health' | 'education' | 'environment' | 'governance';
type Severity = 'critical' | 'high' | 'medium';

interface FailureIndicator {
  id: string;
  title: string;
  category: FailureCategory;
  severity: Severity;
  lat: number;
  lng: number;
  district: string;
  state: string;
  description: string;
  affectedPopulation: string;
  durationMonths: number;
  responsibleAgency: string;
  lastUpdated: string;
  details: Record<string, string>;
}

export class FailuresLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'failures',
    name: 'Government Failures',
    icon: '🚨',
    description: 'Water contamination, infrastructure failures, scheme gaps, institutional breakdowns — mapped across India',
    category: 'india',
    color: '#ff3355',
    enabled: false,
    opacity: 0.9,
    dataStoreKey: 'failures',
  };

  private failures: FailureIndicator[] = [
    // WATER CONTAMINATION
    {
      id: 'f-001', title: 'Arsenic Groundwater Contamination', category: 'water',
      severity: 'critical', lat: 25.594, lng: 85.138, district: 'Patna', state: 'Bihar',
      description: 'Arsenic levels 10x above WHO limits in 42 blocks. 3 Cr people exposed. Skin lesions and cancers reported.',
      affectedPopulation: '3 Crore', durationMonths: 84, responsibleAgency: 'PHED Bihar / Jal Jeevan Mission',
      lastUpdated: '2026-04-18',
      details: { 'Arsenic Level': '>300 μg/L (WHO limit: 10)', 'Affected Blocks': '42 of 53', 'Health Impact': 'Cancer, skin lesions, neurological damage', 'Status': 'No remediation plan in action' },
    },
    {
      id: 'f-002', title: 'Fluoride Contamination — Rajasthan', category: 'water',
      severity: 'critical', lat: 26.912, lng: 75.787, district: 'Jaipur', state: 'Rajasthan',
      description: 'Fluoride in groundwater exceeds 5 mg/L in 18 districts. Dental and skeletal fluorosis endemic.',
      affectedPopulation: '1.5 Crore', durationMonths: 120, responsibleAgency: 'PHED Rajasthan',
      lastUpdated: '2026-04-15',
      details: { 'Fluoride Level': '5.2 mg/L (WHO limit: 1.5)', 'Affected Districts': '18 of 33', 'Health Impact': 'Skeletal fluorosis, dental damage', 'Status': 'Defluoridation plants mostly non-functional' },
    },
    {
      id: 'f-003', title: 'Ganga River Pollution — Varanasi', category: 'water',
      severity: 'critical', lat: 25.317, lng: 82.974, district: 'Varanasi', state: 'Uttar Pradesh',
      description: 'Namami Gange project spent ₹30,000 Cr but faecal coliform 10,000x above safe levels at ghats.',
      affectedPopulation: '50 Lakh', durationMonths: 36, responsibleAgency: 'NMCG / UPPCB',
      lastUpdated: '2026-04-10',
      details: { 'Coliform Count': '1,60,000 MPN/100ml (Safe: <500)', 'Dissolved Oxygen': '2.1 mg/L (critical)', 'STP Capacity': '40% of sewage generated', 'Budget Spent': '₹30,000 Cr with minimal impact' },
    },
    {
      id: 'f-004', title: 'Polluted Drinking Water — Latur', category: 'water',
      severity: 'high', lat: 18.408, lng: 76.576, district: 'Latur', state: 'Maharashtra',
      description: 'TDS exceeds 1500 ppm in Manjara river basin. Jal Jeevan connections exist but water is undrinkable.',
      affectedPopulation: '12 Lakh', durationMonths: 48, responsibleAgency: 'Jal Jeevan Mission MH',
      lastUpdated: '2026-04-08',
      details: { 'TDS Level': '1520 ppm (Safe: <500)', 'Tap Connections': '72% functional', 'Safe Water': 'Only 28% of connections', 'Status': 'No RO treatment plants installed' },
    },

    // INFRASTRUCTURE FAILURES
    {
      id: 'f-005', title: 'NHAI Highway Death Trap — NH-66 Konkan', category: 'infrastructure',
      severity: 'critical', lat: 16.705, lng: 74.243, district: 'Kolhapur', state: 'Maharashtra',
      description: 'NH-66 widening 3 years delayed. 847 accidents in 2025. Potholes, missing guardrails, no lighting.',
      affectedPopulation: '25 Lakh (daily commuters)', durationMonths: 42, responsibleAgency: 'NHAI / MoRTH',
      lastUpdated: '2026-04-12',
      details: { 'Deaths (2025)': '312', 'Accidents (2025)': '847', 'Delay': '42 months overdue', 'Status': 'Contractor disputes unresolved' },
    },
    {
      id: 'f-006', title: 'Mumbai Local Railway Overcrowding', category: 'infrastructure',
      severity: 'critical', lat: 19.076, lng: 72.877, district: 'Mumbai', state: 'Maharashtra',
      description: '4,500+ deaths annually from falling off overcrowded trains. Capacity at 450% during peak. AC local delayed.',
      affectedPopulation: '75 Lakh (daily commuters)', durationMonths: 240, responsibleAgency: 'Western/Central Railway',
      lastUpdated: '2026-04-05',
      details: { 'Annual Deaths': '4,500+', 'Peak Overcrowding': '450%', 'AC Local Fleet': 'Only 10 rakes vs planned 60', 'Status': 'Systemic neglect for decades' },
    },
    {
      id: 'f-007', title: 'Bridge Collapse Risk — Bihar', category: 'infrastructure',
      severity: 'critical', lat: 25.594, lng: 85.138, district: 'Patna', state: 'Bihar',
      description: '12 bridges in "distressed" condition. 2 collapsed in 2025. No structural audits done since 2018.',
      affectedPopulation: '80 Lakh', durationMonths: 96, responsibleAgency: 'Bihar PWD',
      lastUpdated: '2026-04-02',
      details: { 'Distressed Bridges': '12', 'Collapsed (2025)': '2', 'Last Audit': '2018', 'Status': 'No emergency repair budget allocated' },
    },
    {
      id: 'f-008', title: 'Power Grid Failures — UP East', category: 'infrastructure',
      severity: 'high', lat: 26.760, lng: 83.373, district: 'Gorakhpur', state: 'Uttar Pradesh',
      description: '8-12 hour daily power cuts in eastern UP despite surplus generation. Distribution losses at 35%.',
      affectedPopulation: '3 Crore', durationMonths: 60, responsibleAgency: 'UPPCL',
      lastUpdated: '2026-04-01',
      details: { 'Distribution Losses': '35%', 'Daily Outage': '8-12 hours', 'AT&C Losses': '42%', 'Status': 'Discom financially unviable' },
    },

    // SCHEME IMPLEMENTATION GAPS
    {
      id: 'f-009', title: 'MGNREGA Wage Payment Failure', category: 'scheme',
      severity: 'critical', lat: 23.344, lng: 85.309, district: 'Ranchi', state: 'Jharkhand',
      description: '₹1,200 Cr in MGNREGA wages pending for 6+ months. Workers in tribal areas not getting paid.',
      affectedPopulation: '18 Lakh workers', durationMonths: 8, responsibleAgency: 'MoRD / State Govt',
      lastUpdated: '2026-04-16',
      details: { 'Pending Wages': '₹1,200 Cr', 'Max Delay': '180+ days', 'Affected Workers': '18 Lakh', 'Status': 'Aadhaar-based payment causing failures' },
    },
    {
      id: 'f-010', title: 'Ayushman Bharat Hospital Refusals', category: 'scheme',
      severity: 'high', lat: 26.847, lng: 80.946, district: 'Lucknow', state: 'Uttar Pradesh',
      description: '42% of empanelled hospitals in UP refuse Ayushman patients. Claims worth ₹800 Cr rejected.',
      affectedPopulation: '50 Lakh families', durationMonths: 18, responsibleAgency: 'NHA / UP SHA',
      lastUpdated: '2026-04-14',
      details: { 'Hospital Refusal Rate': '42%', 'Rejected Claims': '₹800 Cr', 'Empanelled vs Active': '4,200 vs 2,400', 'Status': 'Fraud detection weak, genuine patients suffer' },
    },
    {
      id: 'f-011', title: 'PM Awas Yojana — Ghost Beneficiaries', category: 'scheme',
      severity: 'high', lat: 20.296, lng: 85.825, district: 'Bhubaneswar', state: 'Odisha',
      description: 'CAG audit finds 12,000 ghost beneficiaries in Odisha. ₹450 Cr disbursed to ineligible/fictitious names.',
      affectedPopulation: '12,000 ghost entries', durationMonths: 24, responsibleAgency: 'MoRD / State Rural Dev',
      lastUpdated: '2026-04-10',
      details: { 'Ghost Beneficiaries': '12,000', 'Amount Misappropriated': '₹450 Cr', 'Audit Finding': 'CAG Report 2025', 'Status': 'Recovery proceedings initiated for ₹80 Cr' },
    },

    // HEALTH FAILURES
    {
      id: 'f-012', title: 'PHC Staffing Crisis — Tribal Maharashtra', category: 'health',
      severity: 'critical', lat: 20.183, lng: 80.005, district: 'Gadchiroli', state: 'Maharashtra',
      description: '68% of PHCs in tribal areas have no doctor. 42% buildings in disrepair. Maternal mortality 3x state average.',
      affectedPopulation: '18 Lakh (tribal pop)', durationMonths: 120, responsibleAgency: 'MH Health Dept',
      lastUpdated: '2026-04-06',
      details: { 'PHCs without Doctor': '68%', 'Buildings in Disrepair': '42%', 'Maternal Mortality': '3x state avg', 'Status': 'Specialist positions 85% vacant' },
    },
    {
      id: 'f-013', title: 'Encephalitis Deaths — UP East', category: 'health',
      severity: 'critical', lat: 26.760, lng: 83.373, district: 'Gorakhpur', state: 'Uttar Pradesh',
      description: 'Japanese Encephalitis kills 150+ children annually in eastern UP. Vaccine coverage only 45%. BRD Medical College understaffed.',
      affectedPopulation: '50 Lakh children at risk', durationMonths: 36, responsibleAgency: 'UP Health Dept / MoHFW',
      lastUpdated: '2026-04-03',
      details: { 'Annual Deaths': '150+', 'Vaccine Coverage': '45%', 'ICU Beds': 'Only 60 for 5 districts', 'Status': 'Same tragedy every monsoon' },
    },

    // EDUCATION FAILURES
    {
      id: 'f-014', title: 'ASER Findings — Learning Poverty', category: 'education',
      severity: 'high', lat: 22.98, lng: 87.86, district: 'Kolkata', state: 'West Bengal',
      description: 'ASER 2025: 55% of Class 5 students can\'t read Class 2 text. 70% can\'t do basic division.',
      affectedPopulation: '10 Cr children nationally', durationMonths: 12, responsibleAgency: 'MoE / State Education Depts',
      lastUpdated: '2026-04-08',
      details: { 'Can\'t Read (Class 5)': '55%', 'Can\'t Divide (Class 5)': '70%', 'Dropout Rate (Secondary)': '17%', 'Status': 'Learning outcomes declining post-COVID' },
    },
    {
      id: 'f-015', title: 'Mid-Day Meal Quality — Bihar', category: 'education',
      severity: 'high', lat: 26.120, lng: 85.365, district: 'Muzaffarpur', state: 'Bihar',
      description: 'Inspections find substandard food in 60% of schools. Lizards, insects found. Cooking oil reused for weeks.',
      affectedPopulation: '1.2 Cr children', durationMonths: 36, responsibleAgency: 'Bihar Education Dept',
      lastUpdated: '2026-04-05',
      details: { 'Schools Non-Compliant': '60%', 'Food Safety Violations': 'Reused oil, contaminated ingredients', 'Inspections Done': 'Only 12% schools covered', 'Status': 'Contractors change but quality stays same' },
    },

    // ENVIRONMENTAL FAILURES
    {
      id: 'f-016', title: 'Stubble Burning — Punjab/Haryana', category: 'environment',
      severity: 'critical', lat: 30.73, lng: 76.77, district: 'Chandigarh', state: 'Punjab',
      description: 'Despite ₹3,000 Cr spent, stubble burning continues. 50,000+ fire events in Oct-Nov. Main cause of Delhi NCR pollution.',
      affectedPopulation: '5 Cr (NCR population affected)', durationMonths: 6, responsibleAgency: 'MoEFCC / State Agri Depts',
      lastUpdated: '2026-03-28',
      details: { 'Fire Events (2025)': '52,000+', 'Budget Spent': '₹3,000 Cr', 'Reduction Achieved': 'Only 8%', 'Status': 'Happy Seeder subsidy underutilized' },
    },
    {
      id: 'f-017', title: 'Illegal Sand Mining — UP', category: 'environment',
      severity: 'high', lat: 27.176, lng: 78.008, district: 'Agra', state: 'Uttar Pradesh',
      description: 'Illegal sand mining destroying Yamuna riverbed near Agra. Threat to Taj Mahal foundation. Mafia-police nexus documented.',
      affectedPopulation: '20 Lakh', durationMonths: 84, responsibleAgency: 'UP Mining Dept / NGT',
      lastUpdated: '2026-04-01',
      details: { 'Sand Mined Illegally': 'Est. 5 lakh tonnes/month', 'Riverbed Depth': 'Lowered by 15 feet', 'Taj Mahal Impact': 'Foundation threat documented', 'Status': 'Multiple SC orders ignored' },
    },

    // GOVERNANCE FAILURES
    {
      id: 'f-018', title: 'RTI Non-Compliance — National', category: 'governance',
      severity: 'high', lat: 28.614, lng: 77.210, district: 'New Delhi', state: 'Delhi',
      description: '35 lakh RTI applications pending. 24 Information Commissions vacant. Pendency over 2 years in 6 states.',
      affectedPopulation: '35 Lakh applicants', durationMonths: 24, responsibleAgency: 'DoPT / State Govts',
      lastUpdated: '2026-04-12',
      details: { 'Pending Applications': '35 Lakh', 'Vacant Commissions': '24 of 29', 'Max Pendency': '3+ years', 'Status': 'RTI Act being systematically weakened' },
    },
    {
      id: 'f-019', title: 'Forest Rights Act Denial — MP', category: 'governance',
      severity: 'high', lat: 22.600, lng: 80.380, district: 'Mandla', state: 'Madhya Pradesh',
      description: '70% of FRA claims rejected in tribal MP. Communities displaced for tiger reserves without proper rehabilitation.',
      affectedPopulation: '8 Lakh tribal families', durationMonths: 180, responsibleAgency: 'Tribal Affairs / Forest Dept',
      lastUpdated: '2026-03-25',
      details: { 'Claims Rejected': '70%', 'Families Displaced': '8 Lakh', 'Rehabilitation': 'Only 30% received', 'Status': 'Gram Sabha decisions overridden by forest dept' },
    },
    {
      id: 'f-020', title: 'Custodial Deaths — National', category: 'governance',
      severity: 'critical', lat: 11.13, lng: 78.66, district: 'Chennai', state: 'Tamil Nadu',
      description: 'NHRC reports 1,800+ custodial deaths annually. Police accountability near zero. Conviction rate for custodial torture: 0.2%.',
      affectedPopulation: '1,800+ deaths/year', durationMonths: 12, responsibleAgency: 'NHRC / MHA / State Police',
      lastUpdated: '2026-04-02',
      details: { 'Annual Deaths': '1,800+', 'Conviction Rate': '0.2%', 'Complaints Received': '42,000', 'Status:': 'Police investigating police = no accountability' },
    },
  ];

  private getCategoryColor(category: FailureCategory): string {
    const colors: Record<FailureCategory, string> = {
      water: '#0091ea', infrastructure: '#ffc400', scheme: '#9c27b0',
      health: '#ff1744', education: '#ff6d00', environment: '#2e7d32', governance: '#37474f',
    };
    return colors[category];
  }

  private getCategoryIcon(category: FailureCategory): string {
    const icons: Record<FailureCategory, string> = {
      water: '💧', infrastructure: '🏗️', scheme: '📋',
      health: '🏥', education: '📚', environment: '🌿', governance: '⚖️',
    };
    return icons[category];
  }

  private getSeverityColor(severity: Severity): string {
    switch (severity) {
      case 'critical': return '#ff3355';
      case 'high': return '#ff9800';
      case 'medium': return '#ffcc00';
    }
  }

  protected async loadData(): Promise<void> {
    this.clear();

    for (const f of this.failures) {
      const categoryColor = this.getCategoryColor(f.category);
      const severityColor = this.getSeverityColor(f.severity);
      const icon = this.getCategoryIcon(f.category);

      const size = f.severity === 'critical' ? 18 : f.severity === 'high' ? 14 : 10;

      // Build details table
      const detailsHtml = Object.entries(f.details)
        .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
        .join('');

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(f.lng, f.lat, f.severity === 'critical' ? 500 : 300),
        point: {
          pixelSize: size,
          color: Color.fromCssColorString(severityColor).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.fromCssColorString(categoryColor),
          outlineWidth: 2,
          scaleByDistance: new NearFarScalar(1.0, 1.0, 1.2e7, 0.1),
        },
        description: `
          <h3>${icon} ${f.title}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Category</td><td style="color:${categoryColor};font-weight:bold">${f.category.toUpperCase()}</td></tr>
            <tr><td>Severity</td><td style="color:${severityColor};font-weight:bold">${f.severity.toUpperCase()}</td></tr>
            <tr><td>Location</td><td>${f.district}, ${f.state}</td></tr>
            <tr><td>Affected Population</td><td style="font-weight:bold">${f.affectedPopulation}</td></tr>
            <tr><td>Duration</td><td>${f.durationMonths} months</td></tr>
            <tr><td>Responsible Agency</td><td>${f.responsibleAgency}</td></tr>
            <tr><td>Description</td><td>${f.description}</td></tr>
            <tr><td colspan="2" style="padding-top:8px"><strong>Details:</strong></td></tr>
            ${detailsHtml}
            <tr><td>Last Updated</td><td>${f.lastUpdated}</td></tr>
          </table>
        `,
      });
    }
  }

  // Filter methods for dashboard
  getFailuresByCategory(category: FailureCategory): FailureIndicator[] {
    return this.failures.filter(f => f.category === category);
  }

  getCriticalFailures(): FailureIndicator[] {
    return this.failures.filter(f => f.severity === 'critical');
  }

  getFailuresByState(state: string): FailureIndicator[] {
    return this.failures.filter(f => f.state === state);
  }

  getAllFailures(): FailureIndicator[] {
    return this.failures;
  }
}
