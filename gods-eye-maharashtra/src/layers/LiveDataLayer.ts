/**
 * LiveDataLayer — Real-time data visualization on CesiumJS
 */
import { Viewer, Color, Cartesian3, LabelStyle, VerticalOrigin, HeightReference } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';
import { 
  fetchMaharashtraWeather, 
  fetchMaharashtraNews, 
  fetchMaharashtraEarthquakes,
  fetchMaharashtraAirQuality,
  fetchMaharashtraFires,
  WeatherData,
  NewsEvent,
  Earthquake,
  AirQuality,
  FireHotspot
} from '../data/LiveDataSource';

export class LiveDataLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'live-data',
    name: 'Live Data Feed',
    description: 'Real-time weather, news, earthquakes, air quality, and fire hotspots',
    icon: '🔴',
    category: 'global',
    color: '#ff4444',
    enabled: true,
    opacity: 1,
    dataStoreKey: 'live-data',
  };

  constructor(viewer: Viewer, dataStore: DataStore) {
    super(viewer, dataStore);
    this.initDataSource();
  }

  protected async loadData(): Promise<void> {
    try {
      const [weather, news, earthquakes, airQuality, fires] = await Promise.all([
        fetchMaharashtraWeather(),
        fetchMaharashtraNews(),
        fetchMaharashtraEarthquakes(),
        fetchMaharashtraAirQuality(),
        fetchMaharashtraFires(),
      ]);

      this.addWeatherStations(weather);
      this.addNewsEvents(news);
      this.addEarthquakes(earthquakes);
      this.addAirQualityStations(airQuality);
      this.addFireHotspots(fires);

      console.log(`[LiveDataLayer] Loaded: ${weather.length} weather, ${news.length} news, ${earthquakes.length} earthquakes, ${airQuality.length} AQI, ${fires.length} fires`);
    } catch (error) {
      console.error('[LiveDataLayer] Failed to load data:', error);
    }
  }

  private addWeatherStations(stations: WeatherData[]) {
    for (const station of stations) {
      this.dataSource.entities.add({
        id: `weather-${station.location}`,
        position: Cartesian3.fromDegrees(station.lon, station.lat, 1000),
        point: {
          pixelSize: 10,
          color: this.getWeatherColor(station.condition),
          outlineColor: Color.WHITE,
          outlineWidth: 1,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `${station.temperature}°C`,
          font: '12px sans-serif',
          fillColor: Color.WHITE,
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian3(0, -15, 0),
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        description: `
          <h3>🌤️ Weather: ${station.location}</h3>
          <table>
            <tr><td>Temperature</td><td><b>${station.temperature}°C</b></td></tr>
            <tr><td>Condition</td><td>${station.condition}</td></tr>
            <tr><td>Humidity</td><td>${station.humidity}%</td></tr>
            <tr><td>Wind Speed</td><td>${station.windSpeed} km/h</td></tr>
            <tr><td>Precipitation</td><td>${station.precipitation} mm</td></tr>
          </table>
        `,
      });
    }
  }

  private getWeatherColor(condition: string): Color {
    if (condition.includes('Rain') || condition.includes('Drizzle')) return Color.DODGERBLUE;
    if (condition.includes('Cloud')) return Color.GRAY;
    if (condition.includes('Thunder')) return Color.PURPLE;
    if (condition.includes('Snow')) return Color.WHITE;
    if (condition.includes('Fog')) return Color.SILVER;
    return Color.YELLOW;
  }

  private addNewsEvents(events: NewsEvent[]) {
    for (const event of events) {
      const isNegative = event.tone < -2;
      this.dataSource.entities.add({
        id: `news-${event.url}`,
        position: Cartesian3.fromDegrees(event.lon, event.lat, 2000),
        point: {
          pixelSize: isNegative ? 12 : 8,
          color: isNegative ? Color.RED : Color.CYAN,
          outlineColor: Color.WHITE,
          outlineWidth: 1,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: event.title.substring(0, 40) + (event.title.length > 40 ? '...' : ''),
          font: '11px sans-serif',
          fillColor: isNegative ? Color.RED : Color.CYAN,
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian3(0, -15, 0),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          show: false,
        },
        description: `
          <h3>📰 ${event.title}</h3>
          <table>
            <tr><td>Source</td><td>${event.source}</td></tr>
            <tr><td>Date</td><td>${event.date}</td></tr>
            <tr><td>Tone</td><td><span style="color: ${isNegative ? 'red' : 'green'}">${event.tone.toFixed(1)}</span></td></tr>
            <tr><td>Themes</td><td>${event.themes.join(', ') || 'N/A'}</td></tr>
          </table>
          <p><a href="${event.url}" target="_blank">Read more →</a></p>
        `,
      });
    }
  }

  private addEarthquakes(quakes: Earthquake[]) {
    for (const quake of quakes) {
      const size = Math.max(8, quake.magnitude * 4);
      this.dataSource.entities.add({
        id: `earthquake-${quake.time}`,
        position: Cartesian3.fromDegrees(quake.lon, quake.lat, 0),
        point: {
          pixelSize: size,
          color: this.getQuakeColor(quake.magnitude),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `M${quake.magnitude}`,
          font: 'bold 12px sans-serif',
          fillColor: Color.WHITE,
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: VerticalOrigin.CENTER,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        description: `
          <h3>🌍 Earthquake: M${quake.magnitude}</h3>
          <table>
            <tr><td>Location</td><td>${quake.location}</td></tr>
            <tr><td>Depth</td><td>${quake.depth} km</td></tr>
            <tr><td>Time</td><td>${quake.time}</td></tr>
          </table>
          <p><a href="${quake.url}" target="_blank">USGS Details →</a></p>
        `,
      });
    }
  }

  private getQuakeColor(magnitude: number): Color {
    if (magnitude >= 5) return Color.RED;
    if (magnitude >= 4) return Color.ORANGE;
    if (magnitude >= 3) return Color.YELLOW;
    return Color.GREEN;
  }

  private addAirQualityStations(stations: AirQuality[]) {
    for (const station of stations) {
      this.dataSource.entities.add({
        id: `aqi-${station.city}`,
        position: Cartesian3.fromDegrees(station.lon, station.lat, 500),
        point: {
          pixelSize: 12,
          color: this.getAQIColor(station.aqi),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `AQI: ${station.aqi}`,
          font: 'bold 11px sans-serif',
          fillColor: Color.WHITE,
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian3(0, -15, 0),
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        description: `
          <h3>🌬️ Air Quality: ${station.city}</h3>
          <table>
            <tr><td>AQI</td><td><b>${station.aqi}</b> (${station.level})</td></tr>
            <tr><td>PM2.5</td><td>${station.pm25} µg/m³</td></tr>
            <tr><td>PM10</td><td>${station.pm10} µg/m³</td></tr>
            <tr><td>O3</td><td>${station.o3} µg/m³</td></tr>
            <tr><td>NO2</td><td>${station.no2} µg/m³</td></tr>
          </table>
        `,
      });
    }
  }

  private getAQIColor(aqi: number): Color {
    if (aqi <= 50) return Color.GREEN;
    if (aqi <= 100) return Color.YELLOW;
    if (aqi <= 150) return Color.ORANGE;
    if (aqi <= 200) return Color.RED;
    if (aqi <= 300) return Color.PURPLE;
    return Color.MAROON;
  }

  private addFireHotspots(fires: FireHotspot[]) {
    for (const fire of fires) {
      this.dataSource.entities.add({
        id: `fire-${fire.lat}-${fire.lon}`,
        position: Cartesian3.fromDegrees(fire.lon, fire.lat, 0),
        point: {
          pixelSize: Math.max(6, fire.frp / 10),
          color: Color.ORANGERED,
          outlineColor: Color.YELLOW,
          outlineWidth: 1,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        description: `
          <h3>🔥 Fire Hotspot</h3>
          <table>
            <tr><td>Brightness</td><td>${fire.brightness}K</td></tr>
            <tr><td>Confidence</td><td>${fire.confidence}%</td></tr>
            <tr><td>FRP</td><td>${fire.frp} MW</td></tr>
            <tr><td>Date</td><td>${fire.date}</td></tr>
          </table>
        `,
      });
    }
  }
}
