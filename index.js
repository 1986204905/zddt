global.$fs = require('fs');
global.$path = require('path');
global.$moment = require('moment');

const { chromium, webkit } = require('playwright');
const excel = require('./excel.js');
const winston = require('winston');

const logger = winston.createLogger({
    transports: [
        new winston.transports.File({ filename: 'logs.log' })
    ]
});

let configFile = "./config.json";
let config = $fs.readFileSync($path.join(process.cwd(), configFile), 'utf8');
config = JSON.parse(config);

const browserPath = "./webkit-2035/Playwright.exe";
const pageGotoPath = config.pageGotoPath;
const loginRequestURL = config.loginRequestURL;
const tkPath = config.tkPath;
const wtFailedCount = config.wtFailedCount;
const account = config.account;
const ctMap = {
    "A": "C",
    "B": "A",
    "C": "D",
    "D": "B"
}

// const pageGotoPath = "file:///E:/nodeSpace/%E4%BF%A1%E9%80%9A%E4%BA%91%E5%AD%A6%E5%A0%82/%E4%BF%A1%E9%80%9A%E4%BA%91%E5%AD%A6%E5%A0%82.html";
// const tkPath = "./tk.xlsx";
// const wtFailedCount = 0

let danxData = [];
let duoxData = [];
let pdData = [];
let wtCount = 0;

(async () => {
    let browser = null;
    if (process.env.NODE_ENV == "development") {
        browser = await chromium.launch({ headless: false });
    } else {
        browser = await webkit.launch({ executablePath: browserPath, headless: false });
    }

    // 新建一个浏览器上下文
    const context = await browser.newContext();


    // 设置一个较大的窗口尺寸来模拟全屏
    // 注意：这里使用了一些常见的高分辨率显示屏尺寸作为示例
    const page = await context.newPage({ viewport: { width: 1600, height: 900 } });

    await page.goto(pageGotoPath);
    if (process.env.NODE_ENV == "development") {
        await page.setViewportSize({ width: 1600, height: 900 });
    }

    // 监听特定URL的网络请求
    let accountInputValue = "";
    let accountStatus = 0;
    page.route(loginRequestURL, async route => {
        try {
            logger.info(`检测到用户已登录`);
            // 检测是否为指定账户
            const inputLocator = page.locator('#yxtPhone');
            accountInputValue = await inputLocator.inputValue();
            logger.info(`${accountInputValue}`);
            if (account.length < 1 || account.length > 0 && accountInputValue && account.includes(accountInputValue)) {
                accountStatus = 1;
                logger.info(`开启答题流程`);
            } else {
                accountStatus = -1;
                logger.info(`用户不在指定账户内`);
            }
        } catch (error) {
            logger.error(`登录流程异常:${error}`);
        } finally {
            route.continue();
        }

    });

    let randomNumbers = getRandomNumbers(1, 70, wtFailedCount);
    logger.info(`预设错题:${randomNumbers.join(",")}`);

    let rv = await excel.parseExcel({ file: tkPath });
    if (rv.code != 0 || !rv.rows) {
        logger.info('获取题库异常');
        return;
    }

    let tkData = rv.rows;
    rv = await excel.parseExcelTransformKeyValueArray({ data: tkData[0], content_rows_index: 0 });
    if (rv.code != 0 || !rv.rows) {
        logger.info('格式化单选题题库异常');
        return;
    }

    danxData = rv.rows.map((e) => {
        e["题目"] = unifyPunctuation(e["题目"]);
        if (e["A"]) {
            e["A"] = unifyPunctuation(e["A"].toString());
        }
        if (e["B"]) {
            e["B"] = unifyPunctuation(e["B"].toString());
        }
        if (e["C"]) {
            e["C"] = unifyPunctuation(e["C"].toString());
        }
        if (e["D"]) {
            e["D"] = unifyPunctuation(e["D"].toString());
        }
        if (e["E"]) {
            e["E"] = unifyPunctuation(e["E"].toString());
        }
        if (e["F"]) {
            e["F"] = unifyPunctuation(e["F"].toString());
        }
        return e;
    });
    rv = await excel.parseExcelTransformKeyValueArray({ data: tkData[1], content_rows_index: 0 });
    if (rv.code != 0 || !rv.rows) {
        logger.info('格式化多选题题库异常');
        return;
    }
    duoxData = rv.rows.map((e) => {
        if (e["题目"]) {
            e["题目"] = unifyPunctuation(e["题目"].toString());
        }
        if (e["A"]) {
            e["A"] = unifyPunctuation(e["A"].toString());
        }
        if (e["B"]) {
            e["B"] = unifyPunctuation(e["B"].toString());
        }
        if (e["C"]) {
            e["C"] = unifyPunctuation(e["C"].toString());
        }
        if (e["D"]) {
            e["D"] = unifyPunctuation(e["D"].toString());
        }
        if (e["E"]) {
            e["E"] = unifyPunctuation(e["E"].toString());
        }
        if (e["F"]) {
            e["F"] = unifyPunctuation(e["F"].toString());
        }
        return e;
    });
    rv = await excel.parseExcelTransformKeyValueArray({ data: tkData[2], content_rows_index: 0 });
    if (rv.code != 0 || !rv.rows) {
        logger.info('格式化判断题题库异常');
        return;
    }
    pdData = rv.rows.map((e) => {
        if (e["题目"]) {
            e["题目"] = unifyPunctuation(e["题目"].toString());
        }
        return e;
    });

    let parentElement = null;
    let checkTargetStatus = false;
    let checkTarget = setInterval(async () => {
        try {
            if (checkTargetStatus || accountStatus !== 1) return;

            checkTargetStatus = true;

            const startSelector = '#submitExam';

            await page.waitForSelector(startSelector, { timeout: 5000 });

            const startElement = await page.$(startSelector);
            const startTextContent = await startElement.inputValue();

            if (startTextContent != "提交答卷") {
                checkTargetStatus = false;
                return;
            }


            const selector = '#set_div_wyks_detail';
            await page.waitForSelector(selector, { timeout: 5000 });

            parentElement = await page.$(selector);


            if (!parentElement) {
                checkTargetStatus = false;
                return;
            }

        } catch (error) {
            if (error && error.name && error.name == "TimeoutError") {
                logger.info(`元素未找到或页面加载超时`);
            } else {
                logger.error(`元素未找到或页面加载超时:${error}`);
            }
            checkTargetStatus = false;
            return;
        }



        try {

            logger.info(`开始答题:${$moment().format("YYYY-MM-DD HH:mm:ss")}`);

            const allChildElements = await parentElement.$$('*');
            let wtNumber = 0;
            for (let child of allChildElements) {
                const classes = await child.getAttribute('class');
                if (!classes || !classes.includes("ks_wt_div exam-header")) continue;
                // 对于每个找到的元素，查找其内部具有nestedTargetClass的子元素
                const nestedElements = await child.$$(`.${"ks_wt"}`);


                // 根据需要处理每一个找到的嵌套元素
                for (const nestedElement of nestedElements) {
                    wtNumber++;

                    // 示例：打印嵌套元素的innerText 
                    let textContent = await nestedElement.innerText();
                    // textContent = "80. [判断题] 工程验收时，主控项目不允许有不符合要求的检验结果，必须全部合格。(2分)";

                    logger.info(`题目内容: ${textContent}`);
                    let type = 0;
                    if (textContent.includes("[单选题]")) {
                        type = 1;
                    } else if (textContent.includes("[多选题]")) {
                        type = 2;
                    } else if (textContent.includes("[判断题]")) {
                        type = 3;
                    } else {
                        logger.info(`未知题：${textContent}`);
                        continue;
                    }
                    textContent = await unifyPunctuation(textContent.toString());
                    let textContentList = textContent.split("]");
                    textContentList.shift();
                    textContentList = textContentList.join("").replace(/\(\s*\)/g, `()`).split("()");
                    let targetContent = textContentList[0].trim();
                    if (!targetContent) {
                        logger.info(targetContent)
                        targetContent = textContentList[1].substring(0, Math.floor(textContentList[1].length / 2))
                    }

                    if (type == 3) {
                        targetContent = targetContent.substring(0, Math.floor(targetContent.length / 2));
                    }

                    logger.info(`匹配内容:${targetContent}`);


                    let filterData = [];
                    if (type == 1) {
                        filterData = danxData;
                    } else if (type == 2) {
                        filterData = duoxData;
                    } else if (type == 3) {
                        filterData = pdData;
                    }
                    let target = filterData.filter((e) => e["题目"].includes(targetContent));
                    if (target.length < 1) {
                        logger.warn(`未匹配到相关题目`);
                    }
                    if (target.length > 0) {
                        // 预设错题，修改答案
                        if (randomNumbers.includes(wtNumber)) {
                            logger.warn(`预设错题`);
                            if (type == 1) {
                                target[0]["正确答案"] = ctMap[target[0]["正确答案"]] || target[0]["正确答案"];
                            } else if (type == 2) {
                                target[0]["正确答案"] = "A";
                            } else if (type == 3) {
                                target[0]["正确答案"] = target[0]["正确答案"] == "1" ? "0" : "1"
                            }
                        }
                        wtCount++;
                    }





                    const xxElements = await child.$$(`.${"ks_abcd"}`);

                    for (const element of xxElements) {
                        // 在每个找到的元素下查找所有的li子元素
                        const liElements = await element.$$('li');
                        let i = 0;
                        for (const liElement of liElements) {
                            if (target.length < 1) {
                                if (i > 0) continue;
                                await liElement.click();
                                i++;
                                let randomNum = (Math.floor(Math.random() * (10 - 3 + 1)) + 3) * 1000;
                                await page.waitForTimeout(randomNum);
                                continue;
                            }
                            // 处理每个li元素，例如获取文本内容
                            let XXTextContent = await liElement.innerText();
                            XXTextContent = unifyPunctuation(XXTextContent);
                            const startIndex = XXTextContent.indexOf('.') + 2; // 找到点后的第一个字符的索引
                            let result = XXTextContent.substring(startIndex); // 从该索引开始截取直到字符串结束
                            logger.info(`匹配的选项内容:${result}`);



                            if (type == 1) {
                                logger.info(`正常答案:${target[0][target[0]["正确答案"]]}`);
                                if (target[0][target[0]["正确答案"]] != result) continue;
                            } else if (type == 2) {
                                let DAList = target[0]["正确答案"].split("");
                                let nextStatus = false;
                                for (let DAItem of DAList) {
                                    logger.info(`正常答案:${target[0][DAItem]}`);
                                    if (target[0][DAItem] != result) continue;
                                    nextStatus = true;
                                }
                                if (!nextStatus) continue;
                            } else if (type == 3) {
                                logger.info(`正常答案:${target[0]["正确答案"]}`);

                                let resultNumber = result == "正确" ? 1 : 0
                                if (target[0]["正确答案"] != resultNumber) continue;
                            }
                            logger.info(`答案匹配成功`);
                            await liElement.click();


                            let randomNum = (Math.floor(Math.random() * (10 - 3 + 1)) + 3) * 1000;
                            await page.waitForTimeout(randomNum);

                        }
                    }
                }


            }
            logger.info(`答题结束:${$moment().format("YYYY-MM-DD HH:mm:ss")}，已匹配题目：${wtCount}`);
            clearInterval(checkTarget);
            checkTargetStatus = true;
        } catch (error) {
            logger.error(`答题异常终止:${error}`);
            checkTargetStatus = true;
        }
    }, 2000)


    // let checkPage = setInterval(async () => {
    //     try {
    //         await page.evaluate(() => document.body.innerHTML); // 尝试访问页面元素
    //     } catch (error) {
    //         logger.error(`访问页面时出错，可能已关闭：${error}`);
    //         clearInterval(checkPage);
    //         clearInterval(checkTarget)
    //         await browser.close();
    //     }
    // }, 2000); // 每5秒检查一次

})();


function getRandomNumbers(rangeStart, rangeEnd, count) {
    if (count > (rangeEnd - rangeStart + 1)) {
        console.log("错误：要求的随机数数量超过范围内的可能值总数。");
        return;
    }

    let numbers = [];
    while (numbers.length < count) {
        let num = Math.floor(Math.random() * (rangeEnd - rangeStart + 1)) + rangeStart;
        if (numbers.indexOf(num) === -1) {
            numbers.push(num);
        }
    }
    return numbers;
}

function unifyPunctuation(str) {
    // 定义一个对象来保存全角和半角标点符号的对应关系
    const punctuationMap = {
        '，': ',', '。': '.', '！': '!', '？': '?', '：': ':', '；': ';', '‘': "'", '’': "'", '“': '"', '”': '"',
        '（': '(', '）': ')', '［': '[', '］': ']', '｛': '{', '｝': '}', '〈': '<', '〉': '>', '…': '...',
        // 添加更多的映射...
    };

    // 遍历对象并替换字符串中的全角标点符号
    Object.keys(punctuationMap).forEach(fullWidthChar => {
        const halfWidthChar = punctuationMap[fullWidthChar];
        const regex = new RegExp(fullWidthChar, 'g');
        str = str.replace(regex, halfWidthChar);
    });

    return str;
}

