// 日历模块
class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.selectedDate = null; // 当前选中的日期
        this.init();
    }

    init() {
        this.bindEvents();
        this.populatePlanSelect();
        this.renderCalendar();
    }

    bindEvents() {
        // 使用事件委托处理所有按钮点击
        document.addEventListener('click', (e) => {
            // 处理上个月按钮点击
            if (e.target.id === 'prev-month') {
                e.preventDefault();
                this.previousMonth();
            }
            
            // 处理下个月按钮点击
            if (e.target.id === 'next-month') {
                e.preventDefault();
                this.nextMonth();
            }
            
            // 处理删除事件按钮点击
            if (e.target.classList.contains('delete-event')) {
                e.preventDefault();
                const eventId = e.target.getAttribute('data-event-id');
                this.deleteEvent(eventId);
            }
            
            // 处理日期点击
            if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('other-month')) {
                e.preventDefault();
                this.selectDate(e.target);
            }
            
            // 处理关闭日期详情按钮点击
            if (e.target.id === 'close-date-detail') {
                e.preventDefault();
                this.closeDateDetail();
            }
        });

        // 事件表单提交
        const eventForm = document.getElementById('event-form');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEvent();
            });
        }
    }

    loadEvents() {
        const events = localStorage.getItem('calendarEvents');
        return events ? JSON.parse(events) : [];
    }

    saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    }

    populatePlanSelect() {
        const planSelect = document.getElementById('event-plan');
        if (!planSelect) return;
        
        planSelect.innerHTML = '<option value="">关联计划（可选）</option>';
        
        // 获取所有计划并添加到选择框
        if (window.plansApp) {
            const allPlans = window.plansApp.getAllPlans();
            Object.keys(allPlans).forEach(planType => {
                allPlans[planType].forEach(plan => {
                    const option = document.createElement('option');
                    option.value = plan.id;
                    option.textContent = `${plan.title} (${this.getPlanTypeName(planType)})`;
                    planSelect.appendChild(option);
                });
            });
        }
    }

    getPlanTypeName(planType) {
        const names = {
            'long-term': '长期',
            'mid-term': '中期',
            'short-term': '短期'
        };
        return names[planType] || planType;
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    addEvent() {
        const eventDate = document.getElementById('event-date');
        const eventTitle = document.getElementById('event-title');
        const eventDescription = document.getElementById('event-description');
        const eventPlan = document.getElementById('event-plan');
        
        if (!eventDate || !eventTitle) return;
        
        const event = {
            id: Date.now().toString(),
            date: eventDate.value,
            title: eventTitle.value,
            description: eventDescription ? eventDescription.value : '',
            planId: eventPlan ? eventPlan.value : '',
            createdAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveEvents();
        this.renderCalendar();
        
        // 重置表单
        eventDate.value = '';
        eventTitle.value = '';
        if (eventDescription) eventDescription.value = '';
        if (eventPlan) eventPlan.selectedIndex = 0;
        
        alert('日程添加成功！');
    }

    deleteEvent(eventId) {
        if (confirm('确定要删除这个日程吗？')) {
            this.events = this.events.filter(event => event.id !== eventId);
            this.saveEvents();
            this.renderCalendar();
            
            // 如果当前显示的是该日期的详情，则关闭详情面板
            if (this.selectedDate) {
                const event = this.events.find(e => e.id === eventId);
                if (event && event.date === this.selectedDate) {
                    this.closeDateDetail();
                }
            }
        }
    }

    // 选择日期并显示该日期的计划
    selectDate(dayElement) {
        // 获取日期信息
        const dateNumber = dayElement.querySelector('.calendar-day-number').textContent;
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dateNumber).padStart(2, '0')}`;
        
        this.selectedDate = dateStr;
        
        // 高亮选中的日期
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        dayElement.classList.add('selected');
        
        // 显示该日期的计划
        this.showDateDetail(dateStr);
    }

    // 显示指定日期的详情
    showDateDetail(dateStr) {
        const calendarContainer = document.querySelector('.calendar-container');
        if (!calendarContainer) return;
        
        // 获取该日期的所有事件
        const dateEvents = this.events.filter(event => event.date === dateStr);
        
        // 获取关联的计划
        let plansInfo = '';
        if (window.plansApp) {
            const allPlans = window.plansApp.getAllPlans();
            // 查找与该日期事件关联的计划
            const planIds = [...new Set(dateEvents.map(event => event.planId).filter(id => id))];
            if (planIds.length > 0) {
                plansInfo = '<h4>关联计划:</h4><ul>';
                planIds.forEach(planId => {
                    Object.keys(allPlans).some(planType => {
                        const plan = allPlans[planType].find(p => p.id === planId);
                        if (plan) {
                            plansInfo += `<li>${plan.title} (${this.getPlanTypeName(planType)})</li>`;
                            return true;
                        }
                        return false;
                    });
                });
                plansInfo += '</ul>';
            }
        }
        
        // 格式化日期显示
        const dateObj = new Date(dateStr);
        const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth()+1}月${dateObj.getDate()}日`;
        
        // 构建事件列表
        let eventsHtml = '';
        if (dateEvents.length > 0) {
            eventsHtml = '<h4>当日日程:</h4><ul>';
            dateEvents.forEach(event => {
                // 查找关联的计划名称
                let planInfo = '';
                if (event.planId && window.plansApp) {
                    const allPlans = window.plansApp.getAllPlans();
                    Object.keys(allPlans).some(planType => {
                        const plan = allPlans[planType].find(p => p.id === event.planId);
                        if (plan) {
                            planInfo = ` (${plan.title})`;
                            return true;
                        }
                        return false;
                    });
                }
                
                eventsHtml += `
                    <li>
                        <strong>${event.title}</strong>${planInfo}
                        ${event.description ? `<p>${event.description}</p>` : ''}
                        <button class="delete-event" data-event-id="${event.id}" style="background:#ff4444;color:white;border:none;padding:2px 5px;font-size:12px;border-radius:2px;cursor:pointer;">删除</button>
                    </li>
                `;
            });
            eventsHtml += '</ul>';
        } else {
            eventsHtml = '<p>当天暂无日程安排。</p>';
        }
        
        // 创建详情面板
        const detailPanel = document.createElement('div');
        detailPanel.id = 'date-detail-panel';
        detailPanel.innerHTML = `
            <div style="background:white;border-radius:8px;padding:15px;margin-top:20px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <h3>${formattedDate} 的计划</h3>
                    <button id="close-date-detail" style="background:#667eea;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">关闭</button>
                </div>
                ${plansInfo}
                ${eventsHtml}
            </div>
        `;
        
        // 移除现有的详情面板
        const existingPanel = document.getElementById('date-detail-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // 添加新的详情面板
        calendarContainer.parentNode.insertBefore(detailPanel, calendarContainer.nextSibling);
    }

    // 关闭日期详情面板
    closeDateDetail() {
        const detailPanel = document.getElementById('date-detail-panel');
        if (detailPanel) {
            detailPanel.remove();
        }
        
        // 取消日期高亮
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        this.selectedDate = null;
    }

    renderCalendar() {
        const calendarView = document.getElementById('calendar-view');
        const monthYearElement = document.getElementById('current-month-year');
        
        if (!calendarView || !monthYearElement) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 更新月份显示
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                           '七月', '八月', '九月', '十月', '十一月', '十二月'];
        monthYearElement.textContent = `${year}年 ${monthNames[month]}`;
        
        // 获取当月的第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 获取上个月的最后几天
        const prevLastDay = new Date(year, month, 0).getDate();
        
        // 获取第一天是星期几 (0=周日, 6=周六)
        const firstDayOfWeek = firstDay.getDay();
        
        // 获取本月总天数
        const daysInMonth = lastDay.getDate();
        
        // 渲染日历
        calendarView.innerHTML = '';
        
        // 添加星期标题
        const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarView.appendChild(dayHeader);
        });
        
        // 添加上个月的日期
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.innerHTML = `
                <div class="calendar-day-number">${prevLastDay - i}</div>
            `;
            calendarView.appendChild(dayElement);
        }
        
        // 添加本月日期
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            const isToday = (year === today.getFullYear() && 
                            month === today.getMonth() && 
                            i === today.getDate());
            
            dayElement.className = `calendar-day ${isToday ? 'today' : ''}`;
            dayElement.innerHTML = `<div class="calendar-day-number">${i}</div>`;
            
            // 添加当天事件
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEvents = this.events.filter(event => event.date === dateStr);
            
            if (dayEvents.length > 0) {
                const eventsContainer = document.createElement('div');
                eventsContainer.className = 'calendar-day-events';
                
                dayEvents.slice(0, 3).forEach(event => { // 只显示前3个事件
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event-item';
                    eventElement.textContent = event.title;
                    eventElement.title = event.title;
                    eventsContainer.appendChild(eventElement);
                });
                
                if (dayEvents.length > 3) {
                    const moreElement = document.createElement('div');
                    moreElement.className = 'event-item';
                    moreElement.textContent = `还有${dayEvents.length - 3}项`;
                    eventsContainer.appendChild(moreElement);
                }
                
                dayElement.appendChild(eventsContainer);
            }
            
            calendarView.appendChild(dayElement);
        }
        
        // 计算需要补充的下个月日期数量
        const totalCells = 42; // 6行7列
        const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);
        
        // 添加下个月的日期
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.innerHTML = `
                <div class="calendar-day-number">${i}</div>
            `;
            calendarView.appendChild(dayElement);
        }
        
        // 如果之前有选中的日期，重新显示详情面板
        if (this.selectedDate) {
            this.showDateDetail(this.selectedDate);
        }
    }

    getAllEvents() {
        return this.events;
    }
}

// 当DOM加载完成后初始化日历模块
document.addEventListener('DOMContentLoaded', () => {
    // 延迟一点时间确保DOM完全加载
    setTimeout(() => {
        window.calendarApp = new CalendarApp();
    }, 10);
});