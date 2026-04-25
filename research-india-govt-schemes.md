# Open Data Sources for Monitoring Indian Government Schemes & Failures

*Compiled: 2026-04-22*

---

## 1. Government Scheme Data Portals

### 1.1 Open Government Data (OGD) Platform India
- **URL**: https://data.gov.in
- **API**: https://data.gov.in/backend/dms/v1/apis (REST API available for most datasets)
- **Access Method**: REST API with API key (free registration via Janparichay/UMANG). Catalogue downloads in CSV, JSON, XLS, RDF.
- **Rate Limits**: ~1000 requests/hour per API key (varies by dataset); bulk downloads available for many datasets
- **Data Format**: JSON (API), CSV/XLS (bulk download)
- **Reliability**: ⭐⭐⭐⭐ Official GoI portal. Datasets vary in freshness—some updated monthly, others annually. Coverage includes health, education, agriculture, water, finance. Search by "scheme" keywords.
- **Key datasets**: Census data, budget data, district-level indicators, agriculture statistics, health infrastructure
- **Notes**: API documentation at https://data.gov.in/apis. Some datasets are stale (last updated years ago). Filter by "Central" ministry for government schemes.

### 1.2 NITI Aayog Data
- **URL**: https://niti.gov.in
- **Data Portal**: https://niti.gov.in/documents-reports (publications & data)
- **Key dashboards**:
  - SDG India Index: https://sdgindiaindex.niti.gov.in
  - Aspirational Districts Programme: https://aspirationaldistricts.gov.in (district-level progress tracker)
  - Composite Water Management Index (CWMI): Published reports with state rankings
  - Health Index: State-level health performance rankings
- **Access Method**: Published reports (PDF), dashboards with web scraping potential, some CSV exports
- **Rate Limits**: No formal API; web scraping only
- **Data Format**: PDF reports, dashboard visualizations, some CSV
- **Reliability**: ⭐⭐⭐⭐ High quality but not real-time. Annual/biannual updates. Good for benchmarking state performance.
- **Notes**: SDG India Index dashboard is the most structured data source. Aspirational districts tracker has district-level granular data.

### 1.3 MyGov Data
- **URL**: https://mygov.in
- **Access Method**: Web portal; consultation documents, citizen feedback
- **Rate Limits**: N/A (no public API)
- **Data Format**: Web content, PDFs
- **Reliability**: ⭐⭐ Engagement platform, not a data source. Useful for understanding citizen sentiment on schemes but no structured API.

### 1.4 UMANG (Unified Mobile Application for New-age Governance)
- **URL**: https://web.umang.gov.in
- **API**: No public API, but aggregates 1600+ government services
- **Reliability**: ⭐⭐⭐ Portal aggregator, not a data source itself.

---

## 2. Scheme-Specific Data Sources

### 2.1 PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)
- **URL**: https://pmkisan.gov.in
- **Dashboard**: https://pmkisan.gov.in/BeneficiaryStatus.aspx
- **Access Method**: 
  - Beneficiary status check: individual farmer lookup by Aadhaar/bank/mobile
  - State/district/block-level dashboards visible on the portal
  - No official public API
  - RTI route: Bulk beneficiary data obtainable via RTI to Ministry of Agriculture
- **Rate Limits**: N/A (no formal API; web scraping subject to CAPTCHA)
- **Data Format**: Web dashboard, downloadable state-wise reports
- **Reliability**: ⭐⭐⭐⭐ Official data. Shows payment status, beneficiary counts by region. Updated with each installment cycle (quarterly).
- **Scraping note**: Beneficiary status page uses CAPTCHA. State-wise beneficiary counts are available without CAPTCHA.

### 2.2 MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act)
- **URL**: https://nrega.nic.in (official), https://nregastrep.nic.net.in (reporting)
- **API**: 
  - **Direct API access available**: `https://nregastrep.nic.netnet1/netnrega/home.aspx` has structured reports
  - State/district/panchayat level data accessible via URL parameters
- **Access Method**: 
  - NIC reports portal at https://nregarep1.nic.in/netnrega/ generates structured HTML reports
  - Reports: Job card register, muster roll, work-wise expenditure, beneficiary-wise payment
  - Data extractable by constructing URLs with state/district/block/panchayat codes
- **Rate Limits**: No formal limits but responsive to polite crawling
- **Data Format**: HTML tables (parseable), CSV exports from some report pages
- **Reliability**: ⭐⭐⭐⭐ One of India's most transparent scheme datasets. Updated near real-time. Covers employment days, wages, works, beneficiaries at panchayat level.
- **Key data points**: Work demand vs. employment provided, wage payment delays, material payments, assets created
- **Scraping note**: URL structure is predictable. Panchayat-level codes can be enumerated. This is arguably the richest scheme monitoring dataset in India.

### 2.3 Jal Jeevan Mission (Water Supply)
- **URL**: https://jaljeevanmission.gov.in
- **Dashboard**: https://ejalshakti.gov.in/jjmreport/JJMIndiaDashboard (renamed to JJM Dashboard)
- **Access Method**: 
  - State/district/village-level dashboard showing tap water connections
  - Dashboard has village-level status: Functional Household Tap Connections (FHTC)
  - No public API; web dashboard with structured tables
- **Rate Limits**: Dashboard is JavaScript-rendered; needs browser automation for scraping
- **Data Format**: Dashboard visualization with underlying data tables
- **Reliability**: ⭐⭐⭐ Official data showing connection status. Self-reported by states—potential for overcounting. Good for tracking progress, not for ground-truth verification.
- **Key data points**: FHTC connections, water quality test results, source sustainability, greywater management

### 2.4 Ayushman Bharat - PM-JAY (Health Insurance)
- **URL**: https://pmjay.gov.in
- **Dashboard**: https://dashboard.pmjay.gov.in (Beneficiary & Hospital panels)
- **Access Method**: 
  - Public dashboard with state/district-level claim data
  - Shows: hospitals empanelled, claims filed, claims paid, amount paid
  - Beneficiary verification via https://bis.pmjay.gov.in/BIS/ with Aadhaar
  - No formal public API
- **Rate Limits**: Dashboard rate-limited; browser automation needed
- **Data Format**: Dashboard tables, some CSV exports
- **Reliability**: ⭐⭐⭐⭐ Official claims data. Shows treatment packages, hospital-wise activity. Good for identifying hospitals with high claim rejection rates.
- **Key data points**: Claims approved vs. rejected, package-wise costs, hospital empanelment status

### 2.5 Ujjwala Yojana (LPG Distribution)
- **URL**: https://pmuy.gov.in
- **Access Method**: 
  - No dedicated dashboard with granular data
  - State-level statistics in press releases (PIB: https://pib.gov.in)
  - IOC/BPCL/HPCL dealer-level data not publicly available
- **Rate Limits**: N/A
- **Data Format**: Press releases (PDF/web)
- **Reliability**: ⭐⭐⭐ Only aggregate national/state data available. No beneficiary-level or district-level breakdown in public domain.

### 2.6 PM Awas Yojana (Housing)
- **URL**: https://pmayg.nic.in (rural), https://pmaymis.gov.in (urban)
- **Access Method**: 
  - Rural: Beneficiary-level data at https://rhreporting.nic.in/netnrega/dynamic/rpt_home_new.aspx
  - Urban: MIS portal with state/district data
- **Data Format**: Web reports, HTML tables
- **Reliability**: ⭐⭐⭐⭐ Beneficiary names, amounts released, house completion status at granular level.

### 2.7 PDS/One Nation One Ration Card
- **URL**: https://nfs.delhi.gov.in (example state portal), https://pdsportal.nic.in
- **Access Method**: 
  - State-level PDS portals have FPS (Fair Price Shop) wise allocation data
  - Annavitaran (https://annavitaran.nic.in) - central monitoring
- **Reliability**: ⭐⭐⭐ Fragmented across states. No single national API.

---

## 3. Water Contamination Tracking

### 3.1 Central Pollution Control Board (CPCB)
- **URL**: https://cpcb.nic.in
- **Dashboards**: 
  - Water quality monitoring: https://cpcb.nic.in/water-quality-data/
  - Real-time ambient air quality: https://app.cpcbccr.com (AQI dashboard)
- **Access Method**: 
  - Water quality data published as periodic reports (PDF)
  - Some state pollution control board portals have online monitoring data
  - No unified public API for water quality
- **Rate Limits**: N/A for water data
- **Data Format**: PDF reports, some CSV in annual reports
- **Reliability**: ⭐⭐⭐ Data covers major rivers, lakes, and coastal waters. Published periodically (not real-time for water). BOD, DO, coliform counts at monitoring stations.
- **Key parameters**: BOD, DO, pH, fecal coliform, total coliform, heavy metals (at select stations)

### 3.2 Central Ground Water Board (CGWB)
- **URL**: https://cgwb.gov.in
- **Data Portal**: https://www.india-wris.nrsc.gov.in (India-WRIS, a joint CGWB-NRSC platform)
- **Access Method**: 
  - Ground water level data: Published in periodic assessment reports
  - India-WRIS has well-level data for some states via web portal
  - Dynamic groundwater resources assessment published state-wise
- **Rate Limits**: N/A
- **Data Format**: PDF reports, some structured data via India-WRIS portal
- **Reliability**: ⭐⭐⭐ Major assessments every 3-5 years. Groundwater level monitoring stations exist but data not real-time accessible.
- **Key data**: Water table depth, aquifer characterization, over-exploited/critical/semi-critical blocks

### 3.3 State Pollution Control Boards
- **Key state portals**:
  - Maharashtra (MPCB): https://mpcb.gov.in - Online Continuous Emission Monitoring (OCEMS) data
  - Delhi (DPCC): https://dpcc.delhigovt.nic.in
  - Karnataka (KSPCB): https://kspcb.karnataka.gov.in
  - Tamil Nadu (TNPCB): https://tnpcb.gov.in
- **Access Method**: Varies by state; some have online monitoring dashboards, most publish periodic reports
- **Reliability**: ⭐⭐ Fragmented. Maharashtra and Delhi have the best online monitoring infrastructure.

### 3.4 India-WRIS (Water Resources Information System)
- **URL**: https://www.india-wris.nrsc.gov.in
- **Access Method**: Web portal with GIS-based water resources data
- **Data Format**: Map-based interface, downloadable reports
- **Reliability**: ⭐⭐⭐ Covers surface water, groundwater, water quality. Most comprehensive single water data portal but interface can be challenging.

---

## 4. Health Data

### 4.1 ICMR (Indian Council of Medical Research)
- **URL**: https://icmr.nic.in
- **Data sources**:
  - Published research and reports: https://www.icmr.gov.in/publications.html
  - COVID-era dashboards (mostly archived now)
  - Disease-specific registries (cancer, diabetes) - reports published periodically
- **Access Method**: Published reports (PDF), no public API
- **Rate Limits**: N/A
- **Data Format**: PDF reports
- **Reliability**: ⭐⭐⭐ High quality for specific studies/registries. Not a real-time monitoring system.

### 4.2 NFHS (National Family Health Survey)
- **URL**: http://rchiips.org/nfhs/ (IIPS - International Institute for Population Sciences)
- **Data Portal**: 
  - Factsheets: http://rchiips.org/NFHS/NFHS-5Reports/NFHS-5_INDIA_FACTSHEET.pdf
  - District factsheets: http://rchiips.org/NFHS/NFHS-5Reports/ (state-wise)
  - Microdata: Available from DHS Program (USAID): https://dhsprogram.com
- **Access Method**: 
  - Factsheets: Direct PDF download
  - Microdata: Registration required at DHS Program (free), provides SPSS/Stata/CSV files
- **Rate Limits**: N/A for factsheets; DHS registration for microdata
- **Data Format**: PDF (factsheets), SPSS/Stata/CSV (microdata)
- **Reliability**: ⭐⭐⭐⭐⭐ Gold standard for health/nutrition data in India. NFHS-5 data (2019-21) most recent. NFHS-6 underway. Covers 700+ indicators at district level.
- **Key indicators**: Stunting, wasting, anemia, immunization, maternal health, water/sanitation, domestic violence

### 4.3 IDSP (Integrated Disease Surveillance Programme)
- **URL**: https://idsp.nic.in
- **Weekly Outbreak Reports**: https://idsp.nic.in/index4.php?lang=1&level=0&linkid=405&lid=3689
- **Access Method**: 
  - Weekly outbreak reports (PDF) published every Monday
  - Weekly surveillance data (state-wise disease counts) in PDF format
  - No public API
- **Rate Limits**: N/A
- **Data Format**: PDF weekly reports
- **Reliability**: ⭐⭐⭐ Most regular disease surveillance data from GoI. Covers 33+ diseases/conditions. Quality varies by state reporting compliance. Reports typically 1-2 weeks lag.
- **Key data**: Disease outbreaks (dengue, malaria, cholera, measles, etc.) with location, date, cases, deaths

### 4.4 HMIS (Health Management Information System)
- **URL**: https://hmis.nhis.gov.in (National Health Authority)
- **Access Method**: Web dashboard, state/district facility-level data
- **Data Format**: Dashboard, downloadable reports
- **Reliability**: ⭐⭐⭐⭐ Comprehensive facility-level health service delivery data (institutional deliveries, immunization, OPD/IPD). Updated monthly.

### 4.5 CoWIN / Vaccination Data
- **URL**: https://cowin.gov.in (archived post-campaign)
- **Notes**: Real-time API was public during COVID; now restricted. Historical data available via MoHFW reports.

---

## 5. Education Data

### 5.1 UDISE+ (Unified District Information System for Education Plus)
- **URL**: https://udiseplus.gov.in
- **Dashboard**: https://udiseplus.gov.in/dashboard
- **Access Method**: 
  - Dashboard with state/district/block-level school data
  - Reports downloadable in PDF/Excel
  - No public API; dashboard data accessible via web scraping
- **Rate Limits**: Dashboard is JavaScript-rendered
- **Data Format**: Dashboard visualizations, Excel/PDF reports
- **Reliability**: ⭐⭐⭐⭐ Comprehensive school-level data: enrollment, teachers, infrastructure (toilets, electricity, computers), dropout rates, gender parity. Annual cycle.
- **Key indicators**: Schools by management type, student-teacher ratio, facilities available, GER (Gross Enrollment Ratio)

### 5.2 School Locations (School GIS)
- **URL**: https://schoolgis.nic.in
- **Access Method**: GIS-based map showing school locations with attributes
- **Data Format**: Map-based interface, potential for GIS data extraction
- **Reliability**: ⭐⭐⭐ School-level geographic data. Can be combined with UDISE+ for location-based analysis.

### 5.3 NISHTHA & Other Training Data
- **URL**: https://nishtha.ncert.gov.in (teacher training)
- **Notes**: Specific to teacher training outcomes, not general education monitoring.

---

## 6. Verified News Sources & Events Databases

### 6.1 GDELT Project (Global Database of Events, Language, and Tone)
- **URL**: https://www.gdeltproject.org
- **API/Dashboard**: 
  - GDELT 2.0 Doc API: `https://api.gdeltproject.org/api/v2/doc/doc?query=india+government+scheme&mode=artlist&maxrecords=250&format=json`
  - GKG (Global Knowledge Graph): BigQuery-based dataset
  - TV/Radio monitoring: https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/
- **Access Method**: 
  - Doc API: Free, no auth required, query by keyword
  - BigQuery: Free tier (1TB/month query), full GKG dataset
  - Export files: Bulk download from http://data.gdeltproject.org
- **Rate Limits**: Doc API: ~1000 requests/hour (unofficial). BigQuery: 1TB/month free tier.
- **Data Format**: JSON (Doc API), BigQuery tables, CSV (bulk exports)
- **Reliability**: ⭐⭐⭐⭐ Excellent for tracking media coverage of Indian government scheme failures. Covers 100+ languages including Hindi/regional Indian languages. Tone/sentiment scores included. Near real-time.
- **Key advantage**: Can search for specific scheme failures, protests, health crises at scale across global media.

### 6.2 ACLED (Armed Conflict Location & Event Data)
- **URL**: https://acleddata.com
- **API**: https://acleddata.com/acleddatanew/data-export-tool/ (download tool), API at https://api.acleddata.com/acled/read
- **Access Method**: 
  - Free API with registration (academic/humanitarian use)
  - Covers India with protest events, violence against civilians, riots
  - Query by country, date range, event type
- **Rate Limits**: API: varies by plan. Bulk downloads available after registration.
- **Data Format**: CSV, JSON via API
- **Reliability**: ⭐⭐⭐⭐⭐ Gold standard for conflict/protest tracking. Covers India with event-level geocoded data. Excellent for tracking scheme-related protests, farmer movements, water/land conflicts.
- **Key data**: Event type, actors, location (lat/lng), fatalities, notes. Filter for India-specific events.

### 6.3 EventRegistry
- **URL**: https://eventregistry.org
- **API**: Python library `eventregistry` or REST API at `http://eventregistry.org/api/v1/`
- **Access Method**: 
  - Free tier: 1000 requests/day, limited historical access
  - Paid: $99/month+ for full access
  - Search by concept, category, location, date range
- **Rate Limits**: Free: 1000/day. Paid: varies.
- **Data Format**: JSON
- **Reliability**: ⭐⭐⭐⭐ Good for concept-based event tracking. Aggregates from 300K+ news sources. Can track "PM-KISAN", "water contamination India" etc. Articles have sentiment, concepts, categories.

### 6.4 GNews API
- **URL**: https://gnews.io
- **API**: `https://gnews.io/api/v4/search?q=india+government&token=API_KEY`
- **Access Method**: 
  - Free tier: 100 requests/day, 10 articles per request
  - Pro: $19.99/month (unlimited)
- **Rate Limits**: Free: 100/day. Pro: unlimited.
- **Data Format**: JSON (title, description, content, URL, image, publishedAt, source)
- **Reliability**: ⭐⭐⭐ Decent news aggregator. Covers major Indian English-language sources. Limited for regional language coverage.

### 6.5 NewsAPI
- **URL**: https://newsapi.org
- **API**: `https://newsapi.org/v2/everything?q=india+government&apiKey=API_KEY`
- **Access Method**: 
  - Free tier: 100 requests/day, limited to articles <1 month old
  - Business: $449/month
- **Rate Limits**: Free: 100/day, 100 results per query. Paid: higher.
- **Data Format**: JSON
- **Reliability**: ⭐⭐⭐ Good for recent English-language news. Same-day articles only on paid plan. Limited historical access on free tier.

### 6.6 Indian News APIs
- **PIB (Press Information Bureau)**: https://pib.gov.in - Government press releases. No API, but predictable URL structure for scraping.
- **PRS Legislative Research**: https://prsindia.org - Bill analysis, MP attendance, committee reports. No API, but highly structured data.
- **IndiaSpend**: https://www.indiaspend.com - Data journalism. Articles are structured but no API.
- **Factly**: https://factly.in - Fact-checks with data. No API.
- **The Hindu Data**: https://www.thehindu.com/data - Occasional data stories.

---

## 7. Fact-Checking Data

### 7.1 Alt News
- **URL**: https://www.altnews.in
- **Access Method**: 
  - No public API
  - Archives available at https://www.altnews.in/archives/
  - Categorized by: fact-checks, hate speech, misinformation
  - Scrapable with standard web crawling (no aggressive rate limiting observed)
- **Rate Limits**: No formal limits; be respectful (1-2 req/sec)
- **Data Format**: HTML articles with structured metadata (date, category, tags)
- **Reliability**: ⭐⭐⭐⭐⭐ IFCN-certified fact-checker. Covers political misinformation, communal claims, doctored images/videos. Most prominent Indian fact-checker.

### 7.2 Boom Live
- **URL**: https://www.boomlive.in
- **Access Method**: 
  - No public API
  - Fact-check archive at https://www.boomlive.in/fact-check
  - Scrapable HTML
- **Rate Limits**: No formal limits
- **Data Format**: HTML articles
- **Reliability**: ⭐⭐⭐⭐ IFCN-certified. Covers India + Bangladesh. Good for viral WhatsApp misinformation tracking.

### 7.3 Vishwas News
- **URL**: https://www.vishwasnews.com
- **Access Method**: 
  - No public API
  - Hindi-language fact-checking
- **Data Format**: HTML articles
- **Reliability**: ⭐⭐⭐ Hindi-language fact-checker. Smaller corpus than Alt News/Boom.

### 7.4 Factly
- **URL**: https://factly.in
- **Access Method**: No API, but data-driven fact-checks with source links
- **Reliability**: ⭐⭐⭐⭐ Excellent for data-backed government claims verification. Often cites RTI data.

### 7.5 Google Fact Check Explorer
- **URL**: https://toolbox.google.com/factcheck/explorer
- **API**: Google Fact Check Tools API at `https://factchecktools.googleapis.com/v1alpha1/claims:search`
- **Access Method**: Free API with Google API key. Search by query, filter by publisher, language.
- **Rate Limits**: Standard Google API limits (varies)
- **Data Format**: JSON (claim text, claimant, review publisher, rating, URL)
- **Reliability**: ⭐⭐⭐⭐ Aggregates fact-checks from multiple publishers. Good for comprehensive search across Indian fact-checkers.

### 7.6 ClaimReview Schema (Structured Data)
- All major fact-checkers use Google's ClaimReview schema markup
- Can be scraped from any fact-checking site to extract: claim, rating, date, publisher
- Example publishers using this in India: Alt News, Boom Live, Factly, The Quint, Vishwas News

---

## 8. RTI (Right to Information) Data

### 8.1 Online RTI Portal
- **URL**: https://rtionline.gov.in
- **Access Method**: 
  - File RTIs online to Central Government departments
  - No structured database of past RTI responses
  - Individual responses available to the filer only
- **Reliability**: ⭐⭐ File RTIs, don't browse data.

### 8.2 RTIWatch / RTI Collections
- **RTIwala**: https://rtiwala.in - RTI filing service with some public responses
- **RTI India**: https://www.rtiindia.org - Forum discussing RTI responses, not structured data
- **Satark Nagrik Sangathan**: https://www.satark.in - RTI advocacy, publishes some structured analysis
- **Access Method**: No unified structured dataset of RTI responses exists publicly

### 8.3 Where to Find RTI Data as Structured Information
1. **PRS Legislative Research**: https://prsindia.org - Uses RTI data for parliamentary analysis
2. **Factly**: https://factly.in - Regularly publishes data stories based on RTI responses
3. **IndiaSpend**: Uses RTI data for investigative stories
4. **Spend analysis**: https://pfrda.org.in, https://www.india.gov.in - Government portals sometimes publish data that originated from RTI pressure
5. **Individual NGOs**: Many publish RTI-obtained data on their websites (e.g., water quality, education spending)

### 8.4 Central Information Commission (CIC) Decisions
- **URL**: https://cic.gov.in
- **Access Method**: CIC decision database searchable online
- **Data Format**: Web search, PDF decisions
- **Reliability**: ⭐⭐⭐ Shows RTI appeals and decisions. Useful for understanding data access disputes.

---

## 9. Court Cases & Legal Data

### 9.1 Indian Kanoon
- **URL**: https://indiankanoon.org
- **API**: No official API. `https://indiankanoon.org/search/?formInput=government+scheme+failure` for searching.
- **Access Method**: 
  - Web search with URL-based queries
  - Search by court, year, party name, free text
  - Scrapable (no aggressive blocking, but Cloudflare protection)
  - Open-source clone: https://github.com/soumyadeb/naksha (unofficial)
- **Rate Limits**: Be respectful (~1 req/sec). Cloudflare may throttle rapid requests.
- **Data Format**: HTML with structured metadata (case name, court, date, citations)
- **Reliability**: ⭐⭐⭐⭐⭐ Most comprehensive free Indian legal database. Covers Supreme Court, all High Courts, tribunals, district courts. 1M+ judgments.
- **Key use**: Search for scheme-related litigation, PILs, contempt cases against officials

### 9.2 Supreme Court of India
- **URL**: https://main.sci.gov.in
- **Case Status**: https://main.sci.gov.in/case-status
- **Judgments**: https://main.sci.gov.in/judgments
- **Access Method**: 
  - Case status search by case number/party/year
  - Judgments searchable and downloadable as PDF
  - No public API; web interface only
- **Rate Limits**: Site can be slow; CAPTCHA on some pages
- **Data Format**: PDF judgments, web search
- **Reliability**: ⭐⭐⭐⭐ Official source. Judgments comprehensive but interface is clunky.

### 9.3 eCourts (District Courts)
- **URL**: https://ecourts.gov.in
- **Access Method**: 
  - Case search across all district courts
  - Orders/judgments available as PDF
  - No API but URL-structured search
- **Data Format**: Web search, PDF
- **Reliability**: ⭐⭐⭐ Covers 700+ district courts. Data completeness varies by court.

### 9.4 India Code (Statutes)
- **URL**: https://www.indiacode.nic.in
- **Access Method**: Searchable database of all Central and State Acts
- **Reliability**: ⭐⭐⭐⭐ Official legal text repository.

### 9.5 Nyaaya
- **URL**: https://nyaaya.org
- **Access Method**: Plain-language legal information. No API. Good for understanding legal framework around government schemes.
- **Reliability**: ⭐⭐⭐ Non-profit legal explainer.

---

## 10. Social Media Monitoring

### 10.1 Twitter/X API
- **URL**: https://developer.twitter.com
- **API**: v2 API at `https://api.twitter.com/2/`
- **Access Method**: 
  - **Free tier**: Read-only, 1,500 tweets/month, basic search
  - **Basic ($100/month)**: 10,000 tweets/month, filtered stream
  - **Pro ($5,000/month)**: 1M tweets/month, full archive search
  - **Enterprise**: Custom pricing for full firehose
- **Rate Limits**: 
  - Free: 1,500 tweets/month
  - Basic: 10,000/month
  - Pro: 1M/month
  - Search: 60 requests/15min (Basic), 300/15min (Pro)
- **Data Format**: JSON (tweet text, author, metrics, geo, created_at)
- **Reliability**: ⭐⭐⭐ Best platform for tracking government scheme mentions in India. Key hashtags: #MGNREGA, #PMKisan, #JalJeevanMission, #AyushmanBharat. Hindi/regional language tweets increasingly important.
- **Key queries**: 
  - `#PMKisan lang:hi OR lang:en`
  - `"water contamination" OR "पानी प्रदूषण" place_country:IN`
  - `"government scheme failure" OR "योजना विफल"`
- **Sentiment**: API returns text; run sentiment analysis (VADER, transformer models) locally.
- **Important**: Many Indian users use Hindi/regional languages. Plan for multilingual NLP.

### 10.2 Reddit (r/india, r/IndiaSpeaks, etc.)
- **URL**: https://www.reddit.com
- **API**: Reddit API at `https://oauth.reddit.com` (free tier: 100 req/min)
- **Access Method**: 
  - Free: 100 requests/minute
  - Search posts by subreddit, keyword, date
  - Pushshift/Arctic Shift for historical data: https://arctic-shift.photon-reddit.com
- **Rate Limits**: 100/min (free)
- **Data Format**: JSON
- **Reliability**: ⭐⭐⭐ Good for citizen complaints about schemes. r/india, r/IndiaSpeaks, r/IndianStreetBets have relevant discussions. Not representative of rural India.

### 10.3 YouTube Comments (Government Channels)
- **Access**: YouTube Data API v3 (free quota: 10,000 units/day)
- **Key channels**: PM India, MyGov India, Ministry channels
- **Rate Limits**: 10,000 quota units/day (free). Comments: 1 unit each.
- **Data Format**: JSON
- **Reliability**: ⭐⭐ Government YouTube comments often contain citizen complaints.

### 10.4 Alternative Social Monitoring
- **Koo**: Indian Twitter alternative, limited API access
- **ShareChat**: Popular in rural India, no public API
- **WhatsApp**: No API for monitoring public groups. Fact-checkers monitor forwarded messages manually.
- **Public Telegram Groups**: Some government-related groups scrapable with Telegram API

---

## 11. Budget & Expenditure Data

### 11.1 Union Budget Data
- **URL**: https://www.indiabudget.gov.in
- **Access Method**: Budget documents (PDF, Excel) for Union and Railway budgets
- **Data Format**: PDF, Excel
- **Reliability**: ⭐⭐⭐⭐ Official budget documents with scheme-wise allocations.

### 11.2 PFMS (Public Financial Management System)
- **URL**: https://pfms.nic.in
- **Access Method**: Shows fund flow for central schemes. State/district level.
- **Reliability**: ⭐⭐⭐⭐ Actual expenditure tracking for CSS (Centrally Sponsored Schemes).

### 11.3 CAG (Comptroller and Auditor General)
- **URL**: https://cag.gov.in
- **Access Method**: Audit reports on government schemes (PDF)
- **Reliability**: ⭐⭐⭐⭐⭐ CAG reports are the gold standard for identifying scheme failures. Reports cover financial irregularities, implementation gaps, beneficiary fraud.

### 11.4 State Finance Portals
- **e-Kuber**: RBI's core banking system for government payments
- **State treasuries**: Most states have online treasury systems (e.g., https://treasury.delhi.gov.in)

---

## 12. Census & Demographic Data

### 12.1 Census of India
- **URL**: https://censusindia.gov.in
- **Access Method**: 2011 Census data available (2021 Census delayed indefinitely). D-series tables.
- **Data Format**: PDF, Excel, some web-based queries
- **Reliability**: ⭐⭐⭐⭐ Official demographic baseline. District/tehsil level. Aging (2011 data) but still the reference.

### 12.2 Population Projections
- **Source**: Technical Group on Population Projections (National Commission on Population)
- **Access Method**: Published report with state-level projections 2011-2036

---

## 13. GIS & Satellite Data

### 13.1 Bhuvan (ISRO)
- **URL**: https://bhuvan.nrsc.gov.in
- **Access Method**: Satellite imagery, land use, watershed data
- **Data Format**: GIS services (WMS/WMTS), downloadable shapefiles for some layers
- **Reliability**: ⭐⭐⭐⭐ Good for spatial analysis of scheme implementation.

### 13.2 OpenStreetMap (India)
- **URL**: https://www.openstreetmap.org
- **API**: Overpass API at `https://overpass-api.de/api/interpreter`
- **Use**: Village boundaries, roads, water bodies, health/education facility locations
- **Reliability**: ⭐⭐⭐ Community-mapped. Good urban coverage, variable rural.

---

## Summary: Quick Reference Matrix

| Source | API? | Free? | Real-time? | Granularity | Best For |
|--------|------|-------|------------|-------------|----------|
| data.gov.in | Yes | Yes | No | District+ | General indicators |
| MGNREGA | URL-based | Yes | Near-RT | Panchayat | Employment monitoring |
| PM-KISAN | No (scrape) | Yes | Monthly | State/District | Beneficiary tracking |
| Jal Jeevan | No (scrape) | Yes | Updated | Village | Water connections |
| Ayushman Bharat | Dashboard | Yes | Updated | District | Health claims |
| NFHS microdata | Via DHS | Yes | No | District | Health benchmarks |
| IDSP | No (PDF) | Yes | Weekly | State | Disease outbreaks |
| UDISE+ | No (scrape) | Yes | Annual | School | Education |
| GDELT | Yes | Yes | Near-RT | Global | Media coverage |
| ACLED | Yes | Free* | Updated | Event | Protests/conflict |
| Indian Kanoon | No (scrape) | Yes | Updated | Court/Citation | Legal cases |
| CAG Reports | No (PDF) | Yes | Periodic | Scheme | Audit failures |
| Twitter/X API | Yes | $100+ | Real-time | Tweet | Citizen complaints |
| Alt News | No (scrape) | Yes | Updated | Article | Misinformation |
| CGWB | Reports | Yes | Periodic | Block | Groundwater |
| CPCB | Reports | Yes | Periodic | Station | Water quality |

*Free for academic/humanitarian use*

---

## Recommended Monitoring Stack

For **at-scale scheme failure monitoring**, prioritize:

1. **Media monitoring**: GDELT Doc API (free, no auth, keyword search) + EventRegistry (free tier)
2. **Scheme implementation**: MGNREGA reports (richest dataset), Ayushman Bharat dashboard, UDISE+
3. **Health emergencies**: IDSP weekly reports (scrape PDFs for outbreak data)
4. **Citizen voice**: Twitter API (Basic $100/month) for real-time sentiment
5. **Fact verification**: Alt News + Google Fact Check API
6. **Legal accountability**: Indian Kanoon (scrape for scheme-related PILs)
7. **Financial accountability**: CAG audit reports (gold standard for identifying fraud)
8. **Demographic baseline**: NFHS microdata from DHS Program
