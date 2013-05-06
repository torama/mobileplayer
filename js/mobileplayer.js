VideoPlayer = function() {
    this.videoElement       = false;
    this.container          = false;

    this.quality            = 1; // 1: poor quality, 2: good quality
    this.videoInitComplete  = false;

    this.link               = false;

    this.client             = false;
    this.nativePlayer       = false;
    this.progressTracker    = false;
    this.endImageElement    = false;
    this.endlinkElement     = false;

    this.progressBar = {
        progress            : false,
        container           : false
    };

    this.buttons = {
        play                : false,
        sound               : false,
        fullscreen          : false
    };

    this.controlbar         = false;
    this.fadeoutTimer       = false;

    this.codecs = {
        mp4                 : 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        ogg                 : 'video/ogg; codecs="theora, vorbis"',
        webm                : 'video/webm; codecs="vp8, vorbis"'
    };

    this.progress = {
        reached25           : false,
        reached50           : false,
        reached75           : false,
        reached100          : false,
        ended               : false
    };

    this.config = {
        stage               : 'production',
        container           : 'player',
        autoplay            : true,
        target              : 'http://www.web.de',
        
        playerAttributes    : {
            height          : 170,
            width           : 300,
            poster          : 'poster.jpg'
        },

        tracking            : false,
        sources             : false
    };

    this.init = function() {
        /* Overwrite base-config with videoPlayer Config */
        if (typeof window.videplayerConfig !== 'undefined') {
            for (var i in window.videplayerConfig) {
                if (i === 'playerAttributes') {
                    for (var j in window.videplayerConfig.playerAttributes) {
                        this.config.playerAttributes[j] = window.videplayerConfig.playerAttributes[j];
                    }
                }
                this.config[i] = window.videplayerConfig[i];
            }
        }

        if (document.getElementById('debug') <= 0) {
            this.stage = 'production';
        }


        this.videoElement = document.createElement('video');
        this.container    = document.getElementById(this.config.container);

        /* Muss noch überarbeitet werden 
        var bytes = document.documentElement.innerHTML.length;

        var diff = (window.performance.timing.domLoading - window.performance.timing.responseStart) /1000;
        var speed = (bytes / diff) / 1024 / 1024 * 8;
        speed = Math.round(speed*100)/100;

        if (speed >= 1) {
            this.log('Bandwidth greater or equal 1MB/s. Assuming good connection.');
            this.quality = 2;
        }*/
        this.initVideo();
        this.initControls();
    };
};

VideoPlayer.prototype.checkCompatibility = function() {
    /* Check if video-element is supported */
    if (typeof this.videoElement.canPlayType !== 'function') {
        this.log('No supported video/codec found.');
        return false;
    }

    /* Check if container exists */
    if (typeof this.container !== 'object') {
        this.log('Container #' + this.config.container + ' does not exist.');
        return false;
    }

    /* Check if supplied movies are supported */
    if (!this.detectCodec()) {
        this.log('No supported video/codec found.');
        return false;
    }
    return true;
};

VideoPlayer.prototype.isPlaying = function() {
    if (this.videoElement.currentTime > 0 && !this.videoElement.paused && !this.videoElement.ended) {
        return true;
    }
    return false;
};

VideoPlayer.prototype.checkClient = function() {
    if (/iphone/i.test(navigator.userAgent) || /ipod/i.test(navigator.userAgent)) {
        this.client = 'iphone';
        this.nativePlayer = true;
    }
    else if (/ipad/i.test(navigator.userAgent)) {
        this.client = 'ipad';
    }
    else if (/android/i.test(navigator.userAgent)) {
        this.client = 'android';
    }
    else if (/htc/i.test(navigator.userAgent)) {
        this.client = 'htc';
        this.nativePlayer = true;
    }
    else {
        this.client = 'desktop';
    }
    document.body.className += ' ' + this.client;
    this.log(this.client);
};

VideoPlayer.prototype.initControls = function() {
    this.controlbar = document.createElement('div');

    this.buttons.play = document.createElement('div');
    this.buttons.sound = document.createElement('div');
    this.buttons.fullscreen = document.createElement('div');

    this.progressBar.progress = document.createElement('div');
    this.progressBar.container = document.createElement('div');

    this.buttons.play.className = 'btn-48 btn-play';
    this.buttons.sound.className = 'btn-48 btn-mute';
    this.buttons.fullscreen.className = 'btn-48 btn-fullscreen';

    this.buttons.play.onclick = function(evt) {
        videoPlayer.togglePlay();
    };

    this.buttons.sound.onclick = function(evt) {
        videoPlayer.toggleSound();
    };

    this.buttons.fullscreen.onclick = function(evt) {
        videoPlayer.toggleFullscreen();
    };

    this.endLinkElement = document.createElement('a');
    this.endLinkElement.href = this.config.playerAttributes.endlink;
    this.endImageElement = document.createElement('img');
    this.endLinkElement.appendChild(this.endImageElement);
    this.endImageElement.src = this.config.playerAttributes.endposter;
    this.endImageElement.width = this.config.playerAttributes.width;
    this.endImageElement.height = this.config.playerAttributes.height;

    this.container.appendChild(this.endLinkElement);

    this.endLinkElement.style.display = 'none';

    this.endImageElement.className = 'endimage';

    if (!this.nativePlayer) {
        this.container.appendChild(this.controlbar);
    }

    this.controlbar.className = 'controls';
    this.controlbar.id = 'controlbar';

    this.controlbar.appendChild(this.buttons.play);
    this.controlbar.appendChild(this.buttons.sound);
    this.controlbar.appendChild(this.buttons.fullscreen);

    this.progressBar.container.className = 'progress-bar';
    this.progressBar.progress.className = 'progress';

    this.controlbar.appendChild(this.progressBar.container);
    this.progressBar.container.appendChild(this.progressBar.progress);

    this.container.onmousemove = function() {
        videoPlayer.manageControlFade();
    }

    this.container.click = function() {
        videoPlayer.manageControlFade();
        return false;
    }
};

VideoPlayer.prototype.manageControlFade = function() {
    window.clearTimeout(this.fadeoutTimer);
    document.getElementById('controlbar').style.display = 'block';
    this.fadeoutTimer = window.setTimeout(function() {
        if (!videoPlayer.videoElement.paused) {
            document.getElementById('controlbar').style.display = 'none';
        }
    }, 2000);
};

VideoPlayer.prototype.togglePlay = function() {
    if (this.isPlaying()) {
        this.pause();
        window.clearTimeout(this.fadeoutTimer);
        this.buttons.play.className = this.buttons.play.className.replace('pause', 'play');
    } else {
        this.buttons.play.className = this.buttons.play.className.replace('play', 'pause');
        this.play();
        this.fadeoutTimer = window.setTimeout(function() {
            document.getElementById('controlbar').style.display = 'none';
        }, 2000);
    }
};

VideoPlayer.prototype.toggleSound = function() {
    if (this.videoElement.muted) {
        this.videoElement.muted = false;
        this.buttons.sound.className = this.buttons.sound.className.replace('unmute', 'mute');
    } else {
        this.videoElement.muted = true;
        this.buttons.sound.className = this.buttons.sound.className.replace('mute', 'unmute');
    }
};

VideoPlayer.prototype.createUrl = function(url) {
    var link                = document.createElement('a');
    link.id                 = 'player_link_'+ this.starttime.getTime();
    link.href               = this.config.target;
    link.className          = 'videoplayerlink';
    link.target             = '_blank';
    this.link               = link;
    return link;
};

VideoPlayer.prototype.initVideo = function() {
    this.checkClient();
    if (!this.checkCompatibility() || this.videoInitComplete) { 
        return false;
    }
    this.videoInitComplete = true;
    this.log('Starting video with quality-level ' + this.quality);
    for (var i in this.config.playerAttributes) {
        if (i != 'width' && i != 'height') {
            this.videoElement.setAttribute(i, this.config.playerAttributes[i]);
        }
    }

    if (this.nativePlayer) {
        this.videoElement.setAttribute('controls', '');

        this.videoElement.addEventListener('playing', videoPlayer.iPhonePlaying);

        this.videoElement.addEventListener('pause', videoPlayer.iPhonePaused);

        this.videoElement.addEventListener('ended', videoPlayer.iPhoneEnded);
    }

    this.container.appendChild(this.videoElement);
    this.videoElement.onclick = function(e) {
        e.preventDefault();
    }

    this.container.style.width = this.config.playerAttributes.width + 'px';
    this.container.style.height = this.config.playerAttributes.height + 'px';

    for (var i in this.config.sources.good) {
        var sourceElement = document.createElement('source');
        sourceElement.setAttribute('src', this.config.sources.good[i]);
        if (this.quality < 2 && this.config.sources.poor) {
            if (this.config.sources.poor[i]) {
                sourceElement.setAttribute('src', this.config.sources.poor[i]);
            }
        }
        sourceElement.setAttribute('type', this.codecs[i]);

        this.videoElement.appendChild(sourceElement);
    }

    if (this.config.autoplay) {
        this.play();
    }
};

VideoPlayer.prototype.testBandwidth = function() {
    var request = new XMLHttpRequest();

    if (typeof request === 'object') {
        var start = new Date().getTime();
        request.open('GET', 'poster2.jpg?d=' + new Date().getTime(), true);
        request.send(null);
        request.timeout = 100;
        request.onreadystatechange = function(evt) {
            var xmlResponse = evt.target;
            if (xmlResponse.status == 200 && xmlResponse.readyState == 4) {
                var end = new Date().getTime();
                var bytes = xmlResponse.responseText.length;
                var diff = (end - start) / 1000;
                speed = (bytes / diff) / 1024 / 1024 * 8;
                speed = Math.round(speed*100)/100;
                if (speed >= 1) {
                    videoPlayer.log('Bandwidth greater or equal 1MB/s. Assuming good connection.');
                    videoPlayer.quality = 2;
                }
                videoPlayer.initVideo();
            };
            request.ontimeout = function() {
                videoPlayer.log('Timeout reached. Assuming poor connection.');
                videoPlayer.initVideo();
            };
        };
    } else {
        videoPlayer.log('Can\'t check bandwidth. Assuming poor connection.');
        videoPlayer.initVideo();
    }
};

VideoPlayer.prototype.toggleFullscreen = function() {
    if (this.client === 'desktop') {
        var isFullScreen = document.mozFullScreen || document.webkitIsFullScreen || document.fullscreen;
    } 
    else if (/android|iphone|ipod|ipad|htc/i.test(this.client)) {
        var isFullScreen = this.container.isFullScreen;
    }
    if (isFullScreen) {
        this.disableFullscreen();
        this.buttons.fullscreen.className = "btn-48 btn-fullscreen";
        document.body.className = document.body.className.replace(/fullscreen/, '');
    } else {
        this.log("request fullscreen");
        if (this.requestFullscreen()) {
            this.buttons.fullscreen.className = "btn-48 btn-exit-fullscreen";
            document.body.className += ' fullscreen';
        }
    }
};

VideoPlayer.prototype.requestFullscreen = function() {
    this.getMetaNode().setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    if (this.client === 'desktop') {
        if (this.container.mozRequestFullScreen) {
            this.container.mozRequestFullScreen();
            this.container.className += ' fullscreen';
            return true;
        } else if (this.container.webkitRequestFullscreen) {
            this.container.webkitRequestFullscreen();
            this.container.className += ' fullscreen';
            return true;
        } else if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
            this.container.className += ' fullscreen';
            return true;
        }
    } 
    else if (this.client === 'android') {
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.isFullScreen = true;
        return true;
    }
    return false;
};

VideoPlayer.prototype.disableFullscreen = function() {
    if (this.client === 'desktop') {
        if (this.container.mozRequestFullScreen) {
            document.mozCancelFullScreen();
            this.container.className = this.container.className.replace('fullscreen', '');
            return true;
        } else if (this.container.webkitRequestFullscreen) {
            this.container.className = this.container.className.replace('fullscreen', '');
            document.webkitCancelFullScreen();
            return true;
        } else if (this.container.requestFullscreen) {
            this.container.className = this.container.className.replace('fullscreen', '');
            document.exitFullScreen();
            return true;
        } 
    }
    else if (this.client === 'android') {
        this.getMetaNode().setAttribute('content', 'maximum-scale=auto, user-scalable=yes');
        this.log(this.getMetaNode().getAttribute('content'));
        this.container.style.position = 'relative';
        this.container.style.width = this.config.playerAttributes.width + 'px';
        this.container.style.height = this.config.playerAttributes.height + 'px';
        this.container.isFullScreen = false;
        return true;
    }

    return false;
};

VideoPlayer.prototype.getMetaNode = function() {
    var metaTags = document.head.getElementsByTagName('meta');
    var metaNode = false;
    for (var i=0, len = metaTags.length; i<len; i++) {
        if (metaTags[i].getAttribute('name') === 'viewport') {
            metaNode = metaTags[i];
        }
    }

    if (!metaNode) {
        metaNode = document.createElement('meta');
        metaNode.setAttribute('name', 'viewport');
        metaNode.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        document.head.appendChild(metaNode);
    }
    return metaNode;
};

VideoPlayer.prototype.mute = function() {
    this.videoElement.volume = 0;
};

VideoPlayer.prototype.soundOn = function() {
    this.videoElement.volume = 1;
};

VideoPlayer.prototype.play = function() {
    if (!this.nativePlayer) {
        this.endLinkElement.style.display = 'none';
        if (this.progress.ended) {
            this.progress.reached25 = false;
            this.progress.reached50 = false;
            this.progress.reached75 = false;
            this.progress.reached100 = false;
            this.progress.ended = false;
        }

        if (!this.progressTracker) {
            this.progressTracker = window.setInterval(function() {
                var progress = videoPlayer.videoElement.currentTime * 100 / videoPlayer.videoElement.duration;
                videoPlayer.progressBar.progress.style.width = progress + "%";
                if (progress >= 99.9 && !videoPlayer.progress.reached100) {
                    (new Image()).src = videoPlayer.config.tracking['100'].replace(/\{client\}/, videoPlayer.client);
                    videoPlayer.progress.reached100 = true;
                    videoPlayer.log('Reached 100%');
                    videoPlayer.progress.ended = true;
                    videoPlayer.disableFullscreen(); /* Geht nicht automatisch */
                    videoPlayer.buttons.play.className = videoPlayer.buttons.play.className.replace('pause', 'play');
                    videoPlayer.progressBar.progress.style.width = "0";
                    window.clearInterval(videoPlayer.progressTracker);
                    videoPlayer.applyEndlink();
                    videoPlayer.applyEndposter();
                    videoPlayer.progressTracker = false;
                } else if (progress >= 75 && !videoPlayer.progress.reached75) {
                    (new Image()).src = videoPlayer.config.tracking['75'].replace(/\{client\}/, videoPlayer.client);
                    videoPlayer.progress.reached75 = true;
                    videoPlayer.log('Reached 75%');
                } else if (progress >= 50 && !videoPlayer.progress.reached50) {
                    (new Image()).src = videoPlayer.config.tracking['50'].replace(/\{client\}/, videoPlayer.client);
                    videoPlayer.progress.reached50 = true;
                    videoPlayer.log('Reached 50%');
                } else if (progress >= 25 && !videoPlayer.progress.reached25) {
                    (new Image()).src = videoPlayer.config.tracking['25'].replace(/\{client\}/, videoPlayer.client);
                    videoPlayer.progress.reached25 = true;
                    videoPlayer.log('Reached 25%');
                }
            }, 100);
        }

        this.videoElement.play();
    }
};

VideoPlayer.prototype.iPhonePaused = function(e) {
    var progress = videoPlayer.videoElement.currentTime * 100 / videoPlayer.videoElement.duration;
    
    if (progress >= 75 && !videoPlayer.progress.reached75) {
        (new Image()).src = videoPlayer.config.tracking['75'].replace(/\{client\}/, videoPlayer.client);
        videoPlayer.progress.reached75 = true;
    } else if (progress >= 50 && !videoPlayer.progress.reached50) {
        (new Image()).src = videoPlayer.config.tracking['50'].replace(/\{client\}/, videoPlayer.client);
        videoPlayer.progress.reached50 = true;
    } else if (progress >= 25 && !videoPlayer.progress.reached25) {
        (new Image()).src = videoPlayer.config.tracking['25'].replace(/\{client\}/, videoPlayer.client);
        videoPlayer.progress.reached25 = true;
    }
};

VideoPlayer.prototype.iPhonePlaying = function(e) {
    (new Image()).src = videoPlayer.config.tracking['0'].replace(/\{client\}/, videoPlayer.client);
};

VideoPlayer.prototype.iPhoneEnded = function(e) {
    videoPlayer.progress.reached100 = true;
    (new Image()).src = videoPlayer.config.tracking['100'].replace(/\{client\}/, videoPlayer.client);
    videoPlayer.applyEndposter();
    videoPlayer.applyEndlink();
};

VideoPlayer.prototype.pause = function() {
    window.clearInterval(this.progressTracker);
    this.progressTracker = false;
    this.videoElement.pause();
};

VideoPlayer.prototype.applyEndlink = function() {
    this.log(this.endlink);
};

VideoPlayer.prototype.applyEndposter = function() {
    this.endLinkElement.style.display = 'block';
};

VideoPlayer.prototype.detectCodec = function() {
    if (!this.config.sources) {
        return false;
    }
    for (var i in this.codecs) {
        if (this.videoElement.canPlayType(this.codecs[i]) && this.config.sources.good[i]) {
            return true;
        }
    }
    return false;
};

VideoPlayer.prototype.log = function(message) {
    if (this.config.stage === 'development') {
        console.log(message);
        document.getElementById('debug').innerHTML += message + '<br />';
    }
};

var videoPlayer = new VideoPlayer();

window.onload = function() {
    videoPlayer.init();
};