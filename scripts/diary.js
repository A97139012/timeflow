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
        this.showFileSelectionScreen(); // 显示文件选择界面
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
                this.createDataFileWithPassword();
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
            
            // 返回文件选择按钮
            if (e.target.id === 'back-to-file-selection') {
                e.preventDefault();
                this.showFileSelectionScreen();
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

    // 检查是否支持File System Access API
    isFileSystemAccessSupported() {
        return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
    }

    // 显示文件选择界面
    showFileSelectionScreen() {
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
                                <button id="create-initial-file">创建新数据文件</button>
                            </div>` : 
                            `<div class="import-section">
                                <button id="mobile-load-data">加载本地数据</button>
                                <input type="file" id="mobile-file-input" accept=".json" style="display:none;">
                                <button id="mobile-save-data">保存本地数据</button>
                            </div>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    // 显示密码输入界面
    showPasswordScreen() {
        const diarySection = document.getElementById('diary');
        if (!diarySection) return;
        
        diarySection.innerHTML = `
            <h2>我的日记</h2>
            <div class="lock-screen">
                <div class="lock-content">
                    <div>
                        <h3>请输入密码</h3>
                        <input type="password" id="unlock-password" placeholder="输入密码">
                        <button id="unlock-diary">解锁</button>
                        <button id="back-to-file-selection" style="margin-left: 10px;">返回</button>
                    </div>
                </div>
            </div>
        `;
    }

    // 设置密码（创建数据文件时使用）
    setPasswordForNewFile() {
        const newPassword = document.getElementById('new-password');
        const confirmPassword = document.getElementById('confirm-password');
        
        if (!newPassword || !confirmPassword) {
            alert('请输入密码');
            return Promise.reject('请输入密码');
        }
        
        if (newPassword.value !== confirmPassword.value) {
            alert('两次输入的密码不一致');
            return Promise.reject('两次输入的密码不一致');
        }
        
        if (!newPassword.value) {
            alert('请输入密码');
            return Promise.reject('请输入密码');
        }
        
        // 存储密码哈希到内存中，稍后保存到数据文件
        this.storedPasswordHash = this.hashPassword(newPassword.value);
        return Promise.resolve(newPassword.value);
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
                this.showPasswordScreen();
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
            alert('文件选择器已在运行中，请完成当前操作');
            return;
        }
        
        if (!this.isFileSystemAccessSupported()) {
            alert('您的浏览器不支持文件系统访问API。');
            return;
        }
        
        try {
            this.filePickerActive = true;
            console.log('正在打开文件选择器...');
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: '日记数据文件',
                    accept: {
                        'application/json': ['.json']
                    }
                }]
            });
            
            console.log('文件选择完成:', fileHandle.name);
            this.dataFileHandle = fileHandle;
            
            // 存储文件信息到localStorage
            localStorage.setItem('diaryDataFileInfo', JSON.stringify({
                name: fileHandle.name,
                lastModified: new Date().toISOString()
            }));
            
            // 显示密码输入界面
            this.showPasswordScreen();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('选择文件时出错:', err);
                alert('选择文件时出错: ' + err.message);
            } else {
                console.log('用户取消了文件选择操作');
            }
        } finally {
            this.filePickerActive = false;
        }
    }

    // 创建带密码的数据文件
    async createDataFileWithPassword() {
        // 检查文件选择器是否已经激活
        if (this.filePickerActive) {
            console.warn('文件选择器已经激活');
            alert('文件选择器已在运行中，请完成当前操作');
            return;
        }
        
        if (!this.isFileSystemAccessSupported()) {
            alert('您的浏览器不支持文件系统访问API。');
            return;
        }
        
        // 显示密码设置界面
        const diarySection = document.getElementById('diary');
        if (!diarySection) return;
        
        diarySection.innerHTML = `
            <h2>我的日记</h2>
            <div class="lock-screen">
                <div class="lock-content">
                    <div>
                        <h3>设置数据文件密码</h3>
                        <input type="password" id="new-password" placeholder="输入新密码">
                        <input type="password" id="confirm-password" placeholder="确认密码">
                        <button id="set-password">设置密码并创建文件</button>
                        <button id="back-to-file-selection" style="margin-left: 10px;">返回</button>
                    </div>
                </div>
            </div>
        `;
        
        // 重新绑定事件
        document.removeEventListener('click', this.tempClickListener);
        this.tempClickListener = (e) => {
            if (e.target.id === 'set-password') {
                e.preventDefault();
                // 在调用createDataFile前也要检查文件选择器状态
                if (this.filePickerActive) {
                    console.warn('文件选择器已经激活');
                    alert('文件选择器已在运行中，请完成当前操作');
                    return;
                }
                
                this.setPasswordForNewFile().then(password => {
                    // 在调用createDataFile前设置filePickerActive状态
                    if (this.filePickerActive) {
                        console.warn('文件选择器已经激活');
                        alert('文件选择器已在运行中，请完成当前操作');
                        return;
                    }
                    this.filePickerActive = true;
                    this.createDataFile(password);
                }).catch(err => {
                    console.log('密码设置失败:', err);
                });
            } else if (e.target.id === 'back-to-file-selection') {
                e.preventDefault();
                this.showFileSelectionScreen();
            }
        };
        document.addEventListener('click', this.tempClickListener);
    }

    // 创建数据文件
    async createDataFile(password) {
        // 检查文件选择器是否已经激活（这个检查已经在调用前做过了，但保留以防万一）
        if (this.filePickerActive && !this.dataFileHandle) {
            console.warn('文件选择器已经激活');
            alert('文件选择器已在运行中，请完成当前操作');
            // 重置状态标志以避免永久锁定
            this.filePickerActive = false;
            return;
        }
        
        if (!this.isFileSystemAccessSupported()) {
            alert('您的浏览器不支持文件系统访问API。');
            this.filePickerActive = false;
            return;
        }
        
        try {
            // 注意：这里不再设置 this.filePickerActive = true，因为在调用前已经设置过了
            console.log('正在打开文件保存对话框...');
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: 'my_diary_data.json',
                types: [{
                    description: '日记数据文件',
                    accept: {
                        'application/json': ['.json']
                    }
                }]
            });
            
            console.log('文件创建完成:', fileHandle.name);
            this.dataFileHandle = fileHandle;
            this.encryptionKey = password;
            
            // 计算并存储密码哈希
            this.storedPasswordHash = this.hashPassword(password);
            console.log('计算密码哈希:', this.storedPasswordHash);
            
            // 创建初始空数据（加密格式）
            const initialData = {
                encryptedDiaries: this.utf8ToBase64(this.xorEncryptDecrypt(JSON.stringify([]), password)),
                passwordHash: this.storedPasswordHash,
                createdAt: new Date().toISOString()
            };
            
            console.log('正在写入初始数据...');
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(initialData, null, 2));
            await writable.close();
            console.log('初始数据写入完成');
            
            // 存储文件信息到localStorage
            localStorage.setItem('diaryDataFileInfo', JSON.stringify({
                name: fileHandle.name,
                lastModified: new Date().toISOString()
            }));
            
            alert('数据文件创建成功！现在可以开始使用日记功能了。');
            
            // 直接解锁日记
            this.isUnlocked = true;
            this.renderDiaryInterface();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('创建文件时出错:', err);
                if (err.name === 'NotAllowedError') {
                    alert('创建文件时出错: 没有保存文件的权限');
                } else {
                    alert('创建文件时出错: ' + err.message);
                }
            } else {
                console.log('用户取消了文件创建操作');
            }
        } finally {
            this.filePickerActive = false;
        }
    }

    // 解锁日记
    async unlockDiary() {
        const inputPassword = document.getElementById('unlock-password');
        
        if (!inputPassword || !inputPassword.value) {
            alert('请输入密码');
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
                console.log('从文件加载的原始数据:', contents);
                const data = JSON.parse(contents);
                
                // 验证密码
                if (data.passwordHash) {
                    const inputPasswordHash = this.hashPassword(this.encryptionKey);
                    console.log('存储的密码哈希:', data.passwordHash);
                    console.log('输入的密码哈希:', inputPasswordHash);
                    if (data.passwordHash !== inputPasswordHash) {
                        return false;
                    }
                }
                
                // 解密日记数据
                if (data.encryptedDiaries) {
                    console.log('发现加密的日记数据');
                    // 检查Base64字符串是否有效
                    if (this.isValidBase64(data.encryptedDiaries)) {
                        const decryptedData = this.xorEncryptDecrypt(this.base64ToUtf8(data.encryptedDiaries), this.encryptionKey);
                        console.log('解密后的数据:', decryptedData);
                        this.diaries = JSON.parse(decryptedData);
                    } else {
                        console.error('无效的Base64字符串');
                        this.diaries = [];
                    }
                } else {
                    // 兼容旧格式或初始空数据
                    this.diaries = data.diaries || [];
                }
                
                console.log('加载的日记数量:', this.diaries.length);
                
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

    // 保存数据到文件
    async saveDataToFile() {
        if (this.isFileSystemAccessSupported()) {
            // 桌面端逻辑
            if (!this.dataFileHandle) {
                // 如果支持文件系统但没有文件句柄，则提示用户
                console.warn('未选择数据文件，无法保存到文件');
                return false;
            }
            
            try {
                // 检查文件句柄是否有效
                if (!this.dataFileHandle.createWritable) {
                    console.error('文件句柄无效，缺少createWritable方法');
                    alert('文件句柄无效，请重新选择数据文件');
                    return false;
                }
                
                // 加密日记数据
                const jsonData = JSON.stringify(this.diaries);
                console.log('准备加密的数据:', jsonData);
                const encryptedData = this.xorEncryptDecrypt(jsonData, this.encryptionKey);
                const base64Data = this.utf8ToBase64(encryptedData);
                console.log('加密后的Base64数据长度:', base64Data.length);
                
                // 准备保存的数据（包含密码哈希）
                const dataToSave = {
                    encryptedDiaries: base64Data,
                    passwordHash: this.storedPasswordHash,
                    lastUpdated: new Date().toISOString()
                };
                
                console.log('正在尝试保存数据到文件...');
                console.log('数据文件句柄名称:', this.dataFileHandle.name);
                const writable = await this.dataFileHandle.createWritable();
                await writable.write(JSON.stringify(dataToSave, null, 2));
                await writable.close();
                console.log('数据成功保存到文件');
                
                return true;
            } catch (err) {
                console.error('保存数据时出错:', err);
                // 提供更具体的错误信息
                if (err.name === 'NotAllowedError') {
                    alert('保存数据时出错: 没有写入文件的权限，请重新选择文件');
                } else if (err.name === 'NotFoundError') {
                    alert('保存数据时出错: 文件未找到，请重新选择文件');
                } else {
                    alert('保存数据时出错: ' + err.message);
                }
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

    // 锁定日记
    lockDiary() {
        this.isUnlocked = false;
        this.diaries = [];
        this.encryptionKey = '';
        this.showFileSelectionScreen();
    }

    // 渲染日记界面
    renderDiaryInterface() {
        const diarySection = document.getElementById('diary');
        if (!diarySection) return;
        
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
            
            ${!this.isFileSystemAccessSupported() ? 
                `<div class="export-section">
                    <h3>数据文件</h3>
                    <button id="mobile-save-data-inline">保存本地数据</button>
                </div>` : ''
            }
        `;
        
        // 设置当前日期
        const diaryDate = document.getElementById('diary-date');
        if (diaryDate) {
            diaryDate.valueAsDate = new Date();
        }
        
        // 加载日记条目
        this.loadDiaryEntries();
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

        if (!dateInput || !contentInput) {
            console.error('找不到日记输入元素');
            return;
        }

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
                console.log('更新现有日记:', this.diaries[existingIndex]);
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
            console.log('创建新日记:', diary);
        }

        // 保存到文件
        console.log('尝试保存日记到文件，当前日记数量:', this.diaries.length);
        this.saveDataToFile().then(success => {
            if (success) {
                this.loadDiaryEntries(); // 重新加载日记列表
                alert('日记保存成功！');
            } else {
                // 即使保存失败，也要更新界面
                this.loadDiaryEntries();
                // 检查是否是因为未选择文件导致的失败
                if (this.isFileSystemAccessSupported() && !this.dataFileHandle) {
                    alert('日记已保存到内存，但尚未选择数据文件。\n请先选择或创建数据文件以实现持久化存储。');
                } else {
                    alert('日记已保存到内存，但保存到文件失败。');
                }
            }
        }).catch(err => {
            console.error('保存日记时发生未处理的错误:', err);
            this.loadDiaryEntries();
            alert('保存日记时发生错误: ' + err.message);
        });
    }

    deleteDiary(diaryId) {
        if (confirm('确定要删除这篇日记吗？')) {
            this.diaries = this.diaries.filter(diary => diary.id !== diaryId);
            
            // 保存到文件
            this.saveDataToFile().then(success => {
                if (success) {
                    this.loadDiaryEntries(); // 重新加载日记列表
                    alert('日记删除成功！');
                } else {
                    // 即使保存失败，也要更新界面
                    this.loadDiaryEntries();
                    // 检查是否是因为未选择文件导致的失败
                    if (this.isFileSystemAccessSupported() && !this.dataFileHandle) {
                        alert('日记已从内存中删除，但尚未选择数据文件。\n请先选择或创建数据文件以实现持久化存储。');
                    } else {
                        alert('日记已从内存中删除，但文件保存失败。');
                    }
                }
            }).catch(err => {
                console.error('删除日记时发生未处理的错误:', err);
                this.loadDiaryEntries();
                alert('删除日记时发生错误: ' + err.message);
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