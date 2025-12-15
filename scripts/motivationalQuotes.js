class MotivationalQuotes {
    constructor() {
        this.quotes = [
            "成功不是终点，失败也并非末日，最重要的是继续前进的勇气。",
            "每一天都是一个新的开始，拥抱变化，迎接挑战。",
            "你的时间有限，不要浪费在重复别人的生活上。",
            "相信自己能做到，你就已经成功了一半。",
            "每一个伟大的梦想，都有一个微不足道的开始。",
            "生活就像骑自行车，想保持平衡就得往前走。",
            "不要等待机会，而要创造机会。",
            "成功的秘诀就是每天都比昨天更进一步。",
            "努力不一定成功，但放弃一定失败。",
            "只有不断找寻机会的人才会及时把握机会。"
        ];
        this.currentIndex = 0;
        this.init();
    }

    init() {
        // 创建励志文案显示区域
        this.createQuoteElement();
        
        // 开始循环显示文案
        this.startRotation();
    }

    createQuoteElement() {
        // 创建显示文案的容器
        this.quoteContainer = document.createElement('div');
        this.quoteContainer.id = 'motivational-quote';
        this.quoteContainer.textContent = this.quotes[this.currentIndex];
        
        // 将容器添加到页面右上角
        document.body.appendChild(this.quoteContainer);
    }

    startRotation() {
        // 每10秒更换一次文案
        setInterval(() => {
            this.nextQuote();
        }, 10000);
    }

    nextQuote() {
        this.currentIndex = (this.currentIndex + 1) % this.quotes.length;
        if (this.quoteContainer) {
            this.quoteContainer.textContent = this.quotes[this.currentIndex];
        }
    }
}

// 初始化励志文案功能
document.addEventListener('DOMContentLoaded', () => {
    window.motivationalQuotes = new MotivationalQuotes();
});