let BufferLoader = function(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
};

BufferLoader.prototype.loadBuffer = function(url, index) {
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  var loader = this;
  request.onload = function() {
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert("error decoding file data: " + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error("decodeAudioData error", error);
      }
    );
  };
  request.onerror = function() {
    alert("BufferLoader: XHR error");
  };
  request.send();
};

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
    this.loadBuffer(this.urlList[i], i);
};

let beep = null;
let click = null;
let floop = null;
let laser = null;
let metal = null;
let pew_pew = null;
let zap = null;
let bufferLoader = null;
let current_sound = null;
let metronome_running = false;
let cpr_audio_context = new (window.AudioContext ||
  window.webkitAudioContext ||
  window.audioContext)();

let get_cpr_sound = function() {
  let s = localStorage.getItem("sound");
  if (s === null || s === undefined) {
    localStorage.setItem("sound", "beep");
    s = "beep";
  }
  return s;
};

let soundInit = function() {
  bufferLoader = new BufferLoader(
    cpr_audio_context,
    [
      "sounds/click522.wav",
      "sounds/beep522.wav",
      "sounds/floop522.wav",
      "sounds/laser522.wav",
      "sounds/metal522.wav",
      "sounds/pew_pew522.wav",
      "sounds/zap522.wav"
    ],
    finishedLoading
  );
  bufferLoader.load();
};

let finishedLoading = function(bufferList) {
  click = cpr_audio_context.createBufferSource();
  beep = cpr_audio_context.createBufferSource();
  floop = cpr_audio_context.createBufferSource();
  laser = cpr_audio_context.createBufferSource();
  metal = cpr_audio_context.createBufferSource();
  pew_pew = cpr_audio_context.createBufferSource();
  zap = cpr_audio_context.createBufferSource();
  click.buffer = bufferList[0];
  beep.buffer = bufferList[1];
  floop.buffer = bufferList[2];
  laser.buffer = bufferList[3];
  metal.buffer = bufferList[4];
  pew_pew.buffer = bufferList[5];
  zap.buffer = bufferList[6];
};

let playSound = function(buff, time) {
  let source = cpr_audio_context.createBufferSource();
  source.buffer = buff.buffer;
  source.connect(cpr_audio_context.destination);
  source.loop = true;
  source.start(time);
  metronome_running = true;
  current_sound = source;
};

let playSoundOnce = function(buff, time) {
  let source = cpr_audio_context.createBufferSource();
  source.buffer = buff.buffer;
  source.connect(cpr_audio_context.destination);
  source.start(time);
};

let app = {
  initialize: function() {
    $(document).on("deviceready", app.onDeviceReady);
  },

  onDeviceReady: function() {
    soundInit();
    app.clock.start();
    AppRate.preferences = {
      displayAppName: "Super CPR",
      usesUntilPrompt: 3,
      simpleMode: true,
      promptAgainForEachNewVersion: true,
      inAppReview: true,
      storeAppURL: {
        ios: "1355403048",
        android: "market://details?id=com.sixten.superCPR"
      },
      customLocale: {
        title: "Would you mind rating %@?",
        message:
          "It won’t take more than a minute and helps to promote our app. Thanks for your support!",
        cancelButtonLabel: "No, Thanks",
        laterButtonLabel: "Remind Me Later",
        rateButtonLabel: "Rate It Now",
        yesButtonLabel: "Yes!",
        noButtonLabel: "Not really",
        appRatePromptTitle: "Do you like using %@",
        feedbackPromptTitle: "Mind giving us some feedback?"
      },
      callbacks: {
        handleNegativeFeedback: function() {
          window.open("mailto:support@610ind.com.com", "_system");
        },
        onRateDialogShow: function(callback) {
          callback(1); // cause immediate click on 'Rate Now' button
        },
        onButtonClicked: function(buttonIndex) {
          if (buttonIndex == 2) {
            // 2 = remind me later - Clear the counter so app asks again later
            window.localStorage.removeItem("counter");
          }
        }
      }
    };
    AppRate.promptForRating(false);
    $("#start").on("click", app.cpr.start);
    $("#drug").on("click", app.drug.start);
    $("#shock").on("click", app.shock.start);
    $(".sidebar-toggle").on("click", function() {
      app.sidebar("open");
    });
    $("#menu_rate").on("click", function() {
      AppRate.promptForRating();
    });
    $(".menuItem").on("click", function() {
      app.nav($(this).attr("target"));
      app.sidebar("close");
    });
    $("#menuImg").on("click", function() {
      app.sidebar("close");
    });
    $(".Screen")
      .hammer()
      .on("swiperight", function() {
        app.sidebar("open");
      });
    $("#overlay, #sidebar")
      .hammer()
      .on("swipeleft", function() {
        app.sidebar("close");
      });
    StatusBar.backgroundColorByName("black");
    StatusBar.styleBlackTranslucent();
    StatusBar.overlaysWebView(false);
    app.admob();
  },

  audio: {
    cpr: {
      start: function() {
        let sound = get_cpr_sound();
        switch (sound) {
          case "click":
            playSound(click, cpr_audio_context.currentTime);
            break;
          case "floop":
            playSound(floop, cpr_audio_context.currentTime);
            break;
          case "laser":
            playSound(laser, cpr_audio_context.currentTime);
            break;
          case "metal":
            playSound(metal, cpr_audio_context.currentTime);
            break;
          case "pew_pew":
            playSound(pew_pew, cpr_audio_context.currentTime);
            break;
          case "zap":
            playSound(zap, cpr_audio_context.currentTime);
            break;
          case "beep":
            playSound(beep, cpr_audio_context.currentTime);
            break;
          default:
            playSound(beep, cpr_audio_context.currentTime);
        }
      },
      stop: function() {
        if (current_sound) current_sound.stop();
        metronome_running = false;
      }
    }
  },

  sidebar: function(x) {
    let s = $(".sidebar"),
      o = true;
    if (s.offset().left == "-250" && x === "open") {
      s.css("left", "0px");
    } else if (s.offset().left == "0" && x === "close") {
      s.css("left", "-250px");
    } else {
      o = false;
    }
    if (o) {
      $(".overlay")
        .toggle()
        .off("click")
        .on("click", function() {
          app.sidebar("close");
        });
    }
  },

  nav: function(x) {
    $(".Screen").each(function(i, e) {
      if ($(e).hasClass("active")) {
        if ($(e).attr("id") === x) {
          return;
        }
        let w = $(e).width() + 250;
        $(e).removeClass("active");
        $(e).hide("fast", function() {
          $("#" + x).show("fast");
          $("#" + x).css("display", "flex");
        });
      }
    });

    $("#" + x).addClass("active");

    switch (x) {
      case "HomeScreen":
        break;
      case "LogScreen":
        $("#logList").html(app.log.ret());
        $("#logListCard").css("height", "calc(100vh - 150px)");
        $("#logList").height($("#logListCard").height() - 50);
        $("#clearLog")
          .off("click")
          .on("click", function() {
            app.log.clear();
          });
        $("#copyLog")
          .off("click")
          .on("click", function() {
            cordova.plugins.clipboard.copy(app.log.retText());
            window.plugins.toast.showWithOptions({
              message: "Log Data Copied to Clipboard!",
              duration: "short",
              position: "center"
            });
          });
        break;
      case "SettingsScreen":
        $("input#" + get_cpr_sound()).attr("checked", "checked");
        $("#soundRadio input")
          .off("change")
          .on("change", function() {
            app.settings.change($(this).attr("id"));
          });
        $("#medMin").val(Number(app.drug.ret()));
        $("#shockMin").val(Number(app.shock.ret()));
        $("#medMin, #shockMin")
          .off("change")
          .on("change", function() {
            let i = $(this).attr("id");
            let v = $(this).val();
            if (v > 0 && v < 6) {
              localStorage.setItem(i, String(v));
              window.plugins.toast.showWithOptions({
                message: "Timer Settings Saved!",
                duration: "short",
                position: "center"
              });
            } else {
              window.plugins.toast.showWithOptions({
                message: "Invalid number of minutes!, Try again. Must be 1-5!",
                duration: "short",
                position: "center"
              });
              if (i === "medMin") {
                $(this).val(4);
                v = 4;
              } else {
                $(this).val(2);
                v = 2;
              }
              localStorage.setItem(i, String(v));
            }
          });
        break;
      case "AboutScreen":
        break;
    }
  },

  settings: {
    onChangeConfirm: function(x) {
      let running = metronome_running ? true : false;
      app.cpr.stop();
      localStorage.setItem("sound", x);
      $("input#" + x).prop("checked", "checked");
      window.plugins.toast.showWithOptions({
        message: "CPR Sound has been changed!",
        duration: "short",
        position: "top"
      });
      if (running) app.cpr.start();
    },

    change: function(x) {
      navigator.vibrate(500);
      let sound = get_cpr_sound();
      if (x == sound) {
        window.plugins.toast.showWithOptions({
          message: "You gotta pick a different one bud!",
          duration: "short",
          position: "top"
        });
      } else {
        app.settings.onChangeConfirm(x);
        if (!metronome_running) {
          switch (x) {
            case "click":
              playSoundOnce(click, cpr_audio_context.currentTime);
              break;
            case "floop":
              playSoundOnce(floop, cpr_audio_context.currentTime);
              break;
            case "laser":
              playSoundOnce(laser, cpr_audio_context.currentTime);
              break;
            case "metal":
              playSoundOnce(metal, cpr_audio_context.currentTime);
              break;
            case "pew_pew":
              playSoundOnce(pew_pew, cpr_audio_context.currentTime);
              break;
            case "zap":
              playSoundOnce(zap, cpr_audio_context.currentTime);
              break;
            case "beep":
              playSoundOnce(beep, cpr_audio_context.currentTime);
              break;
            default:
              playSoundOnce(beep, cpr_audio_context.currentTime);
          }
        }
      }
    }
  },

  cpr: {
    sec: 0,
    min: 0,
    timerInt: null,

    start: function() {
      window.plugins.insomnia.keepAwake();
      navigator.vibrate(500);
      app.cpr.timerInt = setInterval(function() {
        app.cpr.timer();
      }, 1000);
      $(".timerToggle").toggle();
      $("#startBtn").text("STOP");

      navigator.globalization.dateToString(
        new Date(),
        function(date) {
          app.log.change({ Start: date.value });
        },
        function() {
          app.log.change({ Start: "Error Saving Time" });
        },
        {
          formatLength: "short",
          selector: "date and time"
        }
      );

      app.audio.cpr.start();
      $("#start")
        .off("click")
        .on("click", app.cpr.stop)
        .css("background-color", "red");
      window.plugins.toast.showWithOptions({
        message: "Start Compressions!",
        duration: "short",
        position: "top"
      });
    },

    stop: function() {
      clearInterval(app.cpr.timerInt);
      app.cpr.timerInt = null;
      window.plugins.insomnia.allowSleepAgain();
      $(".timerToggle").toggle();
      app.audio.cpr.stop();
      app.cpr.sec = 0;
      app.cpr.min = 0;

      navigator.globalization.dateToString(
        new Date(),
        function(date) {
          app.log.change({ Stop: date.value });
        },
        function() {
          app.log.change({ Stop: "Error Saving Time" });
        },
        {
          formatLength: "short",
          selector: "date and time"
        }
      );

      $("#startBtn").text("START");
      $("#timer").text("00:00");
      $("#start")
        .off("click")
        .on("click", app.cpr.start)
        .css("background-color", "rgba(0,0,255,0.7)");

      if (
        (app.drug.min !== 4 && app.drug.sec !== 0) ||
        (app.shock.min !== 2 && app.shock.sec !== 0)
      ) {
        navigator.vibrate(500);
        navigator.notification.confirm(
          "Reset other timers?",
          app.cpr.onChangeConfirm,
          "Are you sure?",
          ["Yes", "No"]
        );
      }
    },

    onChangeConfirm: function(x) {
      if (x == 1) {
        app.drug.stop();
        app.shock.stop();
      }
    },

    timer: function() {
      app.cpr.sec++;
      if (app.cpr.sec === 60) {
        app.cpr.sec = 0;
        app.cpr.min++;
      }
      if (app.cpr.min === 60) {
        app.cpr.min = 0;
      }
      app.cpr.min =
        String(app.cpr.min).length < 2 ? "0" + app.cpr.min : "" + app.cpr.min;
      app.cpr.sec =
        String(app.cpr.sec).length < 2 ? "0" + app.cpr.sec : "" + app.cpr.sec;
      $("#timer").text(app.cpr.min + ":" + app.cpr.sec);
    }
  },

  drug: {
    min: 0,
    sec: 0,
    timer: null,
    ret: function() {
      let s = localStorage.getItem("medMin");
      if (s === null || s === undefined) {
        localStorage.setItem("medMin", "4");
        s = "4";
      }
      return s;
    },
    start: function() {
      app.drug.min =
        localStorage.getItem("medMin") === null ||
        localStorage.getItem("medMin") === undefined
          ? 4
          : Number(localStorage.getItem("medMin"));
      navigator.vibrate(500);
      $("#drugLabel").text("MED: 0" + app.drug.min + ":0" + app.drug.sec);
      $("#drug").css("background-color", "rgba(255,150,50,0.4)");
      $("#drug")
        .off("click")
        .on("click", app.drug.stop);
      app.drug.timer = setInterval(function() {
        app.drug.sec--;
        if (app.drug.sec === -1) {
          app.drug.sec = 59;
          app.drug.min--;
        }
        app.drug.min =
          String(app.drug.min).length < 2
            ? "0" + app.drug.min
            : "" + app.drug.min;
        app.drug.sec =
          String(app.drug.sec).length < 2
            ? "0" + app.drug.sec
            : "" + app.drug.sec;
        $("#drugLabel").text("MED: " + app.drug.min + ":" + app.drug.sec);
        if (Number(app.drug.min) == 0 && Number(app.drug.sec) == 0) {
          app.drug.stop();
          window.plugins.toast.showWithOptions({
            message: "Medication Timer Is Up",
            duration: "short",
            position: "top"
          });
          let drugAudioCtx = new (window.AudioContext ||
            window.webkitAudioContext ||
            window.audioContext)();
          let beep = function() {
            var oscillator = drugAudioCtx.createOscillator();
            var gainNode = drugAudioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(drugAudioCtx.destination);
            oscillator.frequency.value = 700;
            oscillator.start();
            setTimeout(function() {
              oscillator.stop();
            }, 1500);
          };
          beep();
        }
      }, 1000);

      navigator.globalization.dateToString(
        new Date(),
        function(date) {
          app.log.change({ "Med given": date.value });
        },
        function() {
          app.log.change({ "Med given": "Error Saving Time" });
        },
        {
          formatLength: "short",
          selector: "date and time"
        }
      );
    },
    stop: function() {
      navigator.vibrate(500);
      clearInterval(app.drug.timer);
      $("#drugLabel").text("MED");
      $("#drug").css("background-color", "rgba(0,100,255,0.4)");
      $("#drug")
        .off("click")
        .on("click", app.drug.start);
      app.drug.min = 4;
      app.drug.sec = 0;
    }
  },

  shock: {
    min: 0,
    sec: 0,
    timer: null,
    ret: function() {
      let s = localStorage.getItem("shockMin");
      if (s === null || s === undefined) {
        localStorage.setItem("shockMin", "2");
        s = "2";
      }
      return s;
    },
    start: function() {
      app.shock.min =
        localStorage.getItem("shockMin") === null ||
        localStorage.getItem("shockMin") === undefined
          ? 2
          : Number(localStorage.getItem("shockMin"));
      navigator.vibrate(500);
      $("#shockLabel").text("SHOCK: 0" + app.shock.min + ":0" + app.shock.sec);
      $("#shock").css("background-color", "rgba(255,150,50,0.4)");
      $("#shock")
        .off("click")
        .on("click", app.shock.stop);
      app.shock.timer = setInterval(function() {
        app.shock.sec--;
        if (app.shock.sec === -1) {
          app.shock.sec = 59;
          app.shock.min--;
        }
        app.shock.min =
          String(app.shock.min).length < 2
            ? "0" + app.shock.min
            : "" + app.shock.min;
        app.shock.sec =
          String(app.shock.sec).length < 2
            ? "0" + app.shock.sec
            : "" + app.shock.sec;
        $("#shockLabel").text("SHOCK: " + app.shock.min + ":" + app.shock.sec);
        if (Number(app.shock.min) == 0 && Number(app.shock.sec) == 0) {
          app.shock.stop();
          let medAudioCtx = new (window.AudioContext ||
            window.webkitAudioContext ||
            window.audioContext)();
          let beep = function() {
            var oscillator = medAudioCtx.createOscillator();
            var gainNode = medAudioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(medAudioCtx.destination);
            oscillator.frequency.value = 700;
            oscillator.start();
            setTimeout(function() {
              oscillator.stop();
            }, 1500);
          };
          beep();
        }
      }, 1000);

      navigator.globalization.dateToString(
        new Date(),
        function(date) {
          app.log.change({ "Shock delivered": date.value });
        },
        function() {
          app.log.change({ "Shock delivered": "Error Saving Time" });
        },
        {
          formatLength: "short",
          selector: "date and time"
        }
      );
    },
    stop: function() {
      navigator.vibrate(500);
      clearInterval(app.shock.timer);
      $("#shockLabel").text("SHOCK");
      $("#shock").css("background-color", "rgba(0,100,255,0.4)");
      $("#shock")
        .off("click")
        .on("click", app.shock.start);
      app.shock.min = 4;
      app.shock.sec = 0;
      window.plugins.toast.showWithOptions({
        message: "Shock Timer Is Up",
        duration: "short",
        position: "top"
      });
    }
  },

  clock: {
    clockInt: null,
    start: function() {
      let c = $("#clock");
      app.clock.clockInt = setInterval(function() {
        navigator.globalization.dateToString(
          new Date(),
          function(date) {
            c.text(date.value);
          },
          function(e) {
            c.text("Error");
          },
          {
            formatLength: "short",
            selector: "time"
          }
        );
      }, 1000);
    }
  },

  log: {
    clear: function(x) {
      navigator.vibrate(500);
      navigator.notification.confirm(
        "Clear entire log?",
        app.log.onChangeConfirm,
        "Are you sure?",
        ["OK", "Cancel"]
      );
    },

    onChangeConfirm: function(x) {
      if (x == 1) {
        localStorage.setItem("log", "[]");
        $("#logList").html(app.log.ret());
        window.plugins.toast.showWithOptions({
          message: "Log Data Cleared!",
          duration: "short",
          position: "center"
        });
      }
    },

    change: function(x) {
      let log =
        localStorage.getItem("log") === null ||
        localStorage.getItem("log") === undefined
          ? "[]"
          : localStorage.getItem("log");
      let json = JSON.parse(log);
      json.unshift(x);
      if (json.length > 30) {
        json = json.slice(0, 29);
      }
      localStorage.setItem("log", JSON.stringify(json));
    },

    retText: function() {
      let log =
        localStorage.getItem("log") === null ||
        localStorage.getItem("log") === undefined
          ? "[]"
          : localStorage.getItem("log");
      let json = JSON.parse(log);
      let text = "";
      for (var k in json) {
        if (json.hasOwnProperty(k)) {
          for (var l in json[k]) {
            if (json[k].hasOwnProperty(l)) {
              text += l.toLocaleUpperCase() + ": " + json[k][l] + "\r\n";
            }
          }
        }
      }
      return text;
    },

    ret: function() {
      let log =
        localStorage.getItem("log") === null ||
        localStorage.getItem("log") === undefined
          ? "[]"
          : localStorage.getItem("log");
      let json = JSON.parse(log);
      let html = "";
      for (var k in json) {
        if (json.hasOwnProperty(k)) {
          for (var l in json[k]) {
            if (json[k].hasOwnProperty(l)) {
              let type =
                l === "Start" ? "#efe06e" : l === "Stop" ? "red" : "white";
              html +=
                "<hr/><li style='color:" +
                type +
                ";'>" +
                l +
                ": " +
                json[k][l] +
                "</li>";
            }
          }
        }
      }
      return (html += "<hr/>");
    }
  },

  admob: function() {
    var admobid = {};
    if (/(android)/i.test(navigator.userAgent)) {
      admobid = {
        banner: "ca-app-pub-1667173736779668/1176510567"
      };
    } else if (/(ipod|iphone|ipad)/i.test(navigator.userAgent)) {
      admobid = {
        banner: "ca-app-pub-1667173736779668/4205998582"
      };
    }
    if (AdMob) {
      AdMob.createBanner({
        adId: admobid.banner,
        overlap: true,
        position: AdMob.AD_POSITION.BOTTOM_CENTER,
        autoShow: true,
        isTesting: false,
        success: function() {
          console.log("ADMOB: banner created");
        },
        error: function() {
          console.log("ADMOB: failed to create banner");
        }
      });
    } else {
      console.log("AdMob Not Loaded");
    }
  }
};
