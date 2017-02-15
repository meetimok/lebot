var leconfig = require('./config.js');

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until,
    Keys = webdriver.Key;

var cheerio = require('cheerio');

var botcommands = require('./botcommands.js');
 
var driver = new webdriver.Builder().
   withCapabilities(webdriver.Capabilities.chrome()).
   build();

var login = function() {
    driver.get('https://discordapp.com/login');
    driver.findElement(By.id('register-email')).sendKeys(leconfig.discord.email);
    driver.findElement(By.id('register-password')).sendKeys(leconfig.discord.password + Keys.ENTER);
};

var isTheSameMessage = function(a, b) {
    return a.user == b.user && a.message == b.message && a.timestamp == b.timestamp;
}

var htmlToList = function(html, lastMessage) {
    var $ = cheerio.load(html);

    var boxes = $('.markup');
    var items = [];
    var useItem = false;

    boxes.each(function(i, elem) {
        var id = undefined;

        if ($(this).text == '') {
            return true;
        }

        var item = {
            user: $(this).closest('.comment').find('.message.first .user-name').text(),
            id: '',
            message: $(this).text(),
            mentions: [],
        };

        $(this).find('.mention').each(function(i, elem) {
            item.mentions.push($(elem).text().replace('@', ''));
        })

        $(this).contents().each(function(i, elem) {
            if (this.nodeType == 8) {
                item.id = Number(this.nodeValue.replace('react-text: ', ''));
            }

            return false;
        });

        if (item.user == leconfig.botname || item.user == 'Bot' || !item.id) {
            return true;
        }

        if (lastMessage && item.id == lastMessage.id) {
            useItem = true;
            return true;
        }

        if (useItem || (!lastMessage && i == (boxes.length - 1))) {
            items.push(item);
        }
    });

    return items;
};

var analizeMessages = function(items) {
    var reply = '';

    for (var i = 0; i < items.length; i++) {
        var message = items[i].message.toLowerCase();

        // TODO: Search and call functions without conditions
        if (message.startsWith('!hi')) {
            reply = botcommands.hi(items[i]);
            driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.TAB + Keys.ENTER);
        }
        else if (message.startsWith('!offer')) {
            botcommands.offer(items[i]).then(function(reply) {
                driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.ENTER);
            });
        }
        else if (message.startsWith('!dealz')) {
            reply = botcommands.dealz(items[i]);
            reply = reply.replace('\n', Keys.chord(Keys.CONTROL, Keys.SPACE));
            driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.ENTER);
        }
        else if (message.startsWith('!scam')) {
            reply = botcommands.scam(items[i]);
            driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.TAB + Keys.ENTER);
        }
        else if (message.startsWith('!scamprofile')) {
            botcommands.wowprofile(items[i]).then(function(reply) {
                reply = reply.replace('[TAB]', Keys.TAB);
                driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.TAB + Keys.ENTER);
            });
        }
        else if (message.includes('rm -rf /')
                    || message.includes(':(){ :|: & };:') 
                    || message.includes('dd if=/dev/random of=/dev/sda bs=8m') ) {
            reply = botcommands.rmrf();
            driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.ENTER);
        }
        else if (message.startsWith('!chuck')) {
            botcommands.chuck().then(function(reply) {
                driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.ENTER);
            });
        }
        else if (message.startsWith('kek')) {
            reply = botcommands.kek(items[i]);
            driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.ENTER);
        }
        else if (message.startsWith('!gif')) {
            botcommands.gif().then(function(reply) {
                driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.ENTER);
            });
        }
        else if (message.includes('bot is going to crash')) {
            reply = botcommands.crash(items[i]);
            driver.findElement(By.xpath("//textarea[@placeholder='Message #general']")).sendKeys(reply + Keys.ENTER);
        }
    }

    return items;
};

login();
driver.wait(until.urlContains('https://discordapp.com/channels/@me'));
driver.get('https://discordapp.com/channels/' + leconfig.discord.channel);

// TODO: wait until the right event
driver.sleep(4000);
driver.findElement(By.className('markdown-modal-close')).click().then(function() {

    console.log('Ya en el canal. Iniciando procesamiento.');

    var messagesOnScreen = [];

    var lastMessage = undefined;

    var getScreen = function() {
        driver.wait(function() {
            driver.findElement(By.className('messages')).getAttribute('innerHTML').then(function(html) {
                //console.log('Last read message', lastMessage);

                var messagesOnScreen = htmlToList(html, lastMessage);

                console.log('New messages', messagesOnScreen);

                var readMessages = analizeMessages(messagesOnScreen);

                if (readMessages.length != 0) {
                    lastMessage = readMessages[readMessages.length - 1];
                }
                
                //console.log('New read message', lastMessage);

                driver.sleep(2000).then(function() {
                    return true;
                });
            });
        }).then(getScreen);
    };

    getScreen();
});

driver.quit();
