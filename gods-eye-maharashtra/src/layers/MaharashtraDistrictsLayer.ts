/**
 * MaharashtraDistrictsLayer — District boundaries with drill-down metrics popup
 * Clicking a district opens a detailed popup overlay with multi-domain stats
 */
import {
  Viewer, Cartesian3, Color, HeightReference, LabelStyle,
  VerticalOrigin, NearFarScalar, ScreenSpaceEventHandler,
  ScreenSpaceEventType, Entity, Cartographic, Math as CesiumMath,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';

export interface DistrictMetrics {
  name: string;
  lat: number;
  lng: number;
  population: string;
  popNumber: number;
  area: string;
  literacy: string;
  sexRatio: number;
  // Air Quality
  aqi: number;
  aqiCategory: string;
  pm25: number;
  // Water
  waterQuality: string;
  safeWaterPct: number;
  // Health
  hospitals: number;
  doctors: number;
  beds: number;
  // Agriculture
  agriLand: string;
  majorCrop: string;
  irrigatedPct: number;
  // Infrastructure
  roadLength: string;
  electrification: number;
  // Schemes
  pmKisan: number;
  mgnrega: number;
  ujjwala: number;
  // Misc
  crime: number;
  rainfall: number;
}

export class MaharashtraDistrictsLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'maharashtra-districts',
    name: 'District Boundaries',
    icon: '🗺️',
    description: 'Maharashtra district boundaries with population and drill-down metrics',
    category: 'maharashtra',
    color: '#00d4ff',
    enabled: true,
    opacity: 0.3,
    dataStoreKey: 'maharashtra-districts',
  };

  private handler: ScreenSpaceEventHandler | null = null;
  private popupEl: HTMLElement | null = null;
  private districtMap: Map<string, DistrictMetrics> = new Map();

  // Comprehensive district data (36 districts)
  private districts: DistrictMetrics[] = [
    { name: 'Mumbai',          lat: 19.076, lng: 72.877, population: '12.4M', popNumber: 12400000, area: '603 km²',     literacy: '89.7%', sexRatio: 838,  aqi: 156, aqiCategory: 'Unhealthy',       pm25: 78,  waterQuality: 'Poor',   safeWaterPct: 72,  hospitals: 845,  doctors: 18500, beds: 42000, agriLand: '12 km²',  majorCrop: 'N/A',        irrigatedPct: 0,   roadLength: '2,400 km', electrification: 100, pmKisan: 12000,  mgnrega: 8500,   ujjwala: 95000,  crime: 482, rainfall: 2400 },
    { name: 'Mumbai Suburban', lat: 19.050, lng: 72.830, population: '5.0M',  popNumber: 5000000,  area: '369 km²',     literacy: '87.2%', sexRatio: 822,  aqi: 132, aqiCategory: 'Unhealthy (SG)',  pm25: 62,  waterQuality: 'Moderate', safeWaterPct: 78,  hospitals: 320,  doctors: 8200,  beds: 18000, agriLand: '5 km²',   majorCrop: 'N/A',        irrigatedPct: 0,   roadLength: '1,800 km', electrification: 100, pmKisan: 5000,   mgnrega: 3200,   ujjwala: 42000,  crime: 395, rainfall: 2350 },
    { name: 'Pune',            lat: 18.520, lng: 73.856, population: '9.4M',  popNumber: 9400000,  area: '15,643 km²',  literacy: '87.0%', sexRatio: 910,  aqi: 112, aqiCategory: 'Unhealthy (SG)',  pm25: 52,  waterQuality: 'Moderate', safeWaterPct: 82,  hospitals: 680,  doctors: 14000, beds: 32000, agriLand: '5,200 km²', majorCrop: 'Sugarcane',  irrigatedPct: 34,  roadLength: '12,500 km', electrification: 99, pmKisan: 285000, mgnrega: 195000, ujjwala: 420000, crime: 310, rainfall: 740 },
    { name: 'Nagpur',          lat: 21.146, lng: 79.088, population: '4.6M',  popNumber: 4600000,  area: '9,892 km²',   literacy: '89.5%', sexRatio: 948,  aqi: 88,  aqiCategory: 'Moderate',         pm25: 35,  waterQuality: 'Good',    safeWaterPct: 85,  hospitals: 420,  doctors: 7800,  beds: 18500, agriLand: '4,100 km²', majorCrop: 'Orange',     irrigatedPct: 22,  roadLength: '8,200 km',  electrification: 98, pmKisan: 185000, mgnrega: 142000, ujjwala: 310000, crime: 275, rainfall: 1200 },
    { name: 'Thane',           lat: 19.218, lng: 72.978, population: '11.1M', popNumber: 11100000, area: '9,558 km²',   literacy: '85.2%', sexRatio: 880,  aqi: 138, aqiCategory: 'Unhealthy',       pm25: 68,  waterQuality: 'Moderate', safeWaterPct: 76,  hospitals: 380,  doctors: 6500,  beds: 15000, agriLand: '2,800 km²', majorCrop: 'Rice',       irrigatedPct: 18,  roadLength: '7,600 km',  electrification: 99, pmKisan: 145000, mgnrega: 98000,  ujjwala: 380000, crime: 340, rainfall: 2600 },
    { name: 'Nashik',          lat: 19.997, lng: 73.789, population: '6.1M',  popNumber: 6100000,  area: '15,530 km²',  literacy: '82.5%', sexRatio: 931,  aqi: 76,  aqiCategory: 'Moderate',         pm25: 28,  waterQuality: 'Good',    safeWaterPct: 84,  hospitals: 310,  doctors: 4800,  beds: 11200, agriLand: '6,200 km²', majorCrop: 'Grapes/Onion', irrigatedPct: 28, roadLength: '11,800 km', electrification: 97, pmKisan: 320000, mgnrega: 225000, ujjwala: 380000, crime: 195, rainfall: 680 },
    { name: 'Aurangabad',      lat: 19.876, lng: 75.343, population: '3.7M',  popNumber: 3700000,  area: '10,100 km²',  literacy: '79.0%', sexRatio: 924,  aqi: 105, aqiCategory: 'Unhealthy (SG)',  pm25: 48,  waterQuality: 'Moderate', safeWaterPct: 75,  hospitals: 195,  doctors: 3200,  beds: 7800,  agriLand: '4,500 km²', majorCrop: 'Cotton',     irrigatedPct: 15,  roadLength: '8,900 km',  electrification: 96, pmKisan: 210000, mgnrega: 175000, ujjwala: 285000, crime: 220, rainfall: 720 },
    { name: 'Solapur',         lat: 17.660, lng: 75.906, population: '4.3M',  popNumber: 4300000,  area: '14,845 km²',  literacy: '77.2%', sexRatio: 940,  aqi: 95,  aqiCategory: 'Moderate',         pm25: 40,  waterQuality: 'Poor',    safeWaterPct: 68,  hospitals: 165,  doctors: 2400,  beds: 5800,  agriLand: '6,800 km²', majorCrop: 'Sugarcane',  irrigatedPct: 22,  roadLength: '10,200 km', electrification: 95, pmKisan: 275000, mgnrega: 210000, ujjwala: 310000, crime: 180, rainfall: 560 },
    { name: 'Kolhapur',        lat: 16.705, lng: 74.243, population: '3.8M',  popNumber: 3800000,  area: '7,685 km²',   literacy: '84.1%', sexRatio: 968,  aqi: 65,  aqiCategory: 'Moderate',         pm25: 22,  waterQuality: 'Good',    safeWaterPct: 88,  hospitals: 220,  doctors: 3600,  beds: 8200,  agriLand: '3,600 km²', majorCrop: 'Sugarcane',  irrigatedPct: 42,  roadLength: '6,800 km',  electrification: 99, pmKisan: 195000, mgnrega: 135000, ujjwala: 265000, crime: 165, rainfall: 1100 },
    { name: 'Amravati',        lat: 20.937, lng: 77.759, population: '2.8M',  popNumber: 2800000,  area: '12,210 km²',  literacy: '80.4%', sexRatio: 947,  aqi: 82,  aqiCategory: 'Moderate',         pm25: 32,  waterQuality: 'Moderate', safeWaterPct: 74,  hospitals: 142,  doctors: 2100,  beds: 5200,  agriLand: '5,400 km²', majorCrop: 'Cotton',     irrigatedPct: 18,  roadLength: '9,400 km',  electrification: 95, pmKisan: 245000, mgnrega: 190000, ujjwala: 280000, crime: 190, rainfall: 980 },
    { name: 'Nanded',          lat: 19.138, lng: 77.321, population: '3.3M',  popNumber: 3300000,  area: '10,528 km²',  literacy: '76.0%', sexRatio: 941,  aqi: 90,  aqiCategory: 'Moderate',         pm25: 38,  waterQuality: 'Poor',    safeWaterPct: 65,  hospitals: 125,  doctors: 1800,  beds: 4500,  agriLand: '5,100 km²', majorCrop: 'Cotton/Soybean', irrigatedPct: 16, roadLength: '8,500 km',  electrification: 94, pmKisan: 265000, mgnrega: 215000, ujjwala: 295000, crime: 170, rainfall: 850 },
    { name: 'Sangli',          lat: 16.852, lng: 74.581, population: '2.8M',  popNumber: 2800000,  area: '8,576 km²',   literacy: '82.3%', sexRatio: 958,  aqi: 72,  aqiCategory: 'Moderate',         pm25: 26,  waterQuality: 'Good',    safeWaterPct: 82,  hospitals: 155,  doctors: 2300,  beds: 5800,  agriLand: '3,800 km²', majorCrop: 'Grapes/Turmeric', irrigatedPct: 32, roadLength: '7,200 km',  electrification: 97, pmKisan: 175000, mgnrega: 125000, ujjwala: 220000, crime: 155, rainfall: 620 },
    { name: 'Satara',          lat: 17.680, lng: 74.018, population: '3.0M',  popNumber: 3000000,  area: '10,475 km²',  literacy: '84.7%', sexRatio: 988,  aqi: 58,  aqiCategory: 'Moderate',         pm25: 20,  waterQuality: 'Good',    safeWaterPct: 86,  hospitals: 168,  doctors: 2500,  beds: 6200,  agriLand: '4,200 km²', majorCrop: 'Sugarcane',  irrigatedPct: 30,  roadLength: '8,800 km',  electrification: 98, pmKisan: 190000, mgnrega: 140000, ujjwala: 240000, crime: 140, rainfall: 1200 },
    { name: 'Ahmednagar',      lat: 19.094, lng: 74.739, population: '4.5M',  popNumber: 4500000,  area: '17,048 km²',  literacy: '80.0%', sexRatio: 939,  aqi: 85,  aqiCategory: 'Moderate',         pm25: 34,  waterQuality: 'Moderate', safeWaterPct: 72,  hospitals: 185,  doctors: 2800,  beds: 6800,  agriLand: '7,200 km²', majorCrop: 'Onion/Bajra', irrigatedPct: 18,  roadLength: '13,500 km', electrification: 96, pmKisan: 345000, mgnrega: 260000, ujjwala: 360000, crime: 175, rainfall: 520 },
    { name: 'Dhule',           lat: 20.902, lng: 74.775, population: '2.0M',  popNumber: 2000000,  area: '8,095 km²',   literacy: '75.4%', sexRatio: 946,  aqi: 78,  aqiCategory: 'Moderate',         pm25: 30,  waterQuality: 'Moderate', safeWaterPct: 70,  hospitals: 98,   doctors: 1400,  beds: 3500,  agriLand: '3,600 km²', majorCrop: 'Cotton',     irrigatedPct: 12,  roadLength: '6,400 km',  electrification: 93, pmKisan: 165000, mgnrega: 145000, ujjwala: 185000, crime: 160, rainfall: 600 },
    { name: 'Jalgaon',         lat: 21.008, lng: 75.563, population: '4.2M',  popNumber: 4200000,  area: '11,765 km²',  literacy: '78.2%', sexRatio: 933,  aqi: 92,  aqiCategory: 'Moderate',         pm25: 40,  waterQuality: 'Moderate', safeWaterPct: 73,  hospitals: 162,  doctors: 2400,  beds: 5900,  agriLand: '5,200 km²', majorCrop: 'Banana/Cotton', irrigatedPct: 24, roadLength: '9,600 km',  electrification: 96, pmKisan: 280000, mgnrega: 195000, ujjwala: 310000, crime: 185, rainfall: 680 },
    { name: 'Latur',           lat: 18.408, lng: 76.576, population: '2.4M',  popNumber: 2400000,  area: '7,157 km²',   literacy: '77.5%', sexRatio: 942,  aqi: 88,  aqiCategory: 'Moderate',         pm25: 36,  waterQuality: 'Poor',    safeWaterPct: 62,  hospitals: 105,  doctors: 1500,  beds: 3800,  agriLand: '3,400 km²', majorCrop: 'Soybean',    irrigatedPct: 14,  roadLength: '5,800 km',  electrification: 94, pmKisan: 195000, mgnrega: 165000, ujjwala: 210000, crime: 165, rainfall: 720 },
    { name: 'Parbhani',        lat: 19.268, lng: 76.771, population: '1.8M',  popNumber: 1800000,  area: '6,511 km²',   literacy: '74.8%', sexRatio: 949,  aqi: 82,  aqiCategory: 'Moderate',         pm25: 32,  waterQuality: 'Poor',    safeWaterPct: 60,  hospitals: 78,   doctors: 1100,  beds: 2800,  agriLand: '3,200 km²', majorCrop: 'Cotton/Soybean', irrigatedPct: 12, roadLength: '5,200 km',  electrification: 93, pmKisan: 155000, mgnrega: 135000, ujjwala: 165000, crime: 150, rainfall: 800 },
    { name: 'Akola',           lat: 20.709, lng: 77.007, population: '1.8M',  popNumber: 1800000,  area: '5,429 km²',   literacy: '81.4%', sexRatio: 946,  aqi: 85,  aqiCategory: 'Moderate',         pm25: 34,  waterQuality: 'Moderate', safeWaterPct: 72,  hospitals: 92,   doctors: 1350,  beds: 3200,  agriLand: '2,600 km²', majorCrop: 'Cotton',     irrigatedPct: 16,  roadLength: '4,800 km',  electrification: 95, pmKisan: 148000, mgnrega: 118000, ujjwala: 160000, crime: 175, rainfall: 850 },
    { name: 'Yavatmal',        lat: 20.389, lng: 78.120, population: '2.7M',  popNumber: 2700000,  area: '13,582 km²',  literacy: '79.3%', sexRatio: 952,  aqi: 78,  aqiCategory: 'Moderate',         pm25: 30,  waterQuality: 'Moderate', safeWaterPct: 68,  hospitals: 112,  doctors: 1600,  beds: 4100,  agriLand: '5,800 km²', majorCrop: 'Cotton/Soybean', irrigatedPct: 12, roadLength: '10,500 km', electrification: 94, pmKisan: 235000, mgnrega: 185000, ujjwala: 245000, crime: 155, rainfall: 980 },
    { name: 'Chandrapur',      lat: 19.962, lng: 79.296, population: '2.2M',  popNumber: 2200000,  area: '11,443 km²',  literacy: '80.8%', sexRatio: 961,  aqi: 185, aqiCategory: 'Unhealthy',       pm25: 95,  waterQuality: 'Moderate', safeWaterPct: 70,  hospitals: 88,   doctors: 1200,  beds: 3000,  agriLand: '4,600 km²', majorCrop: 'Rice',       irrigatedPct: 18,  roadLength: '9,200 km',  electrification: 93, pmKisan: 180000, mgnrega: 165000, ujjwala: 195000, crime: 195, rainfall: 1350 },
    { name: 'Wardha',          lat: 20.745, lng: 78.602, population: '1.3M',  popNumber: 1300000,  area: '6,310 km²',   literacy: '85.1%', sexRatio: 946,  aqi: 72,  aqiCategory: 'Moderate',         pm25: 28,  waterQuality: 'Good',    safeWaterPct: 80,  hospitals: 72,   doctors: 1050,  beds: 2600,  agriLand: '2,800 km²', majorCrop: 'Cotton',     irrigatedPct: 15,  roadLength: '5,500 km',  electrification: 96, pmKisan: 125000, mgnrega: 98000,  ujjwala: 135000, crime: 145, rainfall: 1050 },
    { name: 'Gondia',          lat: 21.460, lng: 80.196, population: '1.3M',  popNumber: 1300000,  area: '5,432 km²',   literacy: '79.2%', sexRatio: 997,  aqi: 62,  aqiCategory: 'Moderate',         pm25: 22,  waterQuality: 'Good',    safeWaterPct: 78,  hospitals: 58,   doctors: 800,   beds: 2100,  agriLand: '2,400 km²', majorCrop: 'Rice',       irrigatedPct: 22,  roadLength: '4,200 km',  electrification: 92, pmKisan: 115000, mgnrega: 105000, ujjwala: 120000, crime: 130, rainfall: 1300 },
    { name: 'Bhandara',        lat: 21.167, lng: 79.650, population: '1.2M',  popNumber: 1200000,  area: '4,087 km²',   literacy: '83.4%', sexRatio: 981,  aqi: 68,  aqiCategory: 'Moderate',         pm25: 25,  waterQuality: 'Good',    safeWaterPct: 82,  hospitals: 52,   doctors: 720,   beds: 1800,  agriLand: '1,900 km²', majorCrop: 'Rice',       irrigatedPct: 28,  roadLength: '3,600 km',  electrification: 95, pmKisan: 98000,  mgnrega: 82000,  ujjwala: 105000, crime: 140, rainfall: 1250 },
    { name: 'Gadchiroli',      lat: 20.183, lng: 80.005, population: '1.0M',  popNumber: 1000000,  area: '14,412 km²',  literacy: '70.5%', sexRatio: 982,  aqi: 45,  aqiCategory: 'Good',            pm25: 15,  waterQuality: 'Good',    safeWaterPct: 72,  hospitals: 35,   doctors: 450,   beds: 1200,  agriLand: '3,200 km²', majorCrop: 'Rice',       irrigatedPct: 10,  roadLength: '8,500 km',  electrification: 85, pmKisan: 95000,  mgnrega: 120000, ujjwala: 95000,  crime: 120, rainfall: 1400 },
    { name: 'Raigad',          lat: 18.516, lng: 73.179, population: '2.6M',  popNumber: 2600000,  area: '7,152 km²',   literacy: '83.8%', sexRatio: 975,  aqi: 95,  aqiCategory: 'Moderate',         pm25: 42,  waterQuality: 'Good',    safeWaterPct: 85,  hospitals: 145,  doctors: 2200,  beds: 5500,  agriLand: '2,200 km²', majorCrop: 'Rice/Coconut', irrigatedPct: 25, roadLength: '6,200 km',  electrification: 98, pmKisan: 140000, mgnrega: 95000,  ujjwala: 210000, crime: 200, rainfall: 3200 },
    { name: 'Ratnagiri',       lat: 16.990, lng: 73.298, population: '1.6M',  popNumber: 1600000,  area: '8,208 km²',   literacy: '82.3%', sexRatio: 1123, aqi: 52,  aqiCategory: 'Moderate',         pm25: 18,  waterQuality: 'Good',    safeWaterPct: 88,  hospitals: 78,   doctors: 1100,  beds: 2800,  agriLand: '2,800 km²', majorCrop: 'Mango/Coconut', irrigatedPct: 15, roadLength: '5,800 km',  electrification: 95, pmKisan: 105000, mgnrega: 78000,  ujjwala: 140000, crime: 125, rainfall: 3500 },
    { name: 'Sindhudurg',      lat: 16.167, lng: 73.667, population: '0.8M',  popNumber: 800000,   area: '5,207 km²',   literacy: '85.5%', sexRatio: 1033, aqi: 42,  aqiCategory: 'Good',            pm25: 14,  waterQuality: 'Excellent', safeWaterPct: 92, hospitals: 45,  doctors: 650,   beds: 1600,  agriLand: '2,100 km²', majorCrop: 'Cashew/Coconut', irrigatedPct: 18, roadLength: '4,200 km',  electrification: 96, pmKisan: 72000,  mgnrega: 55000,  ujjwala: 85000,  crime: 95,  rainfall: 3200 },
    { name: 'Beed',            lat: 18.989, lng: 75.758, population: '2.6M',  popNumber: 2600000,  area: '10,693 km²',  literacy: '73.2%', sexRatio: 915,  aqi: 92,  aqiCategory: 'Moderate',         pm25: 38,  waterQuality: 'Poor',    safeWaterPct: 58,  hospitals: 95,   doctors: 1300,  beds: 3200,  agriLand: '4,800 km²', majorCrop: 'Jowar/Bajra',  irrigatedPct: 10,  roadLength: '8,200 km',  electrification: 92, pmKisan: 220000, mgnrega: 195000, ujjwala: 235000, crime: 170, rainfall: 550 },
    { name: 'Osmanabad',       lat: 18.186, lng: 76.042, population: '1.6M',  popNumber: 1600000,  area: '7,569 km²',   literacy: '76.4%', sexRatio: 935,  aqi: 88,  aqiCategory: 'Moderate',         pm25: 36,  waterQuality: 'Poor',    safeWaterPct: 60,  hospitals: 72,   doctors: 980,   beds: 2400,  agriLand: '3,500 km²', majorCrop: 'Soybean',    irrigatedPct: 12,  roadLength: '5,800 km',  electrification: 93, pmKisan: 145000, mgnrega: 128000, ujjwala: 155000, crime: 160, rainfall: 580 },
    { name: 'Buldhana',        lat: 20.530, lng: 76.184, population: '2.6M',  popNumber: 2600000,  area: '9,661 km²',   literacy: '77.8%', sexRatio: 938,  aqi: 82,  aqiCategory: 'Moderate',         pm25: 32,  waterQuality: 'Moderate', safeWaterPct: 68,  hospitals: 98,   doctors: 1350,  beds: 3400,  agriLand: '4,200 km²', majorCrop: 'Cotton/Soybean', irrigatedPct: 14, roadLength: '7,800 km',  electrification: 94, pmKisan: 210000, mgnrega: 165000, ujjwala: 225000, crime: 165, rainfall: 780 },
    { name: 'Washim',          lat: 20.101, lng: 77.152, population: '1.2M',  popNumber: 1200000,  area: '5,150 km²',   literacy: '76.0%', sexRatio: 939,  aqi: 78,  aqiCategory: 'Moderate',         pm25: 30,  waterQuality: 'Moderate', safeWaterPct: 66,  hospitals: 55,   doctors: 780,   beds: 1900,  agriLand: '2,400 km²', majorCrop: 'Cotton',     irrigatedPct: 12,  roadLength: '4,500 km',  electrification: 93, pmKisan: 115000, mgnrega: 98000,  ujjwala: 120000, crime: 150, rainfall: 820 },
    { name: 'Hingoli',         lat: 19.716, lng: 77.147, population: '1.2M',  popNumber: 1200000,  area: '4,526 km²',   literacy: '75.2%', sexRatio: 942,  aqi: 80,  aqiCategory: 'Moderate',         pm25: 31,  waterQuality: 'Poor',    safeWaterPct: 62,  hospitals: 48,   doctors: 680,   beds: 1700,  agriLand: '2,100 km²', majorCrop: 'Cotton/Soybean', irrigatedPct: 10, roadLength: '3,800 km',  electrification: 92, pmKisan: 108000, mgnrega: 95000,  ujjwala: 115000, crime: 155, rainfall: 800 },
    { name: 'Jalna',           lat: 19.835, lng: 75.881, population: '1.9M',  popNumber: 1900000,  area: '7,718 km²',   literacy: '73.8%', sexRatio: 926,  aqi: 88,  aqiCategory: 'Moderate',         pm25: 36,  waterQuality: 'Poor',    safeWaterPct: 58,  hospitals: 82,   doctors: 1100,  beds: 2800,  agriLand: '3,400 km²', majorCrop: 'Cotton/Bajra', irrigatedPct: 12,  roadLength: '6,200 km',  electrification: 93, pmKisan: 170000, mgnrega: 148000, ujjwala: 180000, crime: 165, rainfall: 700 },
    { name: 'Palghar',         lat: 19.697, lng: 72.765, population: '2.9M',  popNumber: 2900000,  area: '5,344 km²',   literacy: '70.6%', sexRatio: 979,  aqi: 105, aqiCategory: 'Unhealthy (SG)',  pm25: 48,  waterQuality: 'Moderate', safeWaterPct: 72,  hospitals: 110,  doctors: 1600,  beds: 4000,  agriLand: '1,800 km²', majorCrop: 'Rice',       irrigatedPct: 15,  roadLength: '4,800 km',  electrification: 94, pmKisan: 125000, mgnrega: 110000, ujjwala: 245000, crime: 220, rainfall: 2800 },
    { name: 'Nagpur (Rural)',  lat: 21.300, lng: 79.200, population: '1.2M',  popNumber: 1200000,  area: '4,250 km²',   literacy: '83.0%', sexRatio: 955,  aqi: 72,  aqiCategory: 'Moderate',         pm25: 28,  waterQuality: 'Good',    safeWaterPct: 82,  hospitals: 65,   doctors: 900,   beds: 2200,  agriLand: '2,100 km²', majorCrop: 'Orange',     irrigatedPct: 20,  roadLength: '3,800 km',  electrification: 96, pmKisan: 105000, mgnrega: 88000,  ujjwala: 115000, crime: 145, rainfall: 1150 },
  ];

  async initialize(): Promise<void> {
    for (const d of this.districts) {
      this.districtMap.set(d.name, d);
    }
    await this.enable();
  }

  protected async loadData(): Promise<void> {
    this.clear();

    for (const d of this.districts) {
      const aqiColor = this.getAqiColor(d.aqi);

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(d.lng, d.lat, 0),
        point: {
          pixelSize: 8,
          color: Color.fromCssColorString(this.config.color).withAlpha(0.8),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 1,
          scaleByDistance: new NearFarScalar(1.0, 1.0, 5e6, 0.1),
        },
        label: {
          text: d.name,
          font: '12px sans-serif',
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Color.BLACK,
          fillColor: Color.WHITE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian3(0, -12, 0),
          scaleByDistance: new NearFarScalar(1.0, 1.0, 3e6, 0.1),
        },
        description: `
          <h3 style="margin:0 0 8px;color:#00d4ff">🗺️ ${d.name} District</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Population</td><td><strong>${d.population}</strong></td></tr>
            <tr><td>Area</td><td>${d.area}</td></tr>
            <tr><td>Literacy Rate</td><td>${d.literacy}</td></tr>
            <tr><td>Sex Ratio</td><td>${d.sexRatio} / 1000</td></tr>
            <tr><td>AQI</td><td style="color:${aqiColor};font-weight:bold">${d.aqi} (${d.aqiCategory})</td></tr>
          </table>
          <p style="margin-top:8px;font-size:0.8em;color:#888">Click district point for detailed drill-down metrics</p>
        `,
      });
    }
  }

  /**
   * Setup click handler for drill-down popup
   */
  setupDrillDown(viewer: Viewer): void {
    this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    this.handler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position);
      if (!picked || !picked.id) return;

      const entity = picked.id as Entity;
      const desc = entity.description?.getValue?.(viewer.clock.currentTime) || '';

      // Extract district name from description
      const nameMatch = desc.match(/<h3[^>]*>.*?<\/h3>\s*<table/);
      if (!nameMatch) return;

      const titleMatch = desc.match(/<h3[^>]*>.*?(\w[\w\s()]+)\s*(?:District)?<\/h3>/);
      if (!titleMatch) return;

      const distName = titleMatch[1].trim();
      const metrics = this.districtMap.get(distName);
      if (!metrics) return;

      this.showDrillDownPopup(metrics, movement.position);
    }, ScreenSpaceEventType.LEFT_CLICK);

    // Close popup on canvas click elsewhere
    this.handler.setInputAction(() => {
      this.hideDrillDownPopup();
    }, ScreenSpaceEventType.RIGHT_CLICK);
  }

  private showDrillDownPopup(metrics: DistrictMetrics, screenPos: { x: number; y: number }): void {
    this.hideDrillDownPopup();

    const popup = document.createElement('div');
    popup.id = 'district-drilldown-popup';
    popup.innerHTML = `
      <style>
        #district-drilldown-popup {
          position: fixed;
          z-index: 1000;
          width: 380px;
          max-height: 80vh;
          overflow-y: auto;
          background: rgba(10,10,18,0.96);
          border: 1px solid rgba(0,212,255,0.3);
          border-radius: 12px;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.1);
          font-family: 'Inter', -apple-system, sans-serif;
          color: #e0e0e0;
          padding: 0;
          left: ${Math.min(screenPos.x + 20, window.innerWidth - 400)}px;
          top: ${Math.min(screenPos.y - 50, window.innerHeight - 550)}px;
        }
        .dd-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; justify-content: space-between; align-items: center;
        }
        .dd-header h2 { margin: 0; font-size: 1.1rem; color: #00d4ff; }
        .dd-close {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          color: #888; cursor: pointer; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center;
        }
        .dd-close:hover { background: rgba(255,51,85,0.3); color: #ff3355; }
        .dd-section {
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dd-section-title {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 1px; color: #666; margin-bottom: 8px;
        }
        .dd-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px;
        }
        .dd-metric {
          display: flex; justify-content: space-between; align-items: center;
          padding: 4px 0;
        }
        .dd-metric-label { font-size: 0.78rem; color: #999; }
        .dd-metric-value { font-size: 0.82rem; font-weight: 600; color: #ddd; }
        .dd-metric-value.good { color: #00ff88; }
        .dd-metric-value.warn { color: #ffcc00; }
        .dd-metric-value.bad { color: #ff3355; }
        .dd-bar {
          height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1);
          margin-top: 4px;
        }
        .dd-bar-fill {
          height: 100%; border-radius: 2px; transition: width 0.5s ease;
        }
        #district-drilldown-popup::-webkit-scrollbar { width: 4px; }
        #district-drilldown-popup::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.3); border-radius: 2px; }
      </style>

      <div class="dd-header">
        <h2>📍 ${metrics.name}</h2>
        <button class="dd-close" id="dd-close-btn">✕</button>
      </div>

      <div class="dd-section">
        <div class="dd-section-title">👥 Demographics</div>
        <div class="dd-grid">
          <div class="dd-metric">
            <span class="dd-metric-label">Population</span>
            <span class="dd-metric-value">${metrics.population}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Area</span>
            <span class="dd-metric-value">${metrics.area}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Literacy</span>
            <span class="dd-metric-value ${this.getClass(parseFloat(metrics.literacy), 70, 85)}">${metrics.literacy}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Sex Ratio</span>
            <span class="dd-metric-value ${this.getClass(metrics.sexRatio, 900, 960, true)}">${metrics.sexRatio} /1000</span>
          </div>
        </div>
      </div>

      <div class="dd-section">
        <div class="dd-section-title">🌬️ Air Quality</div>
        <div class="dd-metric">
          <span class="dd-metric-label">AQI</span>
          <span class="dd-metric-value ${metrics.aqi <= 100 ? 'good' : metrics.aqi <= 150 ? 'warn' : 'bad'}">${metrics.aqi} — ${metrics.aqiCategory}</span>
        </div>
        <div class="dd-metric" style="margin-top:4px">
          <span class="dd-metric-label">PM2.5</span>
          <span class="dd-metric-value ${metrics.pm25 <= 30 ? 'good' : metrics.pm25 <= 60 ? 'warn' : 'bad'}">${metrics.pm25} µg/m³</span>
        </div>
        <div class="dd-bar"><div class="dd-bar-fill" style="width:${Math.min(100, (metrics.pm25 / 100) * 100)}%;background:${metrics.pm25 <= 30 ? '#00ff88' : metrics.pm25 <= 60 ? '#ffcc00' : '#ff3355'}"></div></div>
      </div>

      <div class="dd-section">
        <div class="dd-section-title">💧 Water Quality</div>
        <div class="dd-grid">
          <div class="dd-metric">
            <span class="dd-metric-label">Rating</span>
            <span class="dd-metric-value ${metrics.waterQuality === 'Excellent' || metrics.waterQuality === 'Good' ? 'good' : metrics.waterQuality === 'Moderate' ? 'warn' : 'bad'}">${metrics.waterQuality}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Safe Water Access</span>
            <span class="dd-metric-value ${this.getClass(metrics.safeWaterPct, 75, 88)}">${metrics.safeWaterPct}%</span>
          </div>
        </div>
        <div class="dd-bar"><div class="dd-bar-fill" style="width:${metrics.safeWaterPct}%;background:${metrics.safeWaterPct >= 88 ? '#00ff88' : metrics.safeWaterPct >= 75 ? '#ffcc00' : '#ff3355'}"></div></div>
      </div>

      <div class="dd-section">
        <div class="dd-section-title">🏥 Health Infrastructure</div>
        <div class="dd-grid">
          <div class="dd-metric">
            <span class="dd-metric-label">Hospitals</span>
            <span class="dd-metric-value">${metrics.hospitals.toLocaleString()}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Doctors</span>
            <span class="dd-metric-value">${metrics.doctors.toLocaleString()}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Beds</span>
            <span class="dd-metric-value">${metrics.beds.toLocaleString()}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Doctor Ratio</span>
            <span class="dd-metric-value">${this.getDoctorRatio(metrics)}</span>
          </div>
        </div>
      </div>

      <div class="dd-section">
        <div class="dd-section-title">🌾 Agriculture</div>
        <div class="dd-grid">
          <div class="dd-metric">
            <span class="dd-metric-label">Agri Land</span>
            <span class="dd-metric-value">${metrics.agriLand}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Major Crop</span>
            <span class="dd-metric-value">${metrics.majorCrop}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Irrigated</span>
            <span class="dd-metric-value ${this.getClass(metrics.irrigatedPct, 15, 30)}">${metrics.irrigatedPct}%</span>
          </div>
        </div>
      </div>

      <div class="dd-section">
        <div class="dd-section-title">🏗️ Infrastructure & Governance</div>
        <div class="dd-grid">
          <div class="dd-metric">
            <span class="dd-metric-label">Roads</span>
            <span class="dd-metric-value">${metrics.roadLength}</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Electrification</span>
            <span class="dd-metric-value ${this.getClass(metrics.electrification, 94, 98)}">${metrics.electrification}%</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Crime Rate</span>
            <span class="dd-metric-value ${metrics.crime <= 160 ? 'good' : metrics.crime <= 250 ? 'warn' : 'bad'}">${metrics.crime} /100k</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Rainfall</span>
            <span class="dd-metric-value">${metrics.rainfall} mm/yr</span>
          </div>
        </div>
      </div>

      <div class="dd-section" style="border-bottom:none">
        <div class="dd-section-title">📋 Government Scheme Beneficiaries</div>
        <div class="dd-grid">
          <div class="dd-metric">
            <span class="dd-metric-label">PM-KISAN</span>
            <span class="dd-metric-value">${(metrics.pmKisan / 1000).toFixed(0)}K</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">MGNREGA</span>
            <span class="dd-metric-value">${(metrics.mgnrega / 1000).toFixed(0)}K</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Ujjwala</span>
            <span class="dd-metric-value">${(metrics.ujjwala / 1000).toFixed(0)}K</span>
          </div>
          <div class="dd-metric">
            <span class="dd-metric-label">Coverage</span>
            <span class="dd-metric-value good">${this.getSchemeCoverage(metrics)}%</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    this.popupEl = popup;

    document.getElementById('dd-close-btn')?.addEventListener('click', () => {
      this.hideDrillDownPopup();
    });
  }

  private hideDrillDownPopup(): void {
    if (this.popupEl) {
      this.popupEl.remove();
      this.popupEl = null;
    }
  }

  private getAqiColor(aqi: number): string {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    return '#8f3f97';
  }

  private getClass(value: number, lowThreshold: number, highThreshold: number, inverse = false): string {
    if (inverse) {
      if (value >= highThreshold) return 'good';
      if (value >= lowThreshold) return 'warn';
      return 'bad';
    }
    if (value >= highThreshold) return 'good';
    if (value >= lowThreshold) return 'warn';
    return 'bad';
  }

  private getDoctorRatio(m: DistrictMetrics): string {
    const ratio = Math.round(m.popNumber / m.doctors);
    return `1:${ratio.toLocaleString()}`;
  }

  private getSchemeCoverage(m: DistrictMetrics): number {
    const eligible = m.popNumber * 0.3; // ~30% eligible for schemes
    const total = m.pmKisan + m.mgnrega + m.ujjwala;
    return Math.min(100, Math.round((total / eligible) * 100));
  }

  destroy(): void {
    this.hideDrillDownPopup();
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }
}
