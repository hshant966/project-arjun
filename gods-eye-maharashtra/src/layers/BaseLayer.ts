/**
 * BaseLayer — Abstract base class for all map layers
 */
import { Viewer, Entity, DataSource, CustomDataSource } from 'cesium';
import { DataStore } from '../data/DataStore';

export interface LayerConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'maharashtra' | 'india' | 'global' | 'intelligence';
  color: string;
  enabled: boolean;
  opacity: number;
  dataStoreKey: string;
}

export abstract class BaseLayer {
  abstract config: LayerConfig;
  protected viewer: Viewer;
  protected dataStore: DataStore;
  protected dataSource: CustomDataSource;
  protected _enabled = false;

  constructor(viewer: Viewer, dataStore: DataStore) {
    this.viewer = viewer;
    this.dataStore = dataStore;
    this.dataSource = new CustomDataSource();
  }

  /** Called after subclass fields are initialized to set the data source name */
  protected initDataSource(): void {
    this.dataSource.name = this.config.id;
  }

  get enabled() { return this._enabled; }

  async initialize(): Promise<void> {
    // Override in subclass
  }

  async enable(): Promise<void> {
    if (this._enabled) return;
    this._enabled = true;
    this.initDataSource();
    if (!this.viewer.dataSources.contains(this.dataSource)) {
      await this.viewer.dataSources.add(this.dataSource);
    }
    await this.loadData();
  }

  async disable(): Promise<void> {
    if (!this._enabled) return;
    this._enabled = false;
    if (this.viewer.dataSources.contains(this.dataSource)) {
      await this.viewer.dataSources.remove(this.dataSource);
    }
  }

  async toggle(): Promise<void> {
    if (this._enabled) {
      await this.disable();
    } else {
      await this.enable();
    }
  }

  protected abstract loadData(): Promise<void>;

  setOpacity(value: number): void {
    this.config.opacity = Math.max(0, Math.min(1, value));
    this.dataSource.entities.values.forEach(entity => {
      if (entity.polygon) entity.polygon.material = this.getMaterial();
      if (entity.point) entity.point.color = this.getPointColor();
      if (entity.polyline) entity.polyline.material = this.getLineColor();
    });
  }

  protected getMaterial(): any {
    return undefined; // Override in subclass
  }

  protected getPointColor(): any {
    return undefined; // Override in subclass
  }

  protected getLineColor(): any {
    return undefined; // Override in subclass
  }

  clear(): void {
    this.dataSource.entities.removeAll();
  }

  getEntityCount(): number {
    return this.dataSource.entities.values.length;
  }
}
