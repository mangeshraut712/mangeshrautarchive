export class CalendarWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.date = new Date();
    this.selectedDate = new Date();

    // "Smart" Reminders Data
    this.reminders = [
      { id: 999, text: "Mangesh's Birthday 🎂", time: "Dec 7", tag: "Special", color: "gold", completed: false },
      { id: 1, text: "Review Portfolio Design", time: "10:00 AM", tag: "Design", color: "blue", completed: false },
      { id: 2, text: "Email Mangesh", time: "2:00 PM", tag: "Urgent", color: "red", completed: false },
      { id: 3, text: "AI Model Training", time: "4:30 PM", tag: "Dev", color: "purple", completed: false },
      { id: 4, text: "Team Sync", time: "Tomorrow", tag: "Work", color: "green", completed: false }
    ];
  }

  init() {
    if (!this.container) return;
    this.render();
    this.bindEvents();
  }

  render() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const days = ["S", "M", "T", "W", "T", "F", "S"];

    const year = this.date.getFullYear();
    const month = this.date.getMonth();
    const today = new Date().getDate();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `
      <div class="ios-widget-wrapper">
        <!-- Calendar Section -->
        <div class="ios-calendar-section">
          <div class="ios-header">
            <div class="month-title">
              <span class="current-month">${monthNames[month]}</span>
              <span class="current-year">${year}</span>
            </div>
            <div class="ios-actions">
              <button class="ios-btn icon-only" title="Previous Month"><i class="fas fa-chevron-left"></i></button>
              <button class="ios-btn today-btn" title="Go to Today"><i class="fas fa-calendar-day"></i></button>
              <button class="ios-btn icon-only" title="Next Month"><i class="fas fa-chevron-right"></i></button>
            </div>
          </div>
          
          <div class="ios-weekdays">
            ${days.map(d => `<span>${d}</span>`).join('')}
          </div>
          
          <div class="ios-grid">
    `;

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
      html += `<span class="day-cell empty"></span>`;
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = (i === today && month === new Date().getMonth() && year === new Date().getFullYear());
      const isBirthday = (month === 11 && i === 7); // Dec 7
      const hasEvent = [5, 12, 18, 25].includes(i); // Dummy events

      let classes = 'day-cell';
      if (isToday) classes += ' today';
      if (isBirthday) classes += ' mangesh-birthday';
      else if (hasEvent) classes += ' has-event';

      html += `
        <span class="${classes}" data-day="${i}" ${isBirthday ? 'title="Mangesh\'s Birthday 🎂"' : ''}>
          ${i}
          ${hasEvent && !isBirthday ? '<div class="event-dot"></div>' : ''}
          ${isBirthday ? '<div class="birthday-dot"></div>' : ''}
        </span>`;
    }

    html += `
          </div>
        </div>
        
        <!-- Smart Reminders Section -->
        <div class="ios-reminders-section">
          <div class="ios-header">
            <div class="reminders-title">
              <i class="fas fa-layer-group"></i> Smart Reminders
            </div>
            <button class="ios-btn-small"><i class="fas fa-plus"></i> New</button>
          </div>
          
          <div class="reminders-scroll-area">
            <div class="reminder-cards-grid">
              ${this.reminders.map(r => `
                <div class="reminder-card ${r.completed ? 'completed' : ''} accent-${r.color}" data-id="${r.id}">
                  <div class="card-accent-strip"></div>
                  <div class="card-content">
                    <div class="card-header-flex">
                       <span class="card-time"><i class="far fa-clock"></i> ${r.time}</span>
                       <span class="card-tag">${r.tag}</span>
                    </div>
                    <div class="card-title">${r.text}</div>
                  </div>
                  <div class="card-action-area" style="display: flex; align-items: center;">
                    <button class="edit-btn" aria-label="Edit Reminder">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="status-circle" aria-label="Toggle Complete">
                      <i class="fas fa-check"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          

        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Month Navigation
    const prevBtn = this.container.querySelector('.ios-actions button:first-child');
    const todayBtn = this.container.querySelector('.today-btn');
    const nextBtn = this.container.querySelector('.ios-actions button:last-child');

    if (prevBtn) prevBtn.onclick = () => this.changeMonth(-1);
    if (todayBtn) todayBtn.onclick = () => this.goToToday();
    if (nextBtn) nextBtn.onclick = () => this.changeMonth(1);

    // Reminder Toggle (Target new Card class)
    this.container.querySelectorAll('.reminder-card').forEach(item => {
      // Toggle Complete on Card Click
      item.onclick = (e) => {
        // Ignore if clicking buttons inside
        if (e.target.closest('.edit-btn')) return;

        const id = parseInt(item.dataset.id);
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
          reminder.completed = !reminder.completed;
          this.render();
        }
      };

      // Edit Button Logic
      const editBtn = item.querySelector('.edit-btn');
      if (editBtn) {
        editBtn.onclick = (e) => {
          e.stopPropagation(); // Stop card click
          const id = parseInt(item.dataset.id);
          const reminder = this.reminders.find(r => r.id === id);
          if (reminder) {
            const newText = prompt("Update Reminder:", reminder.text);
            if (newText !== null && newText.trim() !== "") {
              reminder.text = newText;
              this.render();
            }
          }
        };
      }
    });

    // Add New Reminder
    const newBtn = this.container.querySelector('.ios-btn-small');
    if (newBtn) {
      newBtn.onclick = () => {
        const newReminder = {
          id: Date.now(),
          text: "New Reminder",
          time: "Now",
          color: ["blue", "red", "orange", "green"][Math.floor(Math.random() * 4)],
          tag: "Inbox",
          completed: false
        };
        this.reminders.unshift(newReminder); // Add to top
        this.render();
      };
    }

    // Day Selection
    this.container.querySelectorAll('.day-cell:not(.empty)').forEach(day => {
      day.addEventListener('click', () => {
        this.container.querySelectorAll('.day-cell').forEach(d => d.classList.remove('selected'));
        day.classList.add('selected');
        this.selectedDate = new Date(this.date.getFullYear(), this.date.getMonth(), parseInt(day.dataset.day));
      });
    });
  }

  changeMonth(offset) {
    this.date.setMonth(this.date.getMonth() + offset);
    this.render();
  }

  goToToday() {
    this.date = new Date();
    this.render();
  }
}

// Auto-init
const initCalendarWidget = () => {
  const widget = new CalendarWidget('calendar-widget');
  widget.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendarWidget);
} else {
  initCalendarWidget();
}
