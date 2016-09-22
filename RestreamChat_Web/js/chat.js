var lastMessageId = "";
var lastCommandId = "";
var lastSettingsTimestamp = "";
var lastCountersTimestamp = "";
var currentThemeName = "main";
var lastScrollTop = -1;
var messageTimeout = 0;
var isCounterEnabled = false;
var inEffect = undefined;
var outEffect = undefined;
var messageLimit = 300;
var config;

// custom
var Log = console.log;
var restreamHostURL = "http://localhost:5010?url=http://localhost:8080";
var escapeTags = true;
if (window.location.href.indexOf("nobg=1") == -1) // if in popup window (i.e. not in OBS), make background full-black
	document.write("<style>body { background-color: black !important; }</style>");

try {
    $(document).ready(function () {

        var interval = 1500;

        parseUrlOptions();

        $('#replybox').hide();
        /*$('#chat').on('click', function (event) {
            if (event.target.id != 'replybox')
                $('#replybox').toggle();
        });*/

        $('#replybox').on('click', function (event) {
            if (event.target.id == 'replybox')
                $('#replybox').toggle();
        });
        $('#messagetext').keydown(function (e) {

            if (e.ctrlKey && e.keyCode == 13) {
                sendMessage();
            }
        });

        $('#newmessagesticker').on('click', function () {
            $('#newmessagesticker').hide();
            scrollDown();
        });

        $('#sendbutton').on('click', function () {
            sendMessage();
        });
        var sendMessage = function () {
            $.post(
                restreamHostURL + "/send",
                {
                    text: $('#messagetext').val()
                })
            .success(function () { $('#replytext').val(''); $('#replybox').toggle(); })
            .error(function () { alert('Error sending message!'); });
        };
        var refreshCounters = function () {
            if (!isCounterEnabled)
                return;

            try {
                $.ajax({
                    url: restreamHostURL + "/counters.json" + (lastCountersTimestamp == "" ? "" : "?id=" + lastCountersTimestamp),
                    cache: false,
                    success: function (json) {
                        if (!(json instanceof Object))
                            json = JSON.parse(json);

                        lastCountersTimestamp = json.id;

                        if (json.chats instanceof Array && json.chats.length > 0) {

                            var transform = {
                                "tag": "div", class: function () {
                                    var result = 'counter';
                                    if (this.IsLoggedIn)
                                        result += ' counter-green';
                                    else if (this.IsConnected)
                                        result += ' counter-yellow';
                                    else
                                        result += ' counter-red';
                                    return result;
                                }, "children": [
                                { "tag": "img", class : "countericon", "src": "${Icon}", "html": "" },
                                { "tag": "div", class: "counternum", "html": "${Counter}" },
                                ]
                            };
                            $('#counters').empty();
                            for (var i = 0; i < json.chats.length; i++) {
                                $('#counters').json2html(json.chats[i], transform);
                            }

                        }

                        setTimeout(function () {
                            refreshCounters();
                        }, interval);
                    },
                    timeout: 59000,
                    error: function () {
                        setTimeout(function () {
                            refreshCounters()
                        }, interval);
                    }
                });
            } catch (e) {
                setTimeout(function () {
                    refreshCounters()
                }, interval);
            }

        };
        refreshCounters();

        var refreshCommands = function () {
            try {
                $.ajax({
                    url: restreamHostURL + "/commands.json" + (lastCommandId == "" ? "" : "?id=" + lastCommandId),
                    cache: false,
                    success: function (json) {
                        if (!(json instanceof Array))
                            json = JSON.parse(json);

                        if (json instanceof Array && json.length > 0) {

                            for (var i = 0; i < json.length; i++) {
                                var cmd = json[i];
                                if (cmd.Text != "ping")
                                    lastCommandId = json[json.length - 1].Id;

                                switch (cmd.Text) {
                                    case "clear":
                                        var clearUrl = '';
                                        var clearChannel = '';
                                        var clearNickname = '';
                                        lastScrollTop = -1;
                                        if (cmd.Channel != null)
                                        {
                                            clearUrl = cmd.Channel.ChatIconURL.replace("pack://application:,,,", "");
                                            clearChannel = cmd.Channel.ChannelName;
                                        }
                                        else if(cmd.User != null )
                                        {
                                            clearUrl = cmd.User.ChatIconURL.replace("pack://application:,,,", "");;
                                            clearChannel = cmd.User.ChannelName;
                                            clearNickname = cmd.User.NickName;
                                        }
                                        if (clearChannel.toLowerCase() == "#allchats") {
                                            $("#chat").empty();
                                        }
                                        else {
                                            $("img[src *= '" + clearUrl + "']").each(
                                                function (index) {
                                                    var elmessage = $(this).parent();
                                                    if ($(elmessage).html().indexOf(clearChannel) > -1) {
                                                        if( clearNickname == null )
                                                            $(elmessage).remove();
                                                        else if( $(elmessage).html().indexOf( ">" + clearNickname ) > -1)
                                                            $(elmessage).remove();
                                                    }

													$(elmessage).html($(elmessage).html() + $(elmessage).html());
                                                });;
                                        }
                                        break;
                                }
                            }
                        }

                        setTimeout(function () {
                            refreshCommands();
                        }, interval);
                    },
                    timeout: 59000,
                    error: function () {
                        setTimeout(function () {
                            refreshCommands()
                        }, 3000);
                    }
                });
            } catch (e) {
                setTimeout(function () {
                    refreshCommands()
                }, 3000);
            }

        };
        refreshCommands();
        var scrollDown = function () {
            $("#chat").animate({
                scrollTop: $('#chat')[0].scrollHeight
            }, 500, "linear",function () {
                lastScrollTop = $('#chat')[0].scrollTop;
            });
        };
        var refresh = function () {
            try {
                $.ajax({
                    url: restreamHostURL + "/messages.json" + (lastMessageId == "" ? "" : "?id=" + lastMessageId),
                    cache: false,
                    success: function (json) {
                        if (!(json instanceof Array))
                            json = JSON.parse(json);

                        if (!(json instanceof Array) ||
                            json.length <= 0) {
                            setTimeout(function () {
                                refresh();
                            }, interval);
                            return;
                        }

                        var transform = {
                            "tag": "div", class: "mc", "children": [
                            { "tag": "img", "src": "${ChatIconURL}", class: "i", "html": "" },
                            { "tag": "div", "html": "${Channel}", class: "c" },
                            { "tag": "div", "html": "${FromUserName}", class: "n" },
                            { "tag": "div", "html": "${TimeStamp}", class: "t" },
                            { "tag": "div", "html": "${Text}", class: "m" }]
                        };

                        for (var i = 0; i < json.length; i++) {
							if (json[i].Text.match(/^![a-z]/))
								continue;

							var text = json[i].Text;
                            text = text.replace(/https?<img src="https:\/\/www.livecoding.tv\/static\/candy-chat\/img\/emoticons_hd\/Uncertain\.png" alt=":\/" \/>/g, "http:/");
							if (escapeTags) {
								//text = encodeURIComponent(text);
								
								/*var tagsToReplace = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};
								function replaceTag(tag) { return tagsToReplace[tag] || tag; }
								function safe_tags_replace(str) { return str.replace(/[&<>]/g, replaceTag); }*/
								
								// textify links (without tag stuff)
								text = text.replace(/<a href="(.+?)"( title=".+?")?( target=".+?")?>(.+?)<\/a>/g, "$1");
								
								// don't use emoticon cache for beam
								text = text.replace(/<img src="\/chatemoticon\/cache\?ubx=([0-9]+)&uby=([0-9]+)&ubw=([0-9]+)&ubh=([0-9]+)&uburl=(.+?)".+?\/>/g,
									function(str, x, y, width, height, imageURL, extra) {
										width = parseInt(width) + 2;
										height = parseInt(height) + 2;
										return '<img src="/Resources/Transparent.png" style="background: url(' + decodeURIComponent(imageURL) + ') -' + x + 'px -' + y + 'px;" width="' + width + '" height="' + height + '"/>';
									}
								);
								
								// textify any tags that aren't emoji-img's
								//text = text.replace(/<(?!img src="(http:\/\/static-cdn.jtvnw.net\/|https:\/\/www.livecoding.tv\/|\/chatemoticon\/cache\?))/g, "&lt;");
								var allowedURLStarts = [
									"http://static-cdn.jtvnw.net/",
									"https://www.livecoding.tv/",
									"https://beam.pro/_latest/emoticons/",
									"http://edge.sf.hitbox.tv/static/img/chat/",
									"http://cdn.betterttv.net/emote/",
									"/Resources/"
								];
								text = text.replace(new RegExp("<(?!img src=\"(" + allowedURLStarts.join("|") + "))", "g"), "&lt;");
								text = text.replace(/onload/g, "on load").replace(/onerror/g, "on error");
							}
							json[i].Text = text;

							json[i].ChatIconURL = json[i].ChatIconURL.replace("/RestreamChat;component", "");
                            $('#chat').json2html(json[i], transform);
                            lastMessageId = json[i].Id;
                        }
                        applySettings();

                        messageInEffect();

                        var doScroll = $('#chat')[0].scrollTop >= lastScrollTop || getUrlParameter('obs') || getUrlParameter('timeout') > 0;

                        if (!doScroll)
                            $('#newmessagesticker').show();
                        else
                            $('#newmessagesticker').hide();

                        while ($('#chat > div').length > messageLimit)
                            $('#chat > div:first-child').remove();

                        if (doScroll) {
                            $('body').animate({
                                scrollTop: document.body.clientHeight
                            });

                            scrollDown();
                        }

                        setTimeout(function () {
                            refresh();
                        }, interval);
                    },
                    timeout: 59000,
                    error: function () {
                        setTimeout(function () {
                            refresh();
                        }, interval);
                    }

                });

            }
            catch (e) {
                setTimeout(function () {
                    refresh();
                }, interval);
            }

        };
        refresh();

        var refreshSettings = function () {
            try {

            $.ajax({
                url: restreamHostURL + "/settings.json" + (lastSettingsTimestamp == "" ? "" : "?id=" + lastSettingsTimestamp),
                cache: false,
                success: function (json) {
                    if (!(json instanceof Object))
                        json = JSON.parse(json);

                    lastSettingsTimestamp = json.id;

                    var themeName = json.config.ThemeName.toLowerCase();
                    config = json.config;

                    if (currentThemeName != themeName) {
                        $('#theme').attr('href', 'css/' + themeName + '.css');
                        currentThemeName = themeName;
                    }

                    applySettings();

                    setTimeout(function () {
                        refreshSettings();
                    }, interval);
                },
                timeout: 59000,
                error: function () {
                    setTimeout(function () {
                        refreshSettings();
                    }, interval)
                }
            })
            } catch (e) {
                setTimeout(function () {
                    refreshSettings();
                }, interval)
            }

            };

        refreshSettings();
    });
}
catch (e) {
}

function messageOutEffect( element )
{
    var el = element;
    if (messageTimeout == 0)
        return;

    var options = {};
    if ( outEffect === "scale" ) {
        options = { percent: 0 };
    } else if ( outEffect === "size" ) {
        options = { to: { width: el.width, height: el.height } };
    }

    var effect = outEffect;
    var nameParam = outEffect.split('-');
    if (nameParam.length > 1) {
        var direction = nameParam[1];
        options.direction = direction;
        effect = nameParam[0];
    }

    if (outEffect != undefined) {
        setTimeout(function () {
            el.hide(effect, options, 500, function () {
                $(this).remove();
            });
        }, messageTimeout);
    }
    else if (messageTimeout > 0)
    {
        setTimeout(function () {
            $(this).remove();
        });
    }

}
function messageInEffect( )
{
        $('#chat > div.mc:hidden').each(function () {
            var el = $(this);
            var options = {};
            if (inEffect == undefined) {
                el.show();
            }
            else {
                if (inEffect === "scale") {
                    options = { percent: 100 };
                } else if (inEffect === "size") {
                    options = { to: { width: el.width, height: el.height } };
                }
                var effect = inEffect;
                var nameParam = inEffect.split('-');
                if( nameParam.length > 1 )
                {
                    var direction = nameParam[1];
                    options.direction = direction;
                    effect = nameParam[0];
                }

                setTimeout(function () {
                    el.show(effect, options, 500, function () {
                        messageOutEffect($(this));
                    })
                }, 100);
            }
        });
}

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
function applySettings()
{
    if (config == undefined)
        return;
    $('.m').css("font-size", config.FontSizeMessage);
    $('.n').css("font-size", config.FontSizeNickName);
    $('.t').css("font-size", config.FontSizeTimestamp);
    $('.c').css("font-size", config.FontSizeChannel);

    $('.mc').css("background-color", "");
    //$('.m').css("background-color", "");


    var currentBgColor = changeColorOpacity($('.mc').css('background-color'), config.IndividualMessageBackgroundOpacity);
    //var currentMsgBgColor = changeColorOpacity($('.m').css('background-color'), config.IndividualMessageBackgroundOpacity);

    if (currentBgColor)
        $('.mc').css("background-color", currentBgColor);

    //if (currentMsgBgColor)
    //    $('.m').css("background-color", currentMsgBgColor);

    if (!config.ShowTimestamp)
        $('.t').hide();
    else
        $('.t').show();

    if (!config.ShowChannel)
        $('.c').hide();
    else
        $('.c').show();
}
function parseUrlOptions() {
    if (getUrlParameter('nobg')) {
        $('html, body').css('background-color', 'transparent', 'important');
    }
    if (getUrlParameter('bottom')) {
        $('#chat').addClass('stickbottom');
    }
    else
    {
        $('#chat').addClass('stickbottom');
        $('#chat').addClass('sticktop');
    }

    if (getUrlParameter('status')) {
        isCounterEnabled = true;
        $('.body.row').css('bottom', '30px');
        $('#footerbar').show();
    }
    else
    {
        isCounterEnabled = false;
        $('.body.row').css('bottom', '0px', 'important');
        $('#footerbar').hide();
    }
    if (getUrlParameter('timeout') != undefined)
        messageTimeout = getUrlParameter('timeout');

    if( getUrlParameter('ineffect'))
    {
		inEffect = getUrlParameter('ineffect');
    }
    if (getUrlParameter('limit'))
    {
        messageLimit = getUrlParameter('limit');
    }
    if( getUrlParameter('outeffect'))
    {
		outEffect = getUrlParameter('outeffect');
    }

}
function changeColorOpacity( color, opacity )
{
    if (!color )
        return color;

    if (opacity > 1)
        opacity = 1;

    if (opacity < 0)
        opacity = 0;

    opacity = Math.round(opacity * 100) / 100;

    if (color.indexOf('#') > 0)
    {

        var rgbaCol = 'rgba(' + parseInt(color.slice(-6, -4), 16)
        + ',' + parseInt(color.slice(-4, -2), 16)
        + ',' + parseInt(color.slice(-2), 16)
        + ',' + opacity + ')';
        return rgbaCol;
    }
    else {
        color = color.replace(/rgb\s*\(/, 'rgba(');
        color = color.replace(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d|\.]+)/, '$1,$2,$3,' + opacity + ')');
        color = color.replace(/\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/, '($1,$2,$3,' + opacity + ')');
        return color;
    }

    return color


}