// 主脚本文件
class TimeFlowApp {
    constructor() {
        this.init();
    }

    init() {
        // 确保DOM加载完成后再绑定事件
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEvents();
                this.setupTabs();
                this.checkMobileCompatibility();
            });
        } else {
            this.bindEvents();
            this.setupTabs();
            this.checkMobileCompatibility();
        }
    }

    checkMobileCompatibility() {
        // 检查是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 检查File System Access API支持
        const isFileSystemAccessSupported = 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
        
        if (isMobile && !isFileSystemAccessSupported) {
            // 在移动设备上显示提示信息
            const header = document.querySelector('header');
            if (header) {
                const notice = document.createElement('div');
                notice.className = 'mobile-notice';
                notice.innerHTML = `
                    <p style="text-align: center; background-color: #fff3cd; color: #856404; padding: 10px; margin: 0;">
                        <strong>移动端提示：</strong>您正在使用移动设备访问本应用。部分功能（如文件系统访问）可能受限，
                        但应用已针对移动端进行了优化，可以正常使用日记功能。
                    </p>
                `;
                header.parentNode.insertBefore(notice, header.nextSibling);
            }
        }
    }

    setupTabs() {
        // 检查URL哈希并激活相应标签
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.switchTab(hash);
        } else {
            // 默认激活第一个标签
            this.switchTab('plans');
        }
    }

    bindEvents() {
        // 导航标签切换
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            // 添加touchstart事件以提高移动端响应性
            link.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = e.target.getAttribute('href').substring(1);
                this.switchTab(tabId);
                // 更新URL哈希但不触发页面跳转
                history.pushState(null, null, '#' + tabId);
            });
        });

        // 处理浏览器前进后退按钮
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                this.switchTab(hash);
            } else {
                this.switchTab('plans');
            }
        });

        // 绑定导出按钮事件
        const exportPlansBtn = document.getElementById('export-plans');
        const exportCalendarBtn = document.getElementById('export-calendar');
        
        if (exportPlansBtn) {
            exportPlansBtn.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            exportPlansBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportPlans();
            });
        }
        
        if (exportCalendarBtn) {
            exportCalendarBtn.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            exportCalendarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportCalendar();
            });
        }
    }

    // 处理触摸开始事件，提高移动端响应性
    handleTouchStart(e) {
        e.currentTarget.classList.add('touch-active');
        // 在触摸结束后移除active状态
        setTimeout(() => {
            e.currentTarget.classList.remove('touch-active');
        }, 150);
    }

    switchTab(tabId) {
        // 隐藏所有标签内容
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(section => {
            section.classList.remove('active');
        });
        
        // 移除所有活动链接状态
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // 显示目标标签内容
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // 设置活动链接状态
        const activeLink = document.querySelector(`nav a[href="#${tabId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // 触发各模块的初始化方法
        if (tabId === 'calendar') {
            if (window.calendarApp) {
                window.calendarApp.renderCalendar();
            } else {
                window.calendarApp = new CalendarApp();
            }
        } else if (tabId === 'diary') {
            // 日记模块将在内部处理自己的状态
            if (!window.diaryApp) {
                window.diaryApp = new DiaryApp();
            }
        } else if (tabId === 'plans') {
            // 确保计划模块已初始化
            if (!window.plansApp) {
                window.plansApp = new PlansApp();
            }
        }
    }

    exportPlans() {
        if (window.plansApp) {
            const plansData = JSON.stringify(window.plansApp.getAllPlans(), null, 2);
            this.downloadFile('plans.json', plansData, 'application/json');
        } else {
            alert('计划模块尚未初始化');
        }
    }

    exportCalendar() {
        if (window.calendarApp) {
            const calendarData = JSON.stringify(window.calendarApp.getAllEvents(), null, 2);
            this.downloadFile('calendar.json', calendarData, 'application/json');
        } else {
            alert('日历模块尚未初始化');
        }
    }

    downloadFile(filename, content, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.timeFlowApp = new TimeFlowApp();
});