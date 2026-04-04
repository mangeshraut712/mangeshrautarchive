export class CalendarWidget {
  constructor(e) {
    ((this.container = document.getElementById(e)),
      (this.date = new Date()),
      (this.selectedDate = new Date()),
      (this.reminders = [
        {
          id: 999,
          text: "Mangesh's Birthday 🎂",
          time: 'Dec 7',
          tag: 'Special',
          color: 'gold',
          completed: !1,
        },
        {
          id: 1,
          text: 'Review Portfolio Design',
          time: '10:00 AM',
          tag: 'Design',
          color: 'blue',
          completed: !1,
        },
        {
          id: 2,
          text: 'Email Mangesh',
          time: '2:00 PM',
          tag: 'Urgent',
          color: 'red',
          completed: !1,
        },
        {
          id: 3,
          text: 'AI Model Training',
          time: '4:30 PM',
          tag: 'Dev',
          color: 'purple',
          completed: !1,
        },
        { id: 4, text: 'Team Sync', time: 'Tomorrow', tag: 'Work', color: 'green', completed: !1 },
      ]));
  }
  init() {
    this.container && (this.render(), this.bindEvents());
  }
  render() {
    const e = this.date.getFullYear(),
      t = this.date.getMonth(),
      n = new Date().getDate(),
      i = new Date(e, t, 1).getDay(),
      a = new Date(e, t + 1, 0).getDate();
    let s = `\n      <div class="ios-widget-wrapper">\n        \x3c!-- Calendar Section --\x3e\n        <div class="ios-calendar-section">\n          <div class="ios-header">\n            <div class="month-title">\n              <span class="current-month">${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][t]}</span>\n              <span class="current-year">${e}</span>\n            </div>\n            <div class="ios-actions">\n              <button class="ios-btn icon-only" title="Previous Month"><i class="fas fa-chevron-left"></i></button>\n              <button class="ios-btn today-btn" title="Go to Today"><i class="fas fa-calendar-day"></i></button>\n              <button class="ios-btn icon-only" title="Next Month"><i class="fas fa-chevron-right"></i></button>\n            </div>\n          </div>\n          \n          <div class="ios-weekdays">\n            ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(e => `<span>${e}</span>`).join('')}\n          </div>\n          \n          <div class="ios-grid">\n    `;
    for (let e = 0; e < i; e++) s += '<span class="day-cell empty"></span>';
    for (let i = 1; i <= a; i++) {
      const a = i === n && t === new Date().getMonth() && e === new Date().getFullYear(),
        d = 11 === t && 7 === i,
        o = [5, 12, 18, 25].includes(i);
      let r = 'day-cell';
      (a && (r += ' today'),
        d ? (r += ' mangesh-birthday') : o && (r += ' has-event'),
        (s += `\n        <span class="${r}" data-day="${i}" ${d ? 'title="Mangesh\'s Birthday 🎂"' : ''}>\n          ${i}\n          ${o && !d ? '<div class="event-dot"></div>' : ''}\n          ${d ? '<div class="birthday-dot"><i class="fab fa-apple"></i></div>' : ''}\n        </span>`));
    }
    ((s += `\n          </div>\n        </div>\n        \n        \x3c!-- Smart Reminders Section --\x3e\n        <div class="ios-reminders-section">\n          <div class="ios-header">\n            <div class="reminders-title">\n              <i class="fas fa-layer-group"></i> Smart Reminders\n            </div>\n            <button class="ios-btn-small"><i class="fas fa-plus"></i> New</button>\n          </div>\n          \n          <div class="reminders-scroll-area">\n            <div class="reminder-cards-grid">\n              ${this.reminders.map(e => `\n                <div class="reminder-card ${e.completed ? 'completed' : ''} accent-${e.color}" data-id="${e.id}">\n                  <div class="card-accent-strip"></div>\n                  <div class="card-content">\n                    <div class="card-header-flex">\n                       <span class="card-time"><i class="far fa-clock"></i> ${e.time}</span>\n                       <span class="card-tag">${e.tag}</span>\n                    </div>\n                    <div class="card-title">${e.text}</div>\n                  </div>\n                  <div class="card-action-area" style="display: flex; align-items: center;">\n                    <button class="edit-btn" aria-label="Edit Reminder">\n                        <i class="fas fa-pencil-alt"></i>\n                    </button>\n                    <button class="status-circle" aria-label="Toggle Complete">\n                      <i class="fas fa-check"></i>\n                    </button>\n                  </div>\n                </div>\n              `).join('')}\n            </div>\n          </div>\n          \n\n        </div>\n      </div>\n    `),
      (this.container.innerHTML = s),
      this.bindEvents());
  }
  bindEvents() {
    const e = this.container.querySelector('.ios-actions button:first-child'),
      t = this.container.querySelector('.today-btn'),
      n = this.container.querySelector('.ios-actions button:last-child');
    (e && (e.onclick = () => this.changeMonth(-1)),
      t && (t.onclick = () => this.goToToday()),
      n && (n.onclick = () => this.changeMonth(1)),
      this.container.querySelectorAll('.reminder-card').forEach(e => {
        e.onclick = t => {
          if (t.target.closest('.edit-btn')) return;
          const n = parseInt(e.dataset.id),
            i = this.reminders.find(e => e.id === n);
          i && ((i.completed = !i.completed), this.render());
        };
        const t = e.querySelector('.edit-btn');
        t &&
          (t.onclick = t => {
            t.stopPropagation();
            const n = parseInt(e.dataset.id),
              i = this.reminders.find(e => e.id === n);
            if (i) {
              const e = prompt('Update Reminder:', i.text);
              null !== e && '' !== e.trim() && ((i.text = e), this.render());
            }
          });
      }));
    const i = this.container.querySelector('.ios-btn-small');
    (i &&
      (i.onclick = () => {
        const e = {
          id: Date.now(),
          text: 'New Reminder',
          time: 'Now',
          color: ['blue', 'red', 'orange', 'green'][Math.floor(4 * Math.random())],
          tag: 'Inbox',
          completed: !1,
        };
        (this.reminders.unshift(e), this.render());
      }),
      this.container.querySelectorAll('.day-cell:not(.empty)').forEach(e => {
        e.addEventListener('click', () => {
          (this.container
            .querySelectorAll('.day-cell')
            .forEach(e => e.classList.remove('selected')),
            e.classList.add('selected'),
            (this.selectedDate = new Date(
              this.date.getFullYear(),
              this.date.getMonth(),
              parseInt(e.dataset.day)
            )));
        });
      }));
  }
  changeMonth(e) {
    (this.date.setMonth(this.date.getMonth() + e), this.render());
  }
  goToToday() {
    ((this.date = new Date()), this.render());
  }
}
const initCalendarWidget = () => {
  new CalendarWidget('calendar-widget').init();
};
'loading' === document.readyState
  ? document.addEventListener('DOMContentLoaded', initCalendarWidget)
  : initCalendarWidget();
