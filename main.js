global.$fs = require('fs');
global.$path = require('path');
global.$moment = require('moment');
const winston = require('winston');
// 配置 Winston 日志
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: 'application.log' })
    ]
});
global.$logger = logger;

let configFile = "./config.json";
let config = $fs.readFileSync($path.join(process.cwd(), configFile), 'utf8');
global.$config = config = JSON.parse(config);



const { app, BrowserWindow, dialog, Menu, Tray, nativeImage } = require('electron');


const zddtStart = require("./index")

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            webSecurity: false, // 只在测试环境中使用
            devTools: false,
        }
    });

    // 开启远程调试
    win.webContents.openDevTools();

    // 加载特定的 URL
    try {
        win.loadFile('index.html');

        // 设置全屏模式
        win.maximize(); // 最大化窗口
        // win.setFullScreen(true); // 设置全屏

        // 去掉菜单栏
        win.setMenu(null);
        app.whenReady().then(zddtStart);

        // win.loadURL('https://www.xt008.cn/');
    } catch (error) {
        logger.error('加载 URL 失败:', error);
    }

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        cleanupResources();
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// 清理所有资源
function cleanupResources() {
    // 关闭所有窗口
    BrowserWindow.getAllWindows().forEach(window => window.close());

    // // 清理托盘图标
    // if (tray) {
    //     tray.destroy();
    //     tray = null;
    // }

    // 清理临时文件或其他资源
    // 示例：清理临时文件
    // fs.unlinkSync('/path/to/temp/file');
}

// 添加一个监听器来处理应用程序退出事件
app.on('before-quit', () => {
    cleanupResources();
});

// 检查命令行参数
const args = process.argv;
if (!args.includes('--remote-debugging-port')) {
    // 如果没有远程调试端口参数，则添加
    app.commandLine.appendSwitch('remote-debugging-port', '9222');
}
