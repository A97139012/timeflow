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

        // 绑定导入按钮事件
        const importPlansBtn = document.getElementById('import-plans');
        const importPlansInput = document.getElementById('import-plans-input');
        
        if (importPlansBtn && importPlansInput) {
            importPlansBtn.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            importPlansBtn.addEventListener('click', (e) => {
                e.preventDefault();
                importPlansInput.click();
            });
            
            importPlansInput.addEventListener('change', (e) => {
                this.importPlans(e);
            });
        }

        // 绑定日历导入按钮事件
        const importCalendarBtn = document.getElementById('import-calendar');
        const importCalendarInput = document.getElementById('import-calendar-input');
        
        if (importCalendarBtn && importCalendarInput) {
            importCalendarBtn.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            importCalendarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                importCalendarInput.click();
            });
            
            importCalendarInput.addEventListener('change', (e) => {
                this.importCalendar(e);
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

    importPlans(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const plansData = JSON.parse(e.target.result);
                
                // 询问用户是要合并还是替换
                const choice = confirm('是否要合并导入的计划与当前计划？\n点击"确定"合并计划，点击"取消"替换当前计划。');
                
                if (window.plansApp) {
                    window.plansApp.importPlans(plansData, choice);
                    alert('计划' + (choice ? '合并' : '替换') + '成功！');
                } else {
                    alert('计划模块尚未初始化');
                }
            } catch (err) {
                console.error('导入计划时出错:', err);
                alert('导入计划失败: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    exportCalendar() {
        if (window.calendarApp) {
            // 创建包含事件和已完成工作的导出数据
            const exportData = {
                events: window.calendarApp.getAllEvents(),
                completedWorks: window.calendarApp.getAllCompletedWorks(),
                exportDate: new Date().toISOString()
            };
            
            const calendarData = JSON.stringify(exportData, null, 2);
            this.downloadFile('calendar.json', calendarData, 'application/json');
        } else {
            alert('日历模块尚未初始化');
        }
    }

    importCalendar(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const calendarData = JSON.parse(e.target.result);
                
                // 询问用户是要合并还是替换
                const choice = confirm('是否要合并导入的日程与当前日程？\n点击"确定"合并日程，点击"取消"替换当前日程。');
                
                if (window.calendarApp) {
                    // 使用统一的导入方法处理事件和已完成工作
                    window.calendarApp.importEvents(calendarData, choice);
                    alert('日程' + (choice ? '合并' : '替换') + '成功！');
                } else {
                    alert('日历模块尚未初始化');
                }
            } catch (err) {
                console.error('导入日程时出错:', err);
                alert('导入日程失败: ' + err.message);
            }
        };
        reader.readAsText(file);
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