/**
 * AlertPanel — Notification panel for critical events
 * Displays categorized alerts with severity levels
 */

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  timestamp: Date;
  location?: string;
  read: boolean;
}

export class AlertPanel {
  private container: HTMLElement;
  private panelEl: HTMLElement | null = null;
  private alerts: Alert[] = [];
  private isVisible = false;
  private onCountChange?: (count: number) => void;

  constructor(container: HTMLElement, onCountChange?: (count: number) => void) {
    this.container = container;
    this.onCountChange = onCountChange;
    this.seedAlerts();
    this.render();
    this.attachListeners();
  }

  private seedAlerts() {
    this.alerts = [
      {
        id: 'a1',
        title: 'AQI Spike — Nagpur',
        description: 'Air Quality Index crossed 300 (Very Poor) at Nagpur Central monitoring station. Industrial emissions detected.',
        severity: 'critical',
        category: 'Air Quality',
        timestamp: new Date(Date.now() - 12 * 60000),
        location: 'Nagpur',
        read: false,
      },
      {
        id: 'a2',
        title: 'Water Level Drop — Marathwada',
        description: 'Dam reservoir levels dropped below 15% in Marathwada region. Aurangabad, Jalna, Beed districts affected.',
        severity: 'critical',
        category: 'Water',
        timestamp: new Date(Date.now() - 45 * 60000),
        location: 'Marathwada',
        read: false,
      },
      {
        id: 'a3',
        title: 'Flood Warning — Konkan Coast',
        description: 'IMD issues red alert for heavy rainfall (>200mm) in Raigad and Ratnagiri. Possible flooding in low-lying areas.',
        severity: 'warning',
        category: 'Weather',
        timestamp: new Date(Date.now() - 2 * 3600000),
        location: 'Konkan',
        read: false,
      },
      {
        id: 'a4',
        title: 'New Scheme Enrollment',
        description: 'PM-KISAN enrollment surge detected in Vidarbha — 12,400 new registrations in last 24 hours.',
        severity: 'info',
        category: 'Schemes',
        timestamp: new Date(Date.now() - 4 * 3600000),
        location: 'Vidarbha',
        read: false,
      },
      {
        id: 'a5',
        title: 'Infrastructure Update — Mumbai',
        description: 'Mumbai Metro Line 3 progress at 78%. Colaba-Bandra-SEZ corridor nearing completion.',
        severity: 'info',
        category: 'Infrastructure',
        timestamp: new Date(Date.now() - 6 * 3600000),
        location: 'Mumbai',
        read: true,
      },
      {
        id: 'a6',
        title: 'Crop Health Alert — Pune',
        description: 'Satellite NDVI data shows stress indicators in sugarcane fields across Pune district. Pest infestation suspected.',
        severity: 'warning',
        category: 'Agriculture',
        timestamp: new Date(Date.now() - 8 * 3600000),
        location: 'Pune',
        read: false,
      },
      {
        id: 'a7',
        title: 'Health Camp Schedule',
        description: 'Mobile health units deployed to 14 tribal blocks in Nandurbar and Dhule for seasonal vaccination drive.',
        severity: 'info',
        category: 'Health',
        timestamp: new Date(Date.now() - 12 * 3600000),
        location: 'Nandurbar',
        read: true,
      },
    ];
  }

  private render() {
    const panel = document.createElement('div');
    panel.className = 'ge-alert-panel';
    panel.id = 'ge-alert-panel';

    const unread = this.alerts.filter(a => !a.read).length;
    const critical = this.alerts.filter(a => a.severity === 'critical').length;

    panel.innerHTML = `
      <div class="ge-alert-header">
        <div class="ge-alert-header-left">
          <h3>🔔 Alerts</h3>
          ${unread > 0 ? `<span class="ge-alert-badge">${unread} new</span>` : ''}
        </div>
        <button class="ge-alert-close" id="alert-close">✕</button>
      </div>
      <div class="ge-alert-body" id="alert-list">
        ${this.alerts.map(a => this.renderAlertItem(a)).join('')}
      </div>
    `;

    this.container.appendChild(panel);
    this.panelEl = panel;
    this.onCountChange?.(unread);
  }

  private renderAlertItem(alert: Alert): string {
    const timeAgo = this.formatTimeAgo(alert.timestamp);
    return `
      <div class="ge-alert-item ${alert.read ? '' : 'unread'}" data-alert-id="${alert.id}">
        <div class="ge-alert-severity ${alert.severity}"></div>
        <div class="ge-alert-content">
          <div class="ge-alert-title">${alert.title}</div>
          <div class="ge-alert-desc">${alert.description}</div>
          <div class="ge-alert-meta">
            <span class="ge-alert-tag ${alert.severity}">${alert.severity}</span>
            <span>${alert.category}</span>
            <span>•</span>
            <span>${timeAgo}</span>
            ${alert.location ? `<span>•</span><span>📍 ${alert.location}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private formatTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  private attachListeners() {
    // Close button
    document.getElementById('alert-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Click on alert to mark read
    document.getElementById('alert-list')?.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.ge-alert-item') as HTMLElement;
      if (!item) return;
      const alertId = item.dataset.alertId;
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert && !alert.read) {
        alert.read = true;
        item.classList.remove('unread');
        const unread = this.alerts.filter(a => !a.read).length;
        this.onCountChange?.(unread);
        // Update badge
        const badge = document.querySelector('.ge-alert-badge');
        if (badge) {
          if (unread > 0) {
            badge.textContent = `${unread} new`;
          } else {
            badge.remove();
          }
        }
      }
    });
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.isVisible = true;
    this.panelEl?.classList.add('visible');
  }

  hide() {
    this.isVisible = false;
    this.panelEl?.classList.remove('visible');
  }

  addAlert(alert: Alert) {
    this.alerts.unshift(alert);
    // Re-render the list
    const listEl = document.getElementById('alert-list');
    if (listEl) {
      listEl.innerHTML = this.alerts.map(a => this.renderAlertItem(a)).join('');
    }
    const unread = this.alerts.filter(a => !a.read).length;
    this.onCountChange?.(unread);
  }

  getUnreadCount(): number {
    return this.alerts.filter(a => !a.read).length;
  }
}
