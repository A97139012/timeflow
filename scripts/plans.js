// 计划管理模块
class PlansApp {
    constructor() {
        this.plans = this.loadPlans();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderPlans();
    }

    bindEvents() {
        // 添加计划按钮事件
        document.addEventListener('click', (e) => {
            // 处理添加计划按钮点击
            if (e.target.classList.contains('add-plan-btn')) {
                e.preventDefault();
                const planType = e.target.getAttribute('data-type');
                this.openPlanModal(planType);
            }
            
            // 处理删除计划按钮点击
            if (e.target.classList.contains('delete-plan')) {
                e.preventDefault();
                const planType = e.target.getAttribute('data-plan-type');
                const planId = e.target.getAttribute('data-plan-id');
                this.deletePlan(planType, planId);
            }
            
            // 处理模态框关闭按钮点击
            if (e.target.classList.contains('close')) {
                e.preventDefault();
                this.closePlanModal();
            }
        });

        // 计划表单提交事件
        const planForm = document.getElementById('plan-form');
        if (planForm) {
            planForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePlan();
            });
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('plan-modal');
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target == modal) {
                    this.closePlanModal();
                }
            });
        }
    }

    loadPlans() {
        const plans = localStorage.getItem('plans');
        return plans ? JSON.parse(plans) : {
            'long-term': [],
            'mid-term': [],
            'short-term': []
        };
    }

    savePlans() {
        localStorage.setItem('plans', JSON.stringify(this.plans));
    }

    openPlanModal(planType) {
        const modal = document.getElementById('plan-modal');
        const planTypeInput = document.getElementById('plan-type-input');
        
        if (modal && planTypeInput) {
            planTypeInput.value = planType;
            
            // 重置表单
            const planForm = document.getElementById('plan-form');
            if (planForm) {
                planForm.reset();
            }
            
            modal.style.display = 'block';
        }
    }

    closePlanModal() {
        const modal = document.getElementById('plan-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    savePlan() {
        const planTypeInput = document.getElementById('plan-type-input');
        const planTitle = document.getElementById('plan-title');
        const planDescription = document.getElementById('plan-description');
        const planStartDate = document.getElementById('plan-start-date');
        const planEndDate = document.getElementById('plan-end-date');
        
        if (!planTypeInput || !planTitle) return;
        
        const planType = planTypeInput.value;
        const plan = {
            id: Date.now().toString(),
            title: planTitle.value,
            description: planDescription ? planDescription.value : '',
            startDate: planStartDate ? planStartDate.value : '',
            endDate: planEndDate ? planEndDate.value : '',
            createdAt: new Date().toISOString()
        };

        if (!this.plans[planType]) {
            this.plans[planType] = [];
        }
        
        this.plans[planType].push(plan);
        this.savePlans();
        this.renderPlans();
        this.closePlanModal();
        
        // 通知日历模块更新计划选择列表
        if (window.calendarApp) {
            window.calendarApp.populatePlanSelect();
        }
        
        alert('计划添加成功！');
    }

    deletePlan(planType, planId) {
        if (confirm('确定要删除这个计划吗？')) {
            if (this.plans[planType]) {
                this.plans[planType] = this.plans[planType].filter(plan => plan.id !== planId);
                this.savePlans();
                this.renderPlans();
                
                // 通知日历模块更新计划选择列表
                if (window.calendarApp) {
                    window.calendarApp.populatePlanSelect();
                }
            }
        }
    }

    renderPlans() {
        Object.keys(this.plans).forEach(planType => {
            const planList = document.getElementById(`${planType}-plans`);
            if (!planList) return;

            planList.innerHTML = '';

            this.plans[planType].forEach(plan => {
                const planItem = document.createElement('li');
                planItem.className = `plan-item ${planType}`;
                planItem.innerHTML = `
                    <h4>${plan.title}</h4>
                    ${(plan.startDate || plan.endDate) ? 
                      `<div class="plan-dates">
                         ${plan.startDate ? `开始: ${plan.startDate}` : ''}
                         ${plan.endDate ? ` 结束: ${plan.endDate}` : ''}
                       </div>` : ''}
                    ${plan.description ? `<div class="plan-description">${plan.description}</div>` : ''}
                    <div class="plan-actions">
                        <button class="delete-plan" data-plan-type="${planType}" data-plan-id="${plan.id}">删除</button>
                    </div>
                `;
                planList.appendChild(planItem);
            });
        });
    }

    getAllPlans() {
        return this.plans;
    }

    getPlansByType(type) {
        return this.plans[type] || [];
    }

    importPlans(plansData, merge = false) {
        // 验证导入的数据格式
        if (!plansData || typeof plansData !== 'object') {
            throw new Error('无效的计划数据格式');
        }

        // 检查必要的计划类型是否存在
        const requiredTypes = ['long-term', 'mid-term', 'short-term'];
        for (const type of requiredTypes) {
            if (!plansData.hasOwnProperty(type)) {
                plansData[type] = [];
            }
        }

        if (merge) {
            // 合并模式：将导入的计划添加到现有计划中
            requiredTypes.forEach(type => {
                if (this.plans[type]) {
                    // 合并两个数组，去重（基于ID）
                    const mergedPlans = [...this.plans[type]];
                    plansData[type].forEach(importedPlan => {
                        // 检查是否已存在相同ID的计划
                        const existingIndex = mergedPlans.findIndex(plan => plan.id === importedPlan.id);
                        if (existingIndex >= 0) {
                            // 如果存在，替换它
                            mergedPlans[existingIndex] = importedPlan;
                        } else {
                            // 如果不存在，添加它
                            mergedPlans.push(importedPlan);
                        }
                    });
                    this.plans[type] = mergedPlans;
                } else {
                    this.plans[type] = [...plansData[type]];
                }
            });
        } else {
            // 替换模式：直接使用导入的计划数据
            this.plans = plansData;
        }
        
        // 保存并重新渲染
        this.savePlans();
        this.renderPlans();
        
        // 通知日历模块更新计划选择列表
        if (window.calendarApp) {
            window.calendarApp.populatePlanSelect();
        }
    }
}

// 当DOM加载完成后初始化计划模块
document.addEventListener('DOMContentLoaded', () => {
    // 延迟一点时间确保DOM完全加载
    setTimeout(() => {
        window.plansApp = new PlansApp();
    }, 10);
});