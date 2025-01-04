
const { chromium } = require('playwright');
const excel = require('./excel.js');

let pageGotoPath = global.$config.pageGotoPath;
const loginRequestURL = global.$config.loginRequestURL;
const tkPath = global.$config.tkPath;
const wtMinFailedCount = global.$config.wtMinFailedCount;
const wtMaxFailedCount = global.$config.wtMaxFailedCount;
const account = global.$config.account;
const connectOverCDPPort = global.$config.connectOverCDPPort;
let totalTime = 0;
const minTotalTime = global.$config.minTotalTime || 2000;
const maxTotalTime = global.$config.maxTotalTime || 2400;
const accountPath = global.$config.accountPath;

const ctMap = {
    "A": "C",
    "B": "A",
    "C": "D",
    "D": "B"
}
if (process.env.NODE_ENV == "development") {
    pageGotoPath = "file:///E:/nodeSpace/%E4%BF%A1%E9%80%9A%E4%BA%91%E5%AD%A6%E5%A0%82/%E4%BF%A1%E9%80%9A%E4%BA%91%E5%AD%A6%E5%A0%82.html";
    // pageGotoPath = "file:///E:/space/%E4%BF%A1%E9%80%9A%E4%BA%91%E5%AD%A6%E5%A0%82/%E4%BF%A1%E9%80%9A%E4%BA%91%E5%AD%A6%E5%A0%82.html";
}

let danxData = [];
let duoxData = [];
let pdData = [];
let wtCount = 0;

async function zddtStart() {
    let browser = null;
    browser = await chromium.connectOverCDP(`http://localhost:${connectOverCDPPort}`);
    const context = browser.contexts()[0];
    const page = context.pages()[0];

    // await page.goto(pageGotoPath);

    // 定位输入框
    let accountInputValue = "";
    if (process.env.NODE_ENV == "development") {
        accountInputValue = "12345678";
    }
    let accountData = [];
    let rv = await excel.parseExcel({ file: accountPath });
    if (rv.code != 0 || !rv.rows) {
        global.$logger.info('获取账户异常');
       accountData = [];
        // return;
    }

    accountData = rv.rows;
    rv = await excel.parseExcelTransformKeyValueArray({ data: accountData[0], content_rows_index: 0 });
    if (rv.code != 0 || !rv.rows) {
        global.$logger.info('格式化账户异常');
        // return;
    }
    accountData = rv.rows.map((e) => String(e["账户"]));

    // 监听特定URL的网络请求
    let accountStatus = 0;




    rv = await excel.parseExcel({ file: tkPath });
    if (rv.code != 0 || !rv.rows) {
        global.$logger.info('获取题库异常');
        return;
    }

    let tkData = rv.rows;
    rv = await excel.parseExcelTransformKeyValueArray({ data: tkData[0], content_rows_index: 0 });
    if (rv.code != 0 || !rv.rows) {
        global.$logger.info('格式化单选题题库异常');
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
        global.$logger.info('格式化多选题题库异常');
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
        global.$logger.info('格式化判断题题库异常');
        return;
    }
    pdData = rv.rows.map((e) => {
        if (e["题目"]) {
            e["题目"] = unifyPunctuation(e["题目"].toString());
        }
        return e;
    });

    let wtRandomInt = []

    let randomNumbers = []


    let parentElement = null;
    let checkTargetStatus = false;
    const myInterval = createRepeatableInterval(async () => {

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
                global.$logger.info(`元素未找到或页面加载超时`);
            } else {
                global.$logger.error(`元素未找到或页面加载超时:${error}`);
            }
            checkTargetStatus = false;
            return;
        }



        try {

            global.$logger.info(`开始答题:${$moment().format("YYYY-MM-DD HH:mm:ss")}`);

            const allChildElements = await parentElement.$$('*');
            // 获取问题数量
            let totalQuestions = 0;
            if (allChildElements && allChildElements.length > 0) {
                const classes = await allChildElements[0].getAttribute('class');
            }
            allChildElements.forEach((e) => {
                if (!e._preview || !e._preview.includes("ks_wt_div exam-header")) return;
                totalQuestions++;
            })

            totalQuestions = totalQuestions ? totalQuestions : 200;

            let wtTimes = await getRandomTimes(totalTime, totalQuestions);

            let wtNumber = 0;
            for (let child of allChildElements) {
                // const classes = await child.getAttribute('class');
                if (!child._preview || !child._preview.includes("ks_wt_div exam-header")) continue;
                // 对于每个找到的元素，查找其内部具有nestedTargetClass的子元素
                const nestedElements = await child.$$(`.${"ks_wt"}`);

                // 根据需要处理每一个找到的嵌套元素
                for (const nestedElement of nestedElements) {
                    wtNumber++;

                    // 示例：打印嵌套元素的innerText 
                    let textContent = await nestedElement.innerText();
                    if (process.env.NODE_ENV == "development") {
                        // textContent = "80. [判断题] 工程验收时，主控项目不允许有不符合要求的检验结果，必须全部合格。(2分)";
                    }

                    global.$logger.info(`题目内容: ${textContent}`);
                    let type = 0;
                    if (textContent.includes("[单选题]")) {
                        type = 1;
                    } else if (textContent.includes("[多选题]")) {
                        type = 2;
                    } else if (textContent.includes("[判断题]")) {
                        type = 3;
                    } else {
                        global.$logger.info(`未知题：${textContent}`);
                        continue;
                    }
                    textContent = await unifyPunctuation(textContent.toString());
                    let textContentList = textContent.split("]");
                    textContentList.shift();
                    textContentList = textContentList.join("").replace(/\(\s*\)/g, `()`).split("()");
                    let targetContent = textContentList[0].trim();
                    if (!targetContent) {
                        global.$logger.info(targetContent)
                        targetContent = textContentList[1].substring(0, Math.floor(textContentList[1].length / 2))
                    }

                    if (type == 3) {
                        targetContent = targetContent.substring(0, Math.floor(targetContent.length / 2));
                    }

                    global.$logger.info(`匹配内容:${targetContent}`);


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
                        global.$logger.warn(`未匹配到相关题目`);
                    }
                    if (target.length > 0) {
                        // 预设错题，修改答案
                        if (randomNumbers.includes(wtNumber)) {
                            global.$logger.warn(`预设错题`);
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
                                try {
                                    await liElement.click();
                                } catch (e) {
                                    global.$logger.error(`点击选项异常1:${e}`);
                                    try{
                                        // 截取整个页面的屏幕截图并保存为 'example.png'
                                        let screenshotsFileDir = `./logs/${accountInputValue}.png`;
                                        if (!$fs.existsSync(screenshotsFileDir)) {
                                            await page.screenshot({ path: screenshotsFileDir, fullPage: true });
                                        }
                                        // 获取页面的HTML内容
                                        let htmlFileDir = `./logs/${accountInputValue}.txt`;
                                        if (!$fs.existsSync(htmlFileDir)) {
                                            const htmlContent = await page.content();
                                            $fs.writeFileSync(htmlFileDir, htmlContent);
                                        }
                                    }catch(e){
                                        global.$logger.error(`获取截图、html异常:${e}`);
                                    }
                                    try {
                                        await page.$(`.ks_wt`);
                                        await page.$(`.ks_abcd`);
                                        const startElement = await page.$(`#submitExam`);
                                        const startTextContent = await startElement.inputValue();
                                        if (startTextContent != "提交答卷") {
                                            global.$logger.error(`startTextContent异常:${startTextContent}`);
                                        }
                                        // 检查元素是否可见
                                        const isVisible = await startElement.isVisible();

                                        if (!isVisible) {
                                            global.$logger.error(`startTextContent元素不可见:${isVisible}`);
                                        }
                                    } catch (e) {
                                        global.$logger.error(`ks_wt、ks_abcd、submitExam获取异常:${e}`);
                                    }
                                }

                                i++;
                                // let randomNum = (Math.floor(Math.random() * (10 - 3 + 1)) + 3) * 1000;
                                let randomNum = wtTimes[wtNumber - 1] ? wtTimes[wtNumber - 1] * 1000 : 3000;
                                await page.waitForTimeout(randomNum);
                                continue;
                            }
                            // 处理每个li元素，例如获取文本内容
                            let XXTextContent = await liElement.innerText();
                            XXTextContent = unifyPunctuation(XXTextContent);
                            const startIndex = XXTextContent.indexOf('.') + 2; // 找到点后的第一个字符的索引
                            let result = XXTextContent.substring(startIndex); // 从该索引开始截取直到字符串结束
                            global.$logger.info(`匹配的选项内容:${result}`);



                            if (type == 1) {
                                global.$logger.info(`正常答案:${target[0][target[0]["正确答案"]]}`);
                                if (target[0][target[0]["正确答案"]] != result) continue;
                            } else if (type == 2) {
                                let DAList = target[0]["正确答案"].split("");
                                let nextStatus = false;
                                for (let DAItem of DAList) {
                                    global.$logger.info(`正常答案:${target[0][DAItem]}`);
                                    if (target[0][DAItem] != result) continue;
                                    nextStatus = true;
                                }
                                if (!nextStatus) continue;
                            } else if (type == 3) {
                                global.$logger.info(`正常答案:${target[0]["正确答案"]}`);

                                let resultNumber = result == "正确" ? 1 : 0
                                if (target[0]["正确答案"] != resultNumber) continue;
                            }
                            global.$logger.info(`答案匹配成功`);
                            try {
                                await liElement.click();
                            } catch (e) {
                                global.$logger.error(`点击选项异常2:${e}`);
                                try{
                                    // 截取整个页面的屏幕截图并保存为 'example.png'
                                    let screenshotsFileDir = `./logs/${accountInputValue}.png`;
                                    if (!$fs.existsSync(screenshotsFileDir)) {
                                        await page.screenshot({ path: screenshotsFileDir, fullPage: true });
                                    }
                                    // 获取页面的HTML内容
                                    let htmlFileDir = `./logs/${accountInputValue}.txt`;
                                    if (!$fs.existsSync(htmlFileDir)) {
                                        const htmlContent = await page.content();
                                        $fs.writeFileSync(htmlFileDir, htmlContent);
                                    }
                                }catch(e){
                                    global.$logger.error(`获取截图、html异常:${e}`);
                                }
                                try {
                                    await page.$(`.ks_wt`);
                                    await page.$(`.ks_abcd`);
                                    const startElement = await page.$(`#submitExam`);
                                    const startTextContent = await startElement.inputValue();
                                    if (startTextContent != "提交答卷") {
                                        global.$logger.error(`startTextContent异常:${startTextContent}`);
                                    }
                                    // 检查元素是否可见
                                    const isVisible = await startElement.isVisible();

                                    if (!isVisible) {
                                        global.$logger.error(`startTextContent元素不可见:${isVisible}`);
                                    }
                                } catch (e) {
                                    global.$logger.error(`ks_wt、ks_abcd、submitExam获取异常:${e}`);
                                }
                            }


                            // let randomNum = (Math.floor(Math.random() * (10 - 3 + 1)) + 3) * 1000;
                            let randomNum = wtTimes[wtNumber - 1] ? wtTimes[wtNumber - 1] * 1000 : 3000;
                            await page.waitForTimeout(randomNum);

                        }
                    }
                }


            }
            global.$logger.info(`答题结束:${$moment().format("YYYY-MM-DD HH:mm:ss")}，已匹配题目：${wtCount}`);
            // clearInterval(checkTarget);
            myInterval.clear();
            checkTargetStatus = true;
        } catch (error) {
            global.$logger.error(`答题异常终止:${error}`);
            checkTargetStatus = true;
        }
    }, 2000);
    global.$logger.info(`准备工作已完成`);


    await page.goto(pageGotoPath);

    if (process.env.NODE_ENV == "development") {
        accountStatus = 1;
        global.$logger.info(`开启答题流程development`);
        wtRandomInt = getRandomInt(wtMinFailedCount, wtMaxFailedCount);
        global.$logger.info(`预设错题数量:${wtRandomInt}`);

        randomNumbers = getRandomNumbers(1, 70, wtRandomInt);
        global.$logger.info(`预设错题:${randomNumbers.join(",")}`);


        // 获取所有题目所需总时间
        totalTime = getRandomInt(minTotalTime, maxTotalTime);

        parentElement = null;
        checkTargetStatus = false;

        myInterval.set();
    }

    page.route(loginRequestURL, async (route, request) => {
        try {
            accountStatus = 0;

            global.$logger.info(`检测到用户已登录`);
            // 检测是否为指定账户
            //     // 获取请求方法
            const method = request.method();
            // 获取请求体
            let postData = null;
            if (method === 'POST') {
                try {
                    postData = await request.postDataJSON();
                } catch (error) {
                    // 如果不是 JSON 格式，则获取原始字符串数据
                    postData = await request.postData();
                }
            }
            accountInputValue = postData.login_input_username;
            global.$logger.info(`用户:${accountInputValue}`);

            if (accountData.length > 0 && accountInputValue && accountData.includes(String(accountInputValue))) {
                accountStatus = 1;
                global.$logger.info(`开启答题流程`);
            } else {
                accountStatus = -1;
                global.$logger.info(`用户不在指定账户内`);
            }

            if (accountStatus == 1) {
                wtRandomInt = getRandomInt(wtMinFailedCount, wtMaxFailedCount);
                global.$logger.info(`预设错题数量:${wtRandomInt}`);

                randomNumbers = getRandomNumbers(1, 70, wtRandomInt);
                global.$logger.info(`预设错题:${randomNumbers.join(",")}`);


                // 获取所有题目所需总时间
                totalTime = getRandomInt(minTotalTime, maxTotalTime);

                parentElement = null;
                checkTargetStatus = false;

                myInterval.set();
            }
        } catch (error) {
            global.$logger.error(`登录流程异常:${error}`);
        } finally {
            await route.continue();
        }

    });
}


function getRandomNumbers(rangeStart, rangeEnd, count) {
    if (count > (rangeEnd - rangeStart + 1)) {
        global.$logger.info("错误：要求的随机数数量超过范围内的可能值总数。");
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

function getRandomInt(min, max) {
    // 确保 min 和 max 是整数，并且 min 小于等于 max
    min = Math.ceil(min);
    max = Math.floor(max);
    // 生成随机整数，包括 min 和 max
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomTimes(totalTime, totalQuestions) {
    let times = [];

    totalTime = totalTime ? totalTime : 2400;
    totalQuestions = totalQuestions ? totalQuestions : 200;

    const averageTimePerQuestion = Math.floor(totalTime / totalQuestions);

    let minTimePerQuestion = 1;
    let maxTimePerQuestion = averageTimePerQuestion + 3;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let currentTime = 0;

    for (let i = 0; i < totalQuestions; i++) {
        const timeForThisQuestion = getRandomInt(minTimePerQuestion, maxTimePerQuestion);
        currentTime += timeForThisQuestion;
        times.push(timeForThisQuestion);
    }

    const timeDifference = totalTime - currentTime;

    if (timeDifference !== 0) {
        if (timeDifference > 0) {
            // 需要增加时间
            for (let i = 0; i < timeDifference; i++) {
                const index = Math.floor(Math.random() * totalQuestions);
                times[index]++;
            }
        } else {
            // 需要减少时间
            for (let i = 0; i < Math.abs(timeDifference); i++) {
                let index;
                do {
                    index = Math.floor(Math.random() * totalQuestions);
                } while (times[index] < 1); // 确保时间不会减少到0或负数
                times[index]--;
            }
        }

        // 重新计算总时间
        currentTime = times.reduce((acc, val) => acc + val, 0);
    }
    global.$logger.info(`总时间:${currentTime}秒`);
    global.$logger.info(`每题时间:${times}`);

    return times;
}

function createRepeatableInterval(callback, delay) {
    let intervalId;

    function set() {
        if (intervalId) {
            clearInterval(intervalId);
        }
        intervalId = setInterval(callback, delay);
    }

    function clear() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    return {
        set,
        clear
    };
}
module.exports = zddtStart;

