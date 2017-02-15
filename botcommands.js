var Feed = require('rss-to-json');
var request = require('request');
var cheerio = require('cheerio');

var Datastore = require('nedb'),
    db = new Datastore({ filename: 'data.db', autoload: true });

var NodeCache = require('node-cache');

const myCache = new NodeCache( { stdTTL: 5 * 60, checkperiod: 120 } );


var _getRandom = function(array) {
    return array[Math.floor(Math.random() * array.length)];
};

class VPS {
    constructor(options) {
    }

    toString() {
        return '```' + this.getCPU() + '\n' +
            this.getNumberOfCores() + ' vCores\n' +
            this.getRAM() + 'GB RAM\n' +
            this.getDisk() + ' \n' +
            'For just $' + this.getPrice() + '/mo' +
            '```' + 
            'Buy now: <https://lowendtalk.com>';
    }

    getNumberOfCores() {
        var noc = [1, 2, 3, 4, 6, 8];

        return this._getRandom(noc);
    }

    getCPU() {
        var that = this;

        var fs = require('fs');

        var cpuArray = JSON.parse(fs.readFileSync('cpudata.json', 'utf8'));

        var cpuObj = that._getRandom(cpuArray);

        return cpuObj['Model\nnumber'];
    }

    getRAM() {
        var ram = [1, 2, 4, 6, 8, 12, 32, 64, 72, 128];

        return this._getRandom(ram);
    }

    getDisk() {
        var units = ['GB', 'TB'];

        var space = [10, 15, 20, 30, 40, 50, 100, 120];

        var tech = ['SSD', 'HDD'];

        return this._getRandom(space) + this._getRandom(units) + ' ' + this._getRandom(tech);
    }

    getPrice() {
        var price = [1, 2, 3, 5, 10, 15];

        return this._getRandom(price);
    }

    _getRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

module.exports = {
    hi: function(input) {
        return ':couple_with_heart: **Love you ' + input.user + '**';
    },

    offer: function(input) {
        return new Promise((fulfill, reject) => {
            var letUser = '';
            var matches = input.message.match(/^!offer ([a-z_]+)/i);

            if (Array.isArray(matches) ) {
                letUser = matches[1];
            }

            if (letUser) {
                var endpoint = 'https://www.lowendtalk.com/profile/discussions/' + letUser;
                request(endpoint, function(error, response, body) {
                    console.log(response.statusCode + ' ' + endpoint);

                    if (!error && response.statusCode == 200) {
                        var $ = cheerio.load(body);

                        var offer = undefined;

                        $('.ItemDiscussion').each(function(i, el) {
                            if ($(this).find('.Category').hasClass('Category-offers')) {
                                offer = {
                                    title: $(this).find('.Title').text().trim(),
                                    url: $(this).find('.Title a').attr('href'),
                                    views: $(this).find('.ViewCount .Number').text()
                                };

                                return false;
                            }
                        });

                        if (offer) {
                            fulfill(
                                ':fire: | The latest offer from ' + letUser + ' in LET:\n' +
                                '**' + offer.title + '**\n' +
                                (offer.views.includes('K') ? ('*' + offer.views + ' views. Harry up!*\n') : '') +
                                '<' + offer.url + '>'
                            );                            
                        }
                    }
                    else {
                        fulfill('Are you sure this is a LET provider? Are you trying a scam?');
                    }
                })
            }
            else {
                var rssItems = myCache.get('rss.items');

                if ( rssItems == undefined ){
                    Feed.load('https://www.lowendtalk.com/categories/offers/feed.rss', function(err, rss) {
                        console.log('Getting offer from live web');

                        myCache.set('rss.items', rss.items );

                        var offer = _getRandom(rss.items);

                        var message = 'Here is a cheap offer for you:\n\n' +
                                        offer.title + '\n <' + offer.link + '>';

                        fulfill(message);
                    });
                }
                else {
                    console.log('Getting offer from cache');

                    var offer = _getRandom(rssItems);

                    console.log(offer);

                    var message = 'Here is a cheap offer for you:\n\n' +
                                    offer.title + '\n <' + offer.link + '>';

                    fulfill(message);
                }
            }

            
        });
    },

    dealz: function() {
       const vps = new VPS();

       return 'You\'ve got a real deal!\n\n' + vps.toString();
    },

    scam: function(input) {
        var responses = [
            'Are you a scammer?',
            'You must be proud of your scam activity',
            'Cheater',
            'Nope!',
            'WOW SCAM'
        ];

        if (input.mentions.length > 0) {
            var toUser = '';
            var currentPoints = 0;
            var user = null;

            var matches = input.message.match(/^!scam @(.+)/i);

            if (Array.isArray(matches) && matches[1] == input.mentions[0] ) {
                toUser = input.mentions[0];
            }
            else {
                return _getRandom(responses);
            }

            if (toUser == 'imok') {
                return _getRandom(responses);
            }

            if (toUser == 'lebot') {
                return ':robot: You cannot harm lebot... SCAMMER!';
            }

            db.findOne({name: toUser}, function(err, doc) {

                console.log('found');
                console.log(doc);

                if (doc === null) {
                    //create user and add point
                    user = {
                        name: toUser,
                        scam: {
                            received: 1
                        }
                    };

                    db.insert(user, function() {
                        db.findOne({name: toUser}, function(err, docs) {
                            console.log('inserted');
                            console.log(docs);
                        })
                    });
                }
                else {
                    db.update(
                        { name: doc.name },
                        { $inc: { 'scam.received': 1 } }
                        /*,{ returnUpdatedDocs: true },
                        function(err, numAffected, affectedDocuments) {
                            console.log('updated');
                            console.log(affectedDocuments);
                        }*/
                    );
                }
            })

            return ':spy: **' + input.user + ' gave a scam point to ' + toUser + '**';
        }
        else {
            return _getRandom(responses);
        }
    },

    wowprofile: function(message) {
        var response = '';

        return new Promise((fulfill, reject) => {
            if (message.mentions.length > 0) {
                user = message.mentions[0];

                db.findOne({name: user}, function(err, doc) {
                    response = ':spy: **' + doc.name + ' has ' + doc.scam.received + ' scam points**';
                    fulfill(response);
                });
            }
        });
    },

    rmrf: function() {
        var text = [
            'a02uij0xj ps05ñ2X czCd89yourmomK dfsdf',
            'Hasta la vista, baby',
            'Arrivederci',
            'Are you sure? (Yes/No): Yes',
            'YOLO',
        ];

        return '**Preparing world destruction... ' + _getRandom(text) + '... Restarting... Fuck.**'
    },

    chuck: function() {
        var response = '';

        return new Promise((fulfill, reject) => {
            request('https://api.chucknorris.io/jokes/random', function (error, response, body) {
                console.log(body);
                if (!error && response.statusCode == 200) {
                    fulfill(JSON.parse(body).value);
                }
            })
        });
    },

    kek: function(input) {
        if (input.user.toLowerCase() == 'ne00n') {
            return '**That is not funny**';
        }
    },

    gif: function(input) {
        return new Promise((fulfill, reject) => {
            var endpoint = 'http://9gag.com/gif/fresh';

            request(endpoint, function(error, response, body) {
                console.log(response.statusCode + ' ' + endpoint);

                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(body);

                    var elem = _getRandom($('.badge-entry-collection .badge-animated-container-animated'));

                    fulfill(':drum: ' + $(elem).attr('data-image'));
                }
            });
        });
    },

    crash: function(input) {
        return ':robot: Crashing...\n**Nope.**';
    },
};
