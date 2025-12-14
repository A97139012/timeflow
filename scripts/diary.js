// 日记模块
class DiaryApp {
    constructor() {
        this.diaries = []; // 默认为空数组
        this.isUnlocked = false; // 是否已解锁
        this.encryptionKey = ''; // 加密密钥
        this.dataFileHandle = null; // 文件句柄
        this.filePickerActive = false; // 文件选择器是否激活
        this.storedPasswordHash = null; // 存储在数据文件中的密码哈希
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStoredFileHandle();
        this.showLockScreen(); // 显示锁定界面
    }

    bindEvents() {
        // 使用事件委托处理所有按钮点击
        document.addEventListener('click', (e) => {
            // 解锁日记按钮
            if (e.target.id === 'unlock-diary') {
                e.preventDefault();
                this.unlockDiary();
            }
            
            // 设置密码按钮
            if (e.target.id === 'set-password') {
                e.preventDefault();
                this.setPassword();
            }
            
            // 选择数据文件按钮
            if (e.target.id === 'select-data-file') {
                e.preventDefault();
                this.selectDataFile();
            }
            
            // 创建数据文件按钮
            if (e.target.id === 'create-data-file') {
                e.preventDefault();
                this.createDataFile();
            }
            
            // 创建初始文件按钮
            if (e.target.id === 'create-initial-file') {
                e.preventDefault();
                this.createDataFile();
            }
            
            // 移动端加载数据按钮
            if (e.target.id === 'mobile-load-data') {
                e.preventDefault();
                document.getElementById('mobile-file-input').click();
            }
            
            // 移动端保存数据按钮
            if (e.target.id === 'mobile-save-data') {
                e.preventDefault();
                this.handleMobileFileSave();
            }
            
            // 锁定日记按钮
            if (e.target.id === 'lock-diary') {
                e.preventDefault();
                this.lockDiary();
            }
            
            // 保存日记按钮
            if (e.target.id === 'save-diary') {
                e.preventDefault();
                this.saveDiary();
            }
            
            // 保存数据文件按钮
            if (e.target.id === 'save-data-file') {
                e.preventDefault();
                this.saveDataToFile().then(success => {
                    if (success) {
                        alert('数据保存成功！');
                    }
                });
            }
            
            // 移动端导出数据按钮
            if (e.target.id === 'mobile-export-data') {
                e.preventDefault();
                this.handleMobileFileSave();
            }
            
            // 移动端导入数据按钮
            if (e.target.id === 'mobile-import-data') {
                e.preventDefault();
                document.getElementById('mobile-import-input').click();
            }
            
            // 移动端内联保存数据按钮
            if (e.target.id === 'mobile-save-data-inline') {
                e.preventDefault();
                this.handleMobileFileSave();
            }
        });
        
        // 移动端文件选择处理
        document.addEventListener('change', (e) => {
            if (e.target.id === 'mobile-file-input') {
                this.handleMobileFileLoad(e);
            }
            
            if (e.target.id === 'mobile-import-input') {
                this.handleMobileFileLoad(e);
            }
        });
    }

    // 加载存储的文件句柄
    async loadStoredFileHandle() {
        if (!this.isFileSystemAccessSupported()) {
            return;
        }
        
        try {
            // 尝试从localStorage获取存储的文件信息
            const storedFileInfo = localStorage.getItem('diaryDataFileInfo');
            if (storedFileInfo) {
                const fileInfo = JSON.parse(storedFileInfo);
                // 这里我们不能直接恢复FileHandle，但可以提示用户选择相同文件
                console.log('找到之前存储的文件信息:', fileInfo);
            }
        } catch (err) {
            console.error('加载存储的文件信息时出错:', err);
        }
    }

    // 检查是否支持File System Access API
    isFileSystemAccessSupported() {
        return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
    }

    // 显示锁定界面
    showLockScreen() {
        const diarySection = document.getElementById('diary');
        if (!diarySection) return;
        
        const isSupported = this.isFileSystemAccessSupported();
        
        diarySection.innerHTML = `
            <h2>我的日记</h2>
            <div class="lock-screen">
                <div class="lock-content">
                    <div>
                        <h3>请选择或创建数据文件</h3>
                        ${isSupported ? 
                            `<div class="import-section">
                                <button id="select-data-file">选择数据文件</button>
                                <button id="create-data-file">创建新数据文件</button>
                            </div>` : 
                            `<div class="import-section">
                                <button id="mobile-load-data">加载本地数据</button>
                                <input type="file" id="mobile-file-input" accept=".json" style="display:none;">
                                <button id="mobile-save-data">保存本地数据</button>
                            </div>`
                        }
                        <div style="margin-top: 20px;">
                            <input type="password" id="unlock-password" placeholder="输入密码">
                            <button id="unlock-diary">解锁</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 设置密码
    setPassword() {
        const newPassword = document.getElementById('new-password');
        const confirmPassword = document.getElementById('confirm-password');
        
        if (!newPassword || !confirmPassword) {
            alert('请输入密码');
            return;
        }
        
        if (newPassword.value !== confirmPassword.value) {
            alert('两次输入的密码不一致');
            return;
        }
        
        if (!newPassword.value) {
            alert('请输入密码');
            return;
        }
        
        // 存储密码哈希到内存中，稍后保存到数据文件
        this.storedPasswordHash = this.hashPassword(newPassword.value);
        
        alert('密码设置成功！请选择或创建数据文件以开始使用。');
        this.showLockScreen();
    }

    // 处理移动端文件加载
    handleMobileFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // 临时存储文件数据
                sessionStorage.setItem('mobileDiaryData', JSON.stringify(data));
                alert('数据加载成功！请输入密码解锁日记。');
            } catch (err) {
                console.error('解析文件时出错:', err);
                alert('文件格式错误: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // 处理移动端文件保存
    handleMobileFileSave() {
        if (!this.isUnlocked) {
            alert('请先解锁日记功能');
            return;
        }
        
        // 检查是否有数据文件
        if (this.isFileSystemAccessSupported() && !this.dataFileHandle) {
            alert('请先选择或创建数据文件');
            return;
        }
        
        // 加密日记数据
        const jsonData = JSON.stringify(this.diaries);
        const encryptedData = this.xorEncryptDecrypt(jsonData, this.encryptionKey);
        const base64Data = this.utf8ToBase64(encryptedData);
        
        // 准备保存的数据（包含密码哈希）
        const dataToSave = {
            encryptedDiaries: base64Data,
            passwordHash: this.storedPasswordHash,
            lastUpdated: new Date().toISOString()
        };
        
        // 创建并下载文件
        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_diary_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('数据文件已保存到您的设备！');
    }

    // 选择数据文件
    async selectDataFile() {
        // 检查文件选择器是否已经激活
        if (this.filePickerActive) {
            console.warn('文件选择器已经激活');
            return;
        }
        
        if (!this.isFileSystemAccessSupported()) {
            alert('您的浏览器不支持文件系统访问API。');
            return;
        }
        
        try {
            this.filePickerActive = true;
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: '日记数据文件',
                    accept: {
                        'application/json': ['.json']
                    }
                }]
            });
            
            this.dataFileHandle = fileHandle;
            
            // 存储文件信息到localStorage
            localStorage.setItem('diaryDataFileInfo', JSON.stringify({
                name: fileHandle.name,
                lastModified: new Date().toISOString()
            }));
            
            alert('数据文件选择成功！请输入密码解锁日记。');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('选择文件时出错:', err);
                alert('选择文件时出错: ' + err.message);
            }
        } finally {
            this.filePickerActive = false;
        }
    }

    // 创建数据文件
    async createDataFile() {
        if (!this.isFileSystemAccessSupported()) {
            alert('您的浏览器不支持文件系统访问API。');
            return;
        }
        
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: 'my_diary_data.json',
                types: [{
                    description: '日记数据文件',
                    accept: {
                        'application/json': ['.json']
                    }
                }]
            });
            
            this.dataFileHandle = fileHandle;
            
            // 创建初始空数据（加密格式）
            const initialData = {
                encryptedDiaries: this.utf8ToBase64(this.xorEncryptDecrypt(JSON.stringify([]), "default")),
                passwordHash: this.storedPasswordHash || null,
                createdAt: new Date().toISOString()
            };
            
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(initialData, null, 2));
            await writable.close();
            
            // 存储文件信息到localStorage
            localStorage.setItem('diaryDataFileInfo', JSON.stringify({
                name: fileHandle.name,
                lastModified: new Date().toISOString()
            }));
            
            alert('数据文件创建成功！请输入密码解锁日记。');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('创建文件时出错:', err);
                alert('创建文件时出错: ' + err.message);
            }
        }
    }

    // 解锁日记
    async unlockDiary() {
        const inputPassword = document.getElementById('unlock-password');
        
        if (!inputPassword || !inputPassword.value) {
            alert('请输入密码');
            return;
        }
        
        // 检查是否选择了数据文件（仅限支持File System Access API的环境）
        if (this.isFileSystemAccessSupported() && !this.dataFileHandle) {
            alert('请先选择或创建数据文件！');
            return;
        }
        
        this.encryptionKey = inputPassword.value;
        
        // 加载日记数据并验证密码
        const isValid = await this.loadDataFromFileAndVerifyPassword();
        
        if (!isValid) {
            alert('密码错误');
            return;
        }
        
        this.isUnlocked = true;
        
        // 重新渲染日记界面
        this.renderDiaryInterface();
    }

    // 从文件加载数据并验证密码
    async loadDataFromFileAndVerifyPassword() {
        if (this.isFileSystemAccessSupported()) {
            // 桌面端逻辑
            if (!this.dataFileHandle) {
                alert('请先选择或创建数据文件');
                return false;
            }
            
            try {
                const file = await this.dataFileHandle.getFile();
                const contents = await file.text();
                const data = JSON.parse(contents);
                
                // 验证密码
                if (data.passwordHash) {
                    const inputPasswordHash = this.hashPassword(this.encryptionKey);
                    if (data.passwordHash !== inputPasswordHash) {
                        return false;
                    }
                }
                
                // 解密日记数据
                if (data.encryptedDiaries) {
                    // 检查Base64字符串是否有效
                    if (this.isValidBase64(data.encryptedDiaries)) {
                        const decryptedData = this.xorEncryptDecrypt(this.base64ToUtf8(data.encryptedDiaries), this.encryptionKey);
                        this.diaries = JSON.parse(decryptedData);
                    } else {
                        console.error('无效的Base64字符串');
                        this.diaries = [];
                    }
                } else {
                    // 兼容旧格式或初始空数据
                    this.diaries = data.diaries || [];
                }
                
                // 更新存储的密码哈希
                this.storedPasswordHash = data.passwordHash;
                return true;
            } catch (err) {
                console.error('加载数据时出错:', err);
                this.diaries = [];
                alert('加载数据时出错，可能密码错误或文件损坏: ' + err.message);
                return false;
            }
        } else {
            // 移动端逻辑
            try {
                const mobileData = sessionStorage.getItem('mobileDiaryData');
                if (mobileData) {
                    const data = JSON.parse(mobileData);
                    // 验证密码
                    if (data.passwordHash) {
                        const inputPasswordHash = this.hashPassword(this.encryptionKey);
                        if (data.passwordHash !== inputPasswordHash) {
                            return false;
                        }
                    }
                    
                    // 解密日记数据
                    if (data.encryptedDiaries) {
                        // 检查Base64字符串是否有效
                        if (this.isValidBase64(data.encryptedDiaries)) {
                            const decryptedData = this.xorEncryptDecrypt(this.base64ToUtf8(data.encryptedDiaries), this.encryptionKey);
                            this.diaries = JSON.parse(decryptedData);
                        } else {
                            console.error('无效的Base64字符串');
                            this.diaries = [];
                        }
                    } else {
                        // 兼容旧格式或初始空数据
                        this.diaries = data.diaries || [];
                    }
                    
                    // 更新存储的密码哈希
                    this.storedPasswordHash = data.passwordHash;
                    
                    // 清除临时数据
                    sessionStorage.removeItem('mobileDiaryData');
                    return true;
                } else {
                    // 没有加载数据文件，使用本地存储的数据
                    const storedData = localStorage.getItem('mobileEncryptedDiaries');
                    if (storedData) {
                        // 检查Base64字符串是否有效
                        if (this.isValidBase64(storedData)) {
                            const decryptedData = this.xorEncryptDecrypt(this.base64ToUtf8(storedData), this.encryptionKey);
                            this.diaries = JSON.parse(decryptedData);
                        } else {
                            console.error('无效的Base64字符串');
                            this.diaries = [];
                        }
                    } else {
                        this.diaries = [];
                    }
                    return true;
                }
            } catch (err) {
                console.error('加载数据时出错:', err);
                this.diaries = [];
                alert('加载数据时出错，可能密码错误: ' + err.message);
                return false;
            }
        }
    }

    // 锁定日记
    lockDiary() {
        this.isUnlocked = false;
        this.diaries = [];
        this.encryptionKey = '';
        this.showLockScreen();
    }
    
    // 保存数据到文件
    async saveDataToFile() {
        if (this.isFileSystemAccessSupported()) {
            // 桌面端逻辑
            if (!this.dataFileHandle) {
                alert('未选择数据文件');
                return false;
            }
            
            try {
                // 加密日记数据
                const jsonData = JSON.stringify(this.diaries);
                const encryptedData = this.xorEncryptDecrypt(jsonData, this.encryptionKey);
                const base64Data = this.utf8ToBase64(encryptedData);
                
                // 准备保存的数据（包含密码哈希）
                const dataToSave = {
                    encryptedDiaries: base64Data,
                    passwordHash: this.storedPasswordHash,
                    lastUpdated: new Date().toISOString()
                };
                
                const writable = await this.dataFileHandle.createWritable();
                await writable.write(JSON.stringify(dataToSave, null, 2));
                await writable.close();
                
                return true;
            } catch (err) {
                console.error('保存数据时出错:', err);
                alert('保存数据时出错: ' + err.message);
                return false;
            }
        } else {
            // 移动端逻辑 - 保存到localStorage
            try {
                // 加密日记数据
                const jsonData = JSON.stringify(this.diaries);
                const encryptedData = this.xorEncryptDecrypt(jsonData, this.encryptionKey);
                const base64Data = this.utf8ToBase64(encryptedData);
                
                localStorage.setItem('mobileEncryptedDiaries', base64Data);
                return true;
            } catch (err) {
                console.error('保存数据时出错:', err);
                alert('保存数据时出错: ' + err.message);
                return false;
            }
        }
    }

    // 渲染日记界面
    renderDiaryInterface() {
        const diarySection = document.getElementById('diary');
        if (!diarySection) return;
        
        // 检查是否选择了数据文件（仅限支持File System Access API的环境）
        if (this.isFileSystemAccessSupported() && !this.dataFileHandle) {
            alert('请先选择或创建数据文件！');
            this.showLockScreen();
            return;
        }
        
        diarySection.innerHTML = `
            <h2>我的日记</h2>
            <div class="diary-controls">
                <button id="lock-diary">锁定日记</button>
                ${!this.isFileSystemAccessSupported() ? 
                    `<button id="mobile-export-data">导出数据</button>
                     <input type="file" id="mobile-import-input" accept=".json" style="display:none;">
                     <button id="mobile-import-data">导入数据</button>` : ''
                }
            </div>
            <div class="diary-editor">
                <input type="date" id="diary-date">
                <textarea id="diary-content" placeholder="写下今天的想法..."></textarea>
                <button id="save-diary">保存日记</button>
            </div>
            
            <div class="diary-list">
                <h3>日记列表</h3>
                <ul id="diary-entries"></ul>
            </div>
            
            <div class="export-section">
                <h3>数据文件</h3>
                ${this.isFileSystemAccessSupported() ? 
                    '<button id="save-data-file">保存到数据文件</button>' : 
                    '<button id="mobile-save-data-inline">保存本地数据</button>'
                }
            </div>
        `;
        
        // 设置当前日期
        const diaryDate = document.getElementById('diary-date');
        if (diaryDate) {
            diaryDate.valueAsDate = new Date();
        }
        
        // 加载日记条目
        this.loadDiaryEntries();
    }

    // 处理导入的数据
    processImportedData() {
        const importedData = sessionStorage.getItem('importedDiaryData');
        if (importedData) {
            try {
                const diaryData = JSON.parse(importedData);
                if (confirm('检测到导入的数据，是否将其合并到当前日记中？')) {
                    // 合并导入的数据
                    this.mergeImportedData(diaryData);
                    // 清除导入的数据
                    sessionStorage.removeItem('importedDiaryData');
                }
            } catch (e) {
                console.error('处理导入数据时出错:', e);
            }
        }
    }

    // 合并导入的数据
    mergeImportedData(importedData) {
        if (Array.isArray(importedData)) {
            // 合并两个数组，去重处理
            const existingIds = this.diaries.map(d => d.id);
            const newEntries = importedData.filter(d => !existingIds.includes(d.id));
            this.diaries = [...this.diaries, ...newEntries];
            
            // 保存加密数据
            if (this.saveEncryptedDiaries()) {
                this.loadDiaryEntries();
                alert(`成功导入 ${newEntries.length} 条新日记！`);
            }
        }
    }

    // 简单的异或加密函数
    xorEncryptDecrypt(data, key) {
        let result = '';
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    // 简单的密码哈希函数
    hashPassword(password) {
        // 这里使用简单的哈希方法作为示例，实际应用中应使用更安全的哈希算法
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash.toString();
    }

    // 检查Base64字符串是否有效
    isValidBase64(str) {
        if (typeof str !== 'string') return false;
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        return base64Regex.test(str) && str.length % 4 === 0;
    }

    // UTF-8字符串转Base64
    utf8ToBase64(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    }

    // Base64转UTF-8字符串
    base64ToUtf8(str) {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }


    saveDiary() {
        const dateInput = document.getElementById('diary-date');
        const contentInput = document.getElementById('diary-content');

        if (!dateInput || !contentInput) return;

        const date = dateInput.value;
        const content = contentInput.value;

        if (!content.trim()) {
            alert('请输入日记内容');
            return;
        }

        // 检查是否已存在该日期的日记
        const existingIndex = this.diaries.findIndex(diary => diary.date === date);

        if (existingIndex >= 0) {
            // 更新现有日记
            if (confirm('该日期已有日记，是否覆盖？')) {
                this.diaries[existingIndex].content = content;
                this.diaries[existingIndex].updatedAt = new Date().toISOString();
            } else {
                return;
            }
        } else {
            // 创建新日记
            const diary = {
                id: Date.now().toString(),
                date: date,
                content: content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.diaries.push(diary);
        }

        // 保存到文件
        this.saveDataToFile().then(success => {
            if (success) {
                this.loadDiaryEntries();
                alert('日记保存成功！');
            }
        });
    }

    deleteDiary(diaryId) {
        if (confirm('确定要删除这篇日记吗？')) {
            this.diaries = this.diaries.filter(diary => diary.id !== diaryId);
            
            // 保存到文件
            this.saveDataToFile().then(success => {
                if (success) {
                    this.loadDiaryEntries();
                }
            });
        }
    }

    loadDiaryEntries() {
        // 按日期倒序排列
        const sortedDiaries = [...this.diaries].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        const diaryList = document.getElementById('diary-entries');
        if (!diaryList) return;

        diaryList.innerHTML = '';

        sortedDiaries.forEach(diary => {
            const listItem = document.createElement('li');
            listItem.className = 'diary-entry';
            
            // 格式化日期显示
            const dateObj = new Date(diary.date);
            const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth()+1}月${dateObj.getDate()}日`;
            
            listItem.innerHTML = `
                <div class="diary-entry-header">
                    <div class="diary-entry-date">${formattedDate}</div>
                </div>
                <div class="diary-entry-content">${diary.content}</div>
                <div class="diary-entry-actions">
                    <button class="delete-diary" data-diary-id="${diary.id}">删除</button>
                </div>
            `;
            diaryList.appendChild(listItem);
        });
        
        // 为删除按钮绑定事件
        const deleteButtons = diaryList.querySelectorAll('.delete-diary');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const diaryId = e.target.getAttribute('data-diary-id');
                this.deleteDiary(diaryId);
            });
        });
    }

    getAllDiaries() {
        return this.diaries;
    }
}

// 当DOM加载完成后初始化日记模块
document.addEventListener('DOMContentLoaded', () => {
    // 延迟一点时间确保DOM完全加载
    setTimeout(() => {
        window.diaryApp = new DiaryApp();
    }, 10);
});