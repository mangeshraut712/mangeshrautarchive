export class CalendarWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.date = new Date();
    this.currentMonth = this.date.getMonth();
    this.currentYear = this.date.getFullYear();
    this.selectedDate = null;
    this.months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    this.days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Portfolio events and milestones
    this.events = this.generateEvents();
  }

  generateEvents() {
    const currentYear = new Date().getFullYear();
    return {
      // Career milestones
      [`${currentYear}-01-15`]: { type: 'milestone', title: 'Project Launch', color: '#0a84ff' },
      [`${currentYear}-02-20`]: { type: 'achievement', title: 'Certification', color: '#10b981' },
      [`${currentYear}-03-10`]: { type: 'meeting', title: 'Client Meeting', color: '#f59e0b' },
      [`${currentYear}-04-05`]: { type: 'deadline', title: 'Deadline', color: '#ef4444' },
      // Add current month events
      [`${currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-15`]: {
        type: 'milestone',
        title: 'Portfolio Update',
        color: '#8b5cf6'
      },
    };
  }

  init() {
    if (!this.container) return;
    this.render();
    this.addEventListeners();
  }

  getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  getFirstDayOfMonth(month, year) {
    return new Date(year, month, 1).getDay();
  }

  getDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  render() {
    const daysInMonth = this.getDaysInMonth(this.currentMonth, this.currentYear);
    const firstDay = this.getFirstDayOfMonth(this.currentMonth, this.currentYear);
    const today = new Date();

    // Header with navigation
    let html = `
      <div class="calendar-header">
        <div class="calendar-title">
          <h3>${this.months[this.currentMonth]} ${this.currentYear}</h3>
          <div class="calendar-nav">
            <button id="prev-month" aria-label="Previous Month" title="Previous Month">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="today-btn" aria-label="Today" title="Go to Today" class="today-btn">
              <i class="fas fa-calendar-day"></i>
            </button>
            <button id="next-month" aria-label="Next Month" title="Next Month">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="calendar-today-info">
          <i class="fas fa-clock mr-1"></i>
          ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    `;

    // Grid Header (Days)
    html += `<div class="calendar-grid">`;
    this.days.forEach(day => {
      html += `<div class="calendar-day-header ${day === 'Sun' ? 'text-red-500' : ''}">${day}</div>`;
    });

    // Empty cells for days before start of month
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="calendar-day empty"></div>`;
    }

    // Days with events
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate() &&
        this.currentMonth === today.getMonth() &&
        this.currentYear === today.getFullYear();

      const isSunday = new Date(this.currentYear, this.currentMonth, day).getDay() === 0;
      const dateKey = this.getDateKey(this.currentYear, this.currentMonth, day);
      const event = this.events[dateKey];

      const isSelected = this.selectedDate &&
        this.selectedDate.getDate() === day &&
        this.selectedDate.getMonth() === this.currentMonth &&
        this.selectedDate.getFullYear() === this.currentYear;

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${isSunday ? 'sunday' : ''} ${isSelected ? 'selected' : ''} ${event ? 'has-event' : ''}" 
             data-day="${day}"
             data-date="${dateKey}">
          <span class="day-number">${day}</span>
          ${event ? `<span class="event-dot" style="background: ${event.color};" title="${event.title}"></span>` : ''}
        </div>
      `;
    }

    html += `</div>`; // End grid

    // Footer with event legend and stats
    html += `
      <div class="calendar-footer">
        <div class="calendar-stats">
          <div class="stat-item">
            <i class="fas fa-calendar-check"></i>
            <span>${Object.keys(this.events).length} Events</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-star"></i>
            <span>${this.currentYear}</span>
          </div>
        </div>
        <div class="event-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: #0a84ff;"></span>
            <span>Milestones</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #10b981;"></span>
            <span>Achievements</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #f59e0b;"></span>
            <span>Meetings</span>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  addEventListeners() {
    const prevBtn = this.container.querySelector('#prev-month');
    const nextBtn = this.container.querySelector('#next-month');
    const todayBtn = this.container.querySelector('#today-btn');
    const days = this.container.querySelectorAll('.calendar-day:not(.empty)');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentMonth--;
        if (this.currentMonth < 0) {
          this.currentMonth = 11;
          this.currentYear--;
        }
        this.render();
        this.addEventListeners();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentMonth++;
        if (this.currentMonth > 11) {
          this.currentMonth = 0;
          this.currentYear++;
        }
        this.render();
        this.addEventListeners();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.selectedDate = today;
        this.render();
        this.addEventListeners();
      });
    }

    days.forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        // Remove active class from others
        days.forEach(d => d.classList.remove('selected'));
        dayEl.classList.add('selected');

        const day = parseInt(dayEl.getAttribute('data-day'));
        const dateKey = dayEl.getAttribute('data-date');
        this.selectedDate = new Date(this.currentYear, this.currentMonth, day);

        // Show event details if exists
        const event = this.events[dateKey];
        if (event) {
          this.showEventDetails(event, this.selectedDate);
        }
      });
    });
  }

  showEventDetails(event, date) {
    const footer = this.container.querySelector('.calendar-footer');
    const eventDetails = `
      <div class="event-details" style="animation: fadeIn 0.3s ease;">
        <div class="event-header" style="border-left: 3px solid ${event.color}; padding-left: 0.75rem;">
          <h4 style="color: ${event.color}; font-weight: 600; margin-bottom: 0.25rem;">
            ${event.title}
          </h4>
          <p style="font-size: 0.75rem; opacity: 0.75;">
            ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    `;

    // Temporarily show event details
    const existingDetails = footer.querySelector('.event-details');
    if (existingDetails) {
      existingDetails.remove();
    }
    footer.insertAdjacentHTML('afterbegin', eventDetails);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      const details = footer.querySelector('.event-details');
      if (details) {
        details.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => details.remove(), 300);
      }
    }, 3000);
  }
}

// Auto-initialize if the container exists
document.addEventListener('DOMContentLoaded', () => {
  const calendar = new CalendarWidget('calendar-container');
  calendar.init();
});
