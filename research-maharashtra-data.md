# Maharashtra Open Data Sources for Geospatial Intelligence Dashboard

> **Research Date**: 2026-04-22
> **Status**: Comprehensive listing of verified and known open data sources

---

## 1. Maharashtra Government Open Data Portals

### 1.1 data.gov.in (Open Government Data Platform India)
- **URL**: https://data.gov.in (filter by State → Maharashtra)
- **Data Format**: CSV, JSON, XML, XLS — with REST APIs for many datasets
- **Update Frequency**: Varies by dataset (some monthly, some yearly)
- **Download Method**: Direct download or API with API key registration
- **Geo Coordinates**: Some datasets include district/taluka codes; boundary mapping needed
- **Access**: Free, Government Open Data License — India (GODL)
- **Key Maharashtra Datasets Available**:
  - District-wise population & demographics
  - Agriculture production by district
  - Health facility performance (monthly)
  - Education statistics (district-level)
  - Census data (2011)
- **API Docs**: https://www.data.gov.in/apis
- **Note**: Search `Maharashtra` in catalog; filter by `State Government - Maharashtra` as organization

### 1.2 Maharashtra Remote Sensing Application Centre (MRSAC)
- **URL**: https://mrsac.maharashtra.gov.in
- **Data Format**: GIS layers, Shapefiles, GeoTIFF, KML, WMS/WFS services
- **Update Frequency**: Variable (land use updates every 2-5 years, satellite imagery periodically)
- **Download Method**: Web portal download; WMS/WFS for live map layers
- **Geo Coordinates**: ✅ Full GIS data with spatial coordinates
- **Key Datasets**:
  - Land use / Land cover maps of Maharashtra
  - Soil maps
  - Groundwater potential zones
  - Administrative boundaries (district, taluka, village)
  - Infrastructure mapping
  - Forest cover data
  - Wetland inventory
- **Access**: Free registration required for some layers
- **Note**: Critical primary source for Maharashtra geospatial data

### 1.3 Maharashtra State Remote Sensing & Application Centre — GeoPortal
- **URL**: https://mrsac.maharashtra.gov.in/DIS
- **Data Format**: WMS, WFS, GeoJSON, Shapefile exports
- **Geo Coordinates**: ✅ Native GIS format
- **Note**: Online map viewer with layer overlay capability

### 1.4 Maharashtra Engineering Research Institute (MERI)
- **URL**: https://meri.maharashtra.gov.in
- **Data Format**: Reports, PDFs with some data tables
- **Key Data**: Dam designs, irrigation infrastructure
- **Geo Coordinates**: Limited

### 1.5 PMC Open Data (Pune Municipal Corporation)
- **URL**: https://www.pmc.gov.in/en/b/pmc-open-data
- **Data Format**: CSV, JSON
- **Update Frequency**: Regular updates by departments
- **Download Method**: Direct download from portal
- **Geo Coordinates**: Some datasets include location data
- **Note**: City-level open data, useful for Pune-specific dashboards

### 1.6 Maharashtra State Data Centre (SDC)
- **URL**: Managed by NIC Maharashtra
- **Data Format**: Various (API access via department portals)
- **Note**: Central data hub; actual data accessible through individual department portals:
  - https://mahaboc.maharashtra.gov.in (land records)
  - https://igrmaharashtra.gov.in (registration data)
  - Various other `*.maharashtra.gov.in` portals

---

## 2. District-Level Data (Population, Agriculture, Water, Health, Education)

### 2.1 Census of India 2011
- **URL**: https://censusindia.gov.in
- **Data Format**: CSV, XLS, PDF
- **Geo Coordinates**: District/taluka codes (need boundary mapping — see Section 8)
- **Key Data**:
  - Population by district/taluka/village
  - Demographics (age, gender, literacy, SC/ST)
  - Households, amenities, occupation
  - Economic activity data
- **Direct Access**: https://censusindia.gov.in/census.website/data/data-2011.html
- **Download**: Bulk download available

### 2.2 National Family Health Survey (NFHS-5)
- **URL**: https://nfhs.gov.in
- **Data Format**: CSV, XLS, SPSS, Stata
- **Update Frequency**: Last round 2019-21
- **Geo Coordinates**: District-level data
- **Key Data**: Health, nutrition, family planning, maternal & child health

### 2.3 District Information System for Education (DISE) / UDISE+
- **URL**: https://udiseplus.gov.in
- **Data Format**: CSV, XLS
- **Geo Coordinates**: District/block codes
- **Key Data**: Schools, enrollment, infrastructure, teachers — district/block level

### 2.4 Ministry of Agriculture — Agristack / eNAM
- **URL**: https://enam.gov.in and https://agriwelfare.gov.in
- **Data Format**: CSV, JSON, API
- **Key Data**: Crop production, mandi prices, MSP data
- **Geo Coordinates**: State/district codes

### 2.5 Directorate of Economics & Statistics (DES) Maharashtra
- **URL**: https://des.maharashtra.gov.in
- **Data Format**: XLS, PDF
- **Key Data**: Agricultural statistics, economic data, district-wise GSDP
- **Geo Coordinates**: District identifiers

### 2.6 NITI Aayog — National Data & Analytics Platform (NDAP)
- **URL**: https://ndap.niti.gov.in
- **Data Format**: CSV, API
- **Key Data**: District Development Indices, SDG India Index, health & education indicators
- **Geo Coordinates**: District-level breakdowns
- **Note**: Clean, harmonized cross-ministry data

### 2.7 India Water Resources Information System (India-WRIS)
- **URL**: https://indiawris.gov.in
- **Data Format**: GeoJSON, Shapefile, CSV, WMS
- **Geo Coordinates**: ✅ Full GIS
- **Key Data**:
  - River basins, watersheds, sub-basins
  - Groundwater levels
  - Water bodies
  - Dam & reservoir data
  - Irrigation infrastructure
- **Download**: Portal download + API

### 2.8 National Sample Survey (NSS) — MoSPI
- **URL**: https://mospi.gov.in
- **Data Format**: CSV, STATA, SPSS
- **Key Data**: Consumer expenditure, employment, health, education surveys
- **Geo Coordinates**: State/district level sampling

---

## 3. Real-Time Data Feeds

### 3.1 Indian Meteorological Department (IMD) — Weather
- **URL**: https://mausam.imd.gov.in and https://imdawsapi.imd.gov.in
- **Data Format**: JSON (API), CSV, XML
- **Update Frequency**: Real-time (hourly for stations, daily for districts)
- **Download Method**: REST API (requires API key) + bulk data download
- **Geo Coordinates**: ✅ Station coordinates included
- **Key Data**:
  - Current weather by station (temperature, humidity, rainfall, wind)
  - District rainfall data (daily)
  - Weather warnings (severe weather bulletins)
  - Forecast data (7-day)
- **Maharashtra Specific**: ~50+ IMD stations across Maharashtra
- **API**: https://imdawsapi.imd.gov.in/ (public API endpoints)
- **Chirps Alternative**: https://chirpsdata.ucsb.edu (satellite rainfall, daily, 0.05° grid)

### 3.2 Central Water Commission (CWC) — River Water Levels
- **URL**: https://ffs.india-water.gov.in (Flood Forecasting System)
- **Data Format**: JSON, CSV, Web API
- **Update Frequency**: Real-time (every 15 min to 1 hour)
- **Download Method**: Web portal + API
- **Geo Coordinates**: ✅ Station lat/lon included
- **Key Data**:
  - River gauge levels at flood forecasting stations
  - Warning levels, danger levels
  - Reservoir storage levels (weekly bulletins)
  - River discharge data
- **Maharashtra**: Key rivers — Godavari, Krishna, Tapi, Wardha, Penganga

### 3.3 CPCB — Air Quality (AQI)
- **URL**: https://cpcb.nic.in/air-quality-data/
- **Data Format**: CSV, JSON (via API), Dashboard
- **Update Frequency**: Real-time (hourly)
- **Download Method**: Web dashboard + REST API
- **Geo Coordinates**: ✅ Station lat/lon included
- **Key Data**:
  - AQI at monitoring stations (PM2.5, PM10, NO2, SO2, CO, O3)
  - 24-hour averages, trends
- **Maharashtra Stations**: Mumbai (multiple), Pune, Nagpur, Nashik, Aurangabad, Thane
- **Public API**: Available via data.gov.in — "Real-time air quality" dataset

### 3.4 NHAI / Ministry of Road Transport — Traffic
- **URL**: https://nhai.gov.in (limited real-time data)
- **Data Format**: PDF reports, some CSV
- **Update Frequency**: Monthly/quarterly
- **Geo Coordinates**: Highway numbers, toll plaza data
- **Alternative**: OpenStreetMap traffic data, Google Maps API (commercial)
- **Limited**: Government real-time traffic data for Maharashtra is not openly available; use OSM + crowd-sourced data

### 3.5 Open-Meteo (Weather API — Free Alternative)
- **URL**: https://open-meteo.com
- **Data Format**: JSON API
- **Update Frequency**: Real-time (hourly), 16-day forecast
- **Geo Coordinates**: ✅ Any lat/lon coordinate
- **Access**: Free, no API key required
- **Note**: Good complement to IMD; has historical data back to 1940

---

## 4. Government Schemes — District-Wise Data

### 4.1 PM-KISAN
- **URL**: https://pmkisan.gov.in
- **Data Format**: Web-based dashboard (no bulk CSV download)
- **Data Available**: Beneficiary count by state/district/block, payment status
- **Workaround**: Data scraping or use the dashboard filters; data.gov.in may have periodic exports
- **Geo Coordinates**: District/block codes

### 4.2 MGNREGA (Mahatma Gandhi NREGA)
- **URL**: https://nrega.nic.in and https://nregastrep.nic.in
- **Data Format**: CSV, XML, XLS (quarterly reports)
- **Download**: Bulk download from reports section
- **Key Data**: Employment demand, person-days generated, works completed — by district/block/panchayat
- **Geo Coordinates**: Block/panchayat codes

### 4.3 Jal Jeevan Mission (Har Ghar Jal)
- **URL**: https://jaljeevanmission.gov.in
- **Data Format**: Dashboard (state/district level)
- **Key Data**: Household tap connections, water quality testing, functionality status
- **Geo Coordinates**: District-level
- **Note**: Dashboard shows real-time progress; bulk data may require data requests

### 4.4 Swachh Bharat Mission (Grameen)
- **URL**: https://swachhbharatmission.ddws.gov.in and https://sbm.gov.in
- **Data Format**: Dashboard, Excel exports
- **Key Data**: ODF status, toilet construction, solid waste management by district
- **Geo Coordinates**: District/block codes

### 4.5 Awasoft (PM Awas Yojana — Housing)
- **URL**: https://rhreporting.nic.in
- **Data Format**: Dashboard, Excel
- **Key Data**: Housing sanction, completion, beneficiary data by district

### 4.6 IAY/PMAY Online MIS
- **URL**: https://aawasoft.nic.in
- **Data**: Rural housing scheme data by block/panchayat

### 4.7 PFMS (Public Financial Management System)
- **URL**: https://pfms.nic.in
- **Data**: Scheme-wise expenditure, fund flow tracking
- **Note**: Some scheme expenditure data available in public domain

### 4.8 eSwaraj / Ministry of Panchayati Raj
- **URL**: https://e-swaraj.gov.in
- **Key Data**: Local government spending, scheme implementation at panchayat level

---

## 5. Infrastructure Data (Roads, Bridges, Dams, Hospitals, Schools)

### 5.1 NHAI — National Highways
- **URL**: https://ihmshelp.nhai.org (Indian Highways Management System)
- **Data Format**: Map services, some GeoJSON
- **Key Data**: National highway routes, toll plazas, km markers
- **Geo Coordinates**: ✅ Route geometry

### 5.2 PMGSY (Rural Roads)
- **URL**: https://omms.nic.in (Online Management, Monitoring and Accounting System)
- **Data Format**: CSV, Excel
- **Key Data**: Rural roads built, connectivity status by district
- **Geo Coordinates**: ✅ Road segments with coordinates
- **Note**: OSMN is a related visualization tool

### 5.3 National Dam Safety Authority / CWC
- **URL**: https://cwc.gov.in
- **Key Data**: Dam inventory, reservoir levels, safety status
- **Geo Coordinates**: ✅ Dam coordinates available from India-WRIS
- **Download**: Bulk dam data via India-WRIS

### 5.4 NHP (National Health Profile) / HMIS
- **URL**: https://mohfw.nic.in and https://hmis.nhp.gov.in
- **Data Format**: CSV, Excel
- **Key Data**: Hospitals, PHCs, CHCs, sub-centers by district
- **Geo Coordinates**: District/block codes
- **Also**: Ayushman Bharat PMJAY dashboard at https://abdm.gov.in

### 5.5 UDISE+ (School Infrastructure)
- **URL**: https://udiseplus.gov.in
- **Data Format**: CSV, Excel
- **Key Data**: Schools (govt/private), buildings, toilets, electricity, computers by district/block
- **Geo Coordinates**: Block/district codes

### 5.6 OpenStreetMap (OSM) — Infrastructure
- **URL**: https://overpass-turbo.eu and https://download.geofabrik.de
- **Data Format**: GeoJSON, Shapefile, OSM XML
- **Download Method**: Overpass API query or bulk download from Geofabrik
- **Geo Coordinates**: ✅ Full geospatial
- **Key Data**: Roads, buildings, amenities, points of interest, water bodies
- **Maharashtra**: https://download.geofabrik.de/asia/india/maharashtra.html
- **Note**: Very rich dataset; buildings, roads, hospitals, schools, all tagged with OSM attributes

---

## 6. Agriculture Data

### 6.1 Soil Health Card Scheme
- **URL**: https://soilhealth.dac.gov.in
- **Data Format**: CSV, Excel, Dashboard
- **Key Data**: Soil nutrient status, pH, organic carbon — by village/block
- **Geo Coordinates**: Village/block codes
- **Maharashtra**: Reports available by district

### 6.2 IMD Rainfall Data
- **URL**: https://mausam.imd.gov.in
- **Data Format**: CSV, JSON
- **Key Data**: District/sub-division rainfall, departure from normal, cumulative seasonal rainfall
- **Geo Coordinates**: ✅ Station coordinates
- **Historical**: Available via https://www.imdpune.gov.in/cmpg/Griddata/Rainfall_25_NetCDF.html (gridded, 0.25° × 0.25°)

### 6.3 Groundwater Level Data — CGWB
- **URL**: https://www.cgwb.gov.in and https://gwboard.cgwb.gov.in
- **Data Format**: CSV, Excel, reports
- **Key Data**: Groundwater levels, water table depth, quality parameters
- **Geo Coordinates**: ✅ Well locations with lat/lon
- **Frequency**: Pre-monsoon and post-monsoon measurements
- **Maharashtra**: Data for all 36 districts

### 6.4 Crop Data — DAC&FW / MNCFC
- **URL**: https://cac.dac.gov.in (Comprehensive Area & Crop Data)
- **Data Format**: CSV, Excel
- **Key Data**: Crop area, production, yield by district — kharif & rabi seasons
- **Source**: Agriculture Census, State of Indian Agriculture reports
- **Geo Coordinates**: District codes

### 6.5 FASAL / MOSDAC (Satellite Crop Assessment)
- **URL**: https://mosdac.gov.in and https://fasal.gov.in
- **Data Format**: GeoTIFF, CSV, JSON
- **Key Data**: Crop health indices (NDVI), crop area estimation, yield forecast
- **Geo Coordinates**: ✅ Satellite gridded data
- **Note**: ISRO satellite-derived crop monitoring data

### 6.6 India-WRIS — Irrigation & Water Resources
- **URL**: https://indiawris.gov.in
- **Data Format**: GeoJSON, CSV, WMS
- **Key Data**: Canal networks, command areas, groundwater, water quality
- **Geo Coordinates**: ✅ Full GIS

---

## 7. Disaster Data

### 7.1 NDMA (National Disaster Management Authority)
- **URL**: https://ndma.gov.in
- **Key Data**: National disaster risk maps, guidelines, preparedness data
- **Geo Coordinates**: Varies

### 7.2 National Remote Sensing Centre (NRSC) — Bhuvan GeoPortal
- **URL**: https://bhuvan-app3.nrsc.gov.in/disaster/disaster.php
- **Data Format**: WMS, WFS, GeoJSON, Shapefile
- **Geo Coordinates**: ✅ Full GIS
- **Key Data**:
  - Flood maps (during flood events)
  - Landslide susceptibility maps
  - Drought monitoring (Vegetation Health Index)
  - Fire hotspot data (FIRMS/VIIRS)
- **Note**: Real-time during events + historical data

### 7.3 GSI (Geological Survey of India) — Earthquake & Landslide Data
- **URL**: https://www.gsi.gov.in
- **Key Data**: Seismic zonation map, landslide susceptibility zones
- **Data Format**: PDF maps, some digital data
- **Geo Coordinates**: ✅ Zonation maps with geographic boundaries
- **Seismic Zones**: Maharashtra falls in Zone II-III (moderate risk)
- **Download**: BIS seismic zonation maps available

### 7.4 IMD — Seismic Data
- **URL**: https://seismology.gov.in
- **Data Format**: CSV, JSON
- **Key Data**: Earthquake catalog, felt reports
- **Geo Coordinates**: ✅ Epicenter coordinates

### 7.5 Flood Hazard Zonation Maps
- **URL**: CWC — https://cwc.gov.in/flood-management
- **Data Format**: PDF, some GIS layers
- **Key Data**: Flood-prone areas, return period flood maps
- **Also**: India-WRIS flood zone overlays

### 7.6 Drought Monitoring — IMD
- **URL**: https://mausam.imd.gov.in
- **Key Data**: Weekly drought assessment, rainfall deviation maps
- **Geo Coordinates**: District/taluka level
- **Format**: Maps + data tables

### 7.7 Maharashtra State Disaster Management Authority (MSDMA)
- **URL**: https://sdma.maharashtra.gov.in
- **Data Format**: Reports, maps
- **Key Data**: State disaster management plan, hazard maps
- **Geo Coordinates**: Administrative boundaries

### 7.8 FIRMS (NASA Fire Information)
- **URL**: https://firms.modaps.eosdis.nasa.gov
- **Data Format**: CSV, JSON, KML, Shapefile, GeoJSON
- **Update Frequency**: Near real-time (every 3-6 hours)
- **Geo Coordinates**: ✅ Pixel coordinates (0.375 km resolution)
- **Note**: Active fire detections for Maharashtra forest fire monitoring

### 7.9 Global Earthquake Model (GEM) — OpenQuake
- **URL**: https://www.globalquakemodel.org
- **Data Format**: CSV, GeoJSON, Shapefile
- **Key Data**: Seismic hazard models, exposure data, vulnerability functions
- **Geo Coordinates**: ✅ Gridded data

---

## 8. Census & Geographic Boundaries

### 8.1 Census 2011 Data — District/Taluka Level
- **URL**: https://censusindia.gov.in/census.website/data/data-2011.html
- **Data Format**: CSV, XLS, PDF
- **Key Data**: Primary Census Abstract (PCA), HH amenities, migration, SC/ST, religion
- **Geo Coordinates**: Census code (need boundary mapping)

### 8.2 Administrative Boundaries (GeoJSON/Shapefiles)

#### a) GADM (Global Administrative Areas)
- **URL**: https://gadm.org/download_country.html (India)
- **Data Format**: GeoJSON, Shapefile, RData, KMZ
- **Levels**: Country → State → District → Sub-district
- **Geo Coordinates**: ✅ Full polygon boundaries
- **Note**: Good quality, regularly updated. Download Level 2 for districts, Level 3 for talukas

#### b) HDX (Humanitarian Data Exchange)
- **URL**: https://data.humdata.org/dataset/?q=Maharashtra
- **Data Format**: GeoJSON, Shapefile, CSV
- **Key Data**: Administrative boundaries, population data, infrastructure
- **Geo Coordinates**: ✅
- **Note**: UN OCHA maintained; reliable boundaries

#### c) Datameet (Indian Civic Data)
- **URL**: https://github.com/datameet and https://datameet.org
- **Data Format**: GeoJSON, Shapefile, CSV
- **Key Data**: Parliamentary constituency boundaries, assembly constituency boundaries, district boundaries for India
- **Geo Coordinates**: ✅
- **Repository**: https://github.com/datameet/civic-data-boundaries
- **Note**: Community-maintained, very useful for India-specific boundaries

#### d) Survey of India (SOI)
- **URL**: https://surveyofindia.gov.in
- **Data Format**: Digital maps, some GeoTIFF
- **Key Data**: Topographic maps, administrative boundaries (official)
- **Geo Coordinates**: ✅ Official survey coordinates
- **Note**: Often requires formal data request; limited free access

#### e) OpenStreetMap
- **URL**: https://download.geofabrik.de/asia/india/maharashtra.html
- **Data Format**: OSM XML, PBF, Shapefile
- **Geo Coordinates**: ✅
- **Also**: Boundaries queryable via Overpass API

#### f) Harvard Dataverse — India Village-Level GIS
- **URL**: https://dataverse.harvard.edu/dataverse/india_gis
- **Data Format**: Shapefile
- **Geo Coordinates**: ✅ Village centroids
- **Note**: Historical boundaries matching census codes

### 8.3 Census Village/Town Level Boundaries
- **Source**: Bhuvan Village Boundary Maps
- **URL**: https://bhuvan-app3.nrsc.gov.in
- **Data**: Village-level boundaries (NRSC)
- **Note**: Request-based access; aligned with 2011 census

---

## 9. Election Data & Constituency Boundaries

### 9.1 Election Commission of India (ECI)
- **URL**: https://results.eci.gov.in and https://ecisveep.eci.gov.in
- **Data Format**: Web (scrapable), CSV from archive
- **Key Data**: Assembly & Lok Sabha constituency results, vote counts, turnout
- **Geo Coordinates**: Constituency codes (need boundary mapping)
- **Historical**: https://india.electionsarchive.org

### 9.2 Datameet — Election Boundaries
- **URL**: https://github.com/datameet/civic-data-boundaries
- **Data Format**: GeoJSON, Shapefile
- **Key Data**: Parliamentary and Assembly constituency boundaries for India including Maharashtra
- **Geo Coordinates**: ✅ Full polygon boundaries
- **Maharashtra**: 48 Lok Sabha, 288 Assembly constituencies

### 9.3 Trivedi Centre — Election Data
- **URL**: Various academic sources
- **Data Format**: CSV, XLS
- **Key Data**: Historical election results, party-wise data

### 9.4 Lok Dhaba (Lokniti)
- **URL**: https://lokdhaba.igidr.ac.in
- **Data Format**: CSV download
- **Key Data**: Candidate-level election data for Lok Sabha and State Assembly
- **Geo Coordinates**: Constituency codes

### 9.5 ECI EVM/VVPAT Data
- **URL**: https://results.eci.gov.in
- **Data**: Booth-level results (post-2019)
- **Note**: ECI publishes comprehensive results

---

## 10. Financial & Budget Data

### 10.1 Maharashtra State Budget
- **URL**: https://des.maharashtra.gov.in and https://mahabudget.maharashtra.gov.in
- **Data Format**: PDF, Excel, some CSV
- **Key Data**: Budget allocation by department, plan/non-plan expenditure
- **Update Frequency**: Annual
- **Geo Coordinates**: Department/ministry-based (not geographic)

### 10.2 OpenBudgetsIndia
- **URL**: https://openbudgetsindia.org
- **Data Format**: CSV, JSON
- **Key Data**: Union & state budgets, plan expenditure, scheme allocations
- **Geo Coordinates**: State-level (district breakdowns not always available)

### 10.3 CAG — Comptroller & Auditor General Reports
- **URL**: https://cag.gov.in
- **Data Format**: PDF
- **Key Data**: Audit reports for Maharashtra, expenditure reviews
- **Note**: Structured data extraction needed

### 10.4 RBI — State Finances
- **URL**: https://www.rbi.org.in
- **Data Format**: CSV, Excel
- **Key Data**: State-wise fiscal indicators, GSDP, revenue, debt
- **Geo Coordinates**: State-level only

### 10.5 PFMS (Expenditure Tracking)
- **URL**: https://pfms.nic.in
- **Key Data**: Real-time fund flow, scheme expenditure, beneficiary payments
- **Geo Coordinates**: State/district/block

### 10.6 GSTN — Tax Data (Limited)
- **URL**: https://gst.gov.in (limited public data)
- **Key Data**: GST collections by state (aggregate only)
- **Note**: District-level breakdown not publicly available

### 10.7 NITI Aayog — GSDP & District Development
- **URL**: https://ndap.niti.gov.in
- **Data Format**: CSV, API
- **Key Data**: District Domestic Product, development indices
- **Geo Coordinates**: District level

---

## 11. Additional / Cross-Cutting Sources

### 11.1 OpenStreetMap (Full Maharashtra Extract)
- **URL**: https://download.geofabrik.de/asia/india/maharashtra.html
- **Data Format**: OSM XML, PBF, Shapefile (via osmium/QGIS)
- **Geo Coordinates**: ✅ Everything georeferenced
- **Size**: ~800MB (PBF)
- **Update**: Daily
- **Key Data**: All roads, buildings, land use, amenities, POIs, water features

### 11.2 Bhuvan (ISRO's GeoPortal)
- **URL**: https://bhuvan.nrsc.gov.in
- **Data Format**: WMS/WFS, GeoJSON, Shapefile
- **Geo Coordinates**: ✅
- **Key Data**: Satellite imagery, thematic maps, multi-hazard zones, land use

### 11.3 Global Forest Watch
- **URL**: https://www.globalforestwatch.org/dashboards/country/IND/?category=forest-change
- **Data Format**: CSV, JSON API
- **Key Data**: Tree cover loss/gain, deforestation alerts, fire alerts
- **Geo Coordinates**: ✅ Pixel-level

### 11.4 WorldPop / GHSL
- **URL**: https://www.worldpop.org (India) and https://ghsl.jrc.ec.europa.eu
- **Data Format**: GeoTIFF (gridded population)
- **Key Data**: High-resolution population density, built-up area
- **Geo Coordinates**: ✅ 100m gridded

### 11.5 NASA SRTM / Copernicus DEM — Elevation
- **URL**: https://earthexplorer.usgs.gov (SRTM 30m) and https://copernicus-dem.com (90m)
- **Data Format**: GeoTIFF, HDF
- **Geo Coordinates**: ✅ Full terrain
- **Note**: Digital Elevation Model for Maharashtra

### 11.6 Datagov.in API Quick Reference
- **Base URL**: https://data.gov.in/backend/dms/v1/ogdp/resource
- **Auth**: Requires API key from data.gov.in registration
- **Rate Limits**: Standard gov API limits
- **Formats**: JSON, CSV, XML

---

## Quick-Reference Matrix

| Category | Best Source | Format | Geo? | Real-time? | Free? |
|---|---|---|---|---|---|
| Administrative Boundaries | GADM / Datameet | GeoJSON/Shapefile | ✅ | ❌ | ✅ |
| Population/Demographics | Census 2011 (data.gov.in) | CSV/XLS | Partial | ❌ | ✅ |
| Weather | IMD API + Open-Meteo | JSON | ✅ | ✅ | ✅ |
| River Water Levels | CWC Flood Forecasting | JSON/CSV | ✅ | ✅ | ✅ |
| Air Quality | CPCB | JSON/CSV | ✅ | ✅ | ✅ |
| Agriculture/Land Use | MRSAC + DAC&FW | Shapefile/CSV | ✅ | ❌ | ✅ |
| Groundwater | CGWB + India-WRIS | CSV/GeoJSON | ✅ | ❌ | ✅ |
| Rainfall | IMD Gridded + Chirps | NetCDF/GeoTIFF | ✅ | Daily | ✅ |
| Dams/Reservoirs | India-WRIS | GeoJSON/CSV | ✅ | Weekly | ✅ |
| Health Facilities | HMIS + NFHS | CSV/Excel | Partial | ❌ | ✅ |
| Schools | UDISE+ | CSV/Excel | Partial | ❌ | ✅ |
| Roads/Infrastructure | OSM + PMGSY | GeoJSON/Shapefile | ✅ | ❌ | ✅ |
| Schemes (MGNREGA) | nrega.nic.in | CSV/Excel | Partial | Near | ✅ |
| Schemes (PM-KISAN) | pmkisan.gov.in | Dashboard | Partial | Near | ✅ |
| Flood Zones | CWC + NRSC | GeoJSON/PDF | ✅ | Event | ✅ |
| Earthquake Zones | GSI + BIS | PDF/Shapefile | ✅ | ❌ | ✅ |
| Elections | ECI + Datameet | CSV/GeoJSON | ✅ | ❌ | ✅ |
| Budget | Maharashtra Budget | PDF/Excel | ❌ | Annual | ✅ |
| Forest Cover | GFW + FSI | GeoTIFF/CSV | ✅ | Alerts | ✅ |
| Population (gridded) | WorldPop | GeoTIFF | ✅ | ❌ | ✅ |
| Elevation/Terrain | SRTM/Copernicus | GeoTIFF | ✅ | ❌ | ✅ |
| Satellite Imagery | Bhuvan / Sentinel | GeoTIFF/WMS | ✅ | Varies | ✅ |

---

## Recommended Tech Stack for Dashboard

1. **Boundary Data**: GADM Level 2 (districts) + Datameet (constituencies)
2. **Base Map**: OpenStreetMap via Leaflet/Mapbox GL JS
3. **Weather**: IMD API + Open-Meteo API (backup)
4. **Water Levels**: CWC Flood Forecasting API
5. **Air Quality**: CPCB via data.gov.in API
6. **Agriculture**: MRSAC WMS layers + DAC&FW CSV
7. **Census**: Census 2011 via data.gov.in
8. **Schemes**: nrega.nic.in scraping / data.gov.in periodic exports
9. **Infrastructure**: OSM Overpass API (hospitals, schools, roads)
10. **Disaster**: NRSC Bhuvan + FIRMS (fires)
11. **Population Grid**: WorldPop GeoTIFF
12. **Elevation**: SRTM 30m GeoTIFF

---

## Data Access Notes

- **data.gov.in** requires free API key registration; rate limits apply
- **IMD API** requires registration; bulk historical data via Meteostat or Open-Meteo
- **CWC** API is publicly accessible for flood data
- **MRSAC** may require formal data request for some layers
- **OSM** Overpass API is free but rate-limited; use Geofabrik for bulk download
- **Census data** is freely available but in old formats; cleaning needed
- **GADM/Datameet** boundaries are free and open license

---

*Document generated for Maharashtra Geospatial Intelligence Dashboard project.*
*Next step: Prioritize sources and build data ingestion pipeline.*
