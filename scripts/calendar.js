// 日历模块
class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.completedWorks = this.loadCompletedWorks(); // 加载已完成工作
        this.selectedDate = null; // 当前选中的日期
        this.init();
    }

    init() {
        this.bindEvents();
        this.populatePlanSelect();
        this.renderCalendar();
        this.setDefaultDate(); // 设置默认日期为今天
    }

    // 设置默认日期为今天
    setDefaultDate() {
        const today = new Date();
        const dateString = this.formatDate(today);
        const dateInput = document.getElementById('completed-work-date');
        if (dateInput) {
            dateInput.value = dateString;
        }
    }

    // 格式化日期为 YYYY-MM-DD 格式
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
            
            // 处理标记完成事件按钮点击
            if (e.target.classList.contains('complete-event')) {
                e.preventDefault();
                const eventId = e.target.getAttribute('data-event-id');
                this.toggleEventComplete(eventId);
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

        // 今日完成工作表单提交
        const completedWorkForm = document.getElementById('completed-work-form');
        if (completedWorkForm) {
            completedWorkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCompletedWork();
            });
        }
    }

    loadEvents() {
        const events = localStorage.getItem('calendarEvents');
        return events ? JSON.parse(events) : [];
    }

    // 加载已完成工作
    loadCompletedWorks() {
        const works = localStorage.getItem('completedWorks');
        return works ? JSON.parse(works) : [];
    }

    saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    }

    // 保存已完成工作
    saveCompletedWorks() {
        localStorage.setItem('completedWorks', JSON.stringify(this.completedWorks));
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
            completed: false, // 添加完成状态，默认为false
            createdAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveEvents();
        this.renderCalendar();
        
        // 如果添加的事件日期是当前选中的日期，则更新详细信息面板
        if (this.selectedDate && this.selectedDate === eventDate.value) {
            this.showDateDetail(this.selectedDate);
        }
        
        // 重置表单
        eventDate.value = '';
        eventTitle.value = '';
        if (eventDescription) eventDescription.value = '';
        if (eventPlan) eventPlan.selectedIndex = 0;
        
        alert('日程添加成功！');
    }

    // 添加今日完成工作
    addCompletedWork() {
        const workText = document.getElementById('completed-work-text');
        const workDate = document.getElementById('completed-work-date');
        
        if (!workText || !workDate || !workText.value.trim()) {
            alert('请输入完成的工作内容');
            return;
        }
        
        const work = {
            id: Date.now().toString(),
            date: workDate.value,
            content: workText.value,
            createdAt: new Date().toISOString()
        };

        this.completedWorks.push(work);
        this.saveCompletedWorks();
        this.renderCalendar();
        
        // 重置表单
        workText.value = '';
        
        alert('今日完成工作添加成功！');
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

    // 删除已完成工作
    deleteCompletedWork(workId) {
        if (confirm('确定要删除这条完成的工作记录吗？')) {
            this.completedWorks = this.completedWorks.filter(work => work.id !== workId);
            this.saveCompletedWorks();
            this.renderCalendar();
            this.showDateDetail(this.selectedDate);
        }
    }

    // 切换事件完成状态
    toggleEventComplete(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            event.completed = !event.completed;
            this.saveEvents();
            this.renderCalendar();
            this.showDateDetail(this.selectedDate);
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
        
        // 获取该日期的所有完成工作
        const dateCompletedWorks = this.completedWorks.filter(work => work.date === dateStr);
        
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
                
                // 根据完成状态设置样式和按钮文本
                const completedClass = event.completed ? 'completed-event' : '';
                const completeButtonText = event.completed ? '标记未完成' : '标记完成';
                
                eventsHtml += `
                    <li class="${completedClass}">
                        <strong>${event.title}</strong>${planInfo}
                        ${event.description ? `<p>${event.description}</p>` : ''}
                        <button class="complete-event" data-event-id="${event.id}" style="background:#4caf50;color:white;border:none;padding:2px 5px;font-size:12px;border-radius:2px;cursor:pointer;margin-right:5px;">${completeButtonText}</button>
                        <button class="delete-event" data-event-id="${event.id}" style="background:#ff4444;color:white;border:none;padding:2px 5px;font-size:12px;border-radius:2px;cursor:pointer;">删除</button>
                    </li>
                `;
            });
            eventsHtml += '</ul>';
        } else {
            eventsHtml = '<p>当天暂无日程安排。</p>';
        }
        
        // 构建完成工作列表
        let completedWorksHtml = '';
        if (dateCompletedWorks.length > 0) {
            completedWorksHtml = '<h4>当日完成工作:</h4><ul>';
            dateCompletedWorks.forEach(work => {
                completedWorksHtml += `
                    <li style="margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px dashed #eee;">
                        <p>${work.content}</p>
                        <button class="delete-completed-work" data-work-id="${work.id}" style="background:#ff4444;color:white;border:none;padding:2px 5px;font-size:12px;border-radius:2px;cursor:pointer;">删除</button>
                    </li>
                `;
            });
            completedWorksHtml += '</ul>';
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
                ${completedWorksHtml}
            </div>
        `;
        
        // 绑定删除已完成工作的事件
        detailPanel.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-completed-work')) {
                e.preventDefault();
                const workId = e.target.getAttribute('data-work-id');
                this.deleteCompletedWork(workId);
            }
        });
        
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
            const dayCompletedWorks = this.completedWorks.filter(work => work.date === dateStr);
            
            if (dayEvents.length > 0 || dayCompletedWorks.length > 0) {
                const eventsContainer = document.createElement('div');
                eventsContainer.className = 'calendar-day-events';
                
                // 显示事件
                dayEvents.slice(0, 2).forEach(event => { // 只显示前2个事件
                    const eventElement = document.createElement('div');
                    eventElement.className = `event-item ${event.completed ? 'completed-event' : ''}`;
                    eventElement.textContent = event.title;
                    eventElement.title = event.title;
                    eventsContainer.appendChild(eventElement);
                });
                
                // 显示完成工作标记
                if (dayCompletedWorks.length > 0) {
                    const workElement = document.createElement('div');
                    workElement.className = 'event-item completed-work-indicator';
                    workElement.textContent = `已完成(${dayCompletedWorks.length})`;
                    workElement.title = `今日完成了${dayCompletedWorks.length}项工作`;
                    eventsContainer.appendChild(workElement);
                }
                
                // 显示更多标记
                const totalItems = dayEvents.length + dayCompletedWorks.length;
                if (totalItems > 2) {
                    const moreElement = document.createElement('div');
                    moreElement.className = 'event-item';
                    moreElement.textContent = `还有${totalItems - 2}项`;
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

    // 获取所有已完成工作
    getAllCompletedWorks() {
        return this.completedWorks;
    }

    importEvents(importData, merge = false) {
        // 检查传入的数据类型
        let eventsData, worksData;
        
        if (Array.isArray(importData)) {
            // 旧版数据格式（只有事件）
            eventsData = importData;
            worksData = [];
        } else if (importData && typeof importData === 'object') {
            // 新版数据格式（包含事件和已完成工作）
            eventsData = importData.events || [];
            worksData = importData.completedWorks || [];
        } else {
            throw new Error('无效的日程数据格式');
        }

        if (!Array.isArray(eventsData)) {
            throw new Error('无效的日程事件数据格式');
        }

        if (merge) {
            // 合并模式：将导入的日程添加到现有日程中
            // 合并两个数组，去重（基于ID），优先保留浏览器中已有的完成状态
            
            // 处理事件数据
            const mergedEvents = [...this.events];
            eventsData.forEach(importedEvent => {
                // 检查是否已存在相同ID的日程
                const existingIndex = mergedEvents.findIndex(event => event.id === importedEvent.id);
                if (existingIndex >= 0) {
                    // 如果存在，保留浏览器中的完成状态，其他用导入数据替换
                    const wasCompleted = mergedEvents[existingIndex].completed;
                    mergedEvents[existingIndex] = {...importedEvent, completed: wasCompleted};
                } else {
                    // 如果不存在，添加它
                    mergedEvents.push(importedEvent);
                }
            });
            this.events = mergedEvents;
            
            // 处理已完成工作数据
            const mergedWorks = [...this.completedWorks];
            worksData.forEach(importedWork => {
                // 检查是否已存在相同ID的工作
                const existingIndex = mergedWorks.findIndex(work => work.id === importedWork.id);
                if (existingIndex < 0) {
                    // 如果不存在，才添加（避免重复）
                    mergedWorks.push(importedWork);
                }
            });
            this.completedWorks = mergedWorks;
        } else {
            // 替换模式：直接使用导入的日程数据
            this.events = eventsData;
            this.completedWorks = worksData;
        }
        
        // 保存并重新渲染日历
        this.saveEvents();
        this.saveCompletedWorks();
        this.renderCalendar();
    }
}

// 当DOM加载完成后初始化日历模块
document.addEventListener('DOMContentLoaded', () => {
    // 延迟一点时间确保DOM完全加载
    setTimeout(() => {
        window.calendarApp = new CalendarApp();
    }, 10);
});