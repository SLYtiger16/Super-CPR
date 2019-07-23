const BufferLoader = function(context, urlList, callback) {
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
        if (++loader.loadCount == loader.urlList.length) loader.onload(loader.bufferList);
      },
      function(error) {
        console.error("decodeAudioData error", error);
      }
    );
  };
  request.onerror = () => alert("BufferLoader: XHR error");
  request.send();
};

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i) this.loadBuffer(this.urlList[i], i);
};

let sounds = {
  100: {
    beep: null,
    click: null,
    floop: null,
    laser: null,
    metal: null,
    pew: null,
    zap: null
  },
  105: {
    beep: null,
    click: null,
    floop: null,
    laser: null,
    metal: null,
    pew: null,
    zap: null
  },
  110: {
    beep: null,
    click: null,
    floop: null,
    laser: null,
    metal: null,
    pew: null,
    zap: null
  },
  115: {
    beep: null,
    click: null,
    floop: null,
    laser: null,
    metal: null,
    pew: null,
    zap: null
  },
  120: {
    beep: null,
    click: null,
    floop: null,
    laser: null,
    metal: null,
    pew: null,
    zap: null
  }
};
let alert = null;
let bufferLoader = null;
let current_sound = null;
let metronome_running = false;
let cpr_audio_context = new (window.AudioContext || window.webkitAudioContext || window.audioContext)();

let get_cpr_sound = () => {
  let s = localStorage.getItem("sound");
  if (s === null || s === undefined) {
    localStorage.setItem("sound", "beep");
    s = "beep";
  }
  return s;
};

let get_cpr_speed = () => {
  let s = localStorage.getItem("speed");
  if (s === null || s === undefined) {
    localStorage.setItem("speed", "110");
    s = "110";
  }
  return s;
};

let get_duper_status = () => {
  let s = localStorage.getItem("duper");
  if (s === null || s === undefined) {
    localStorage.setItem("duper", "locked");
    s = "locked";
  }
  return s;
};

let purchaseDuper = () =>
  window.store
    .order(store.get("superdupercpr"))
    .then(storeRender)
    .error(error => console.log(error));

let storeRender = () => {
  let product = store.get("superdupercpr");
  if (!product) {
    $("#menu_duper")
      .html("")
      .off("click");
    $("#speedLi").html("");
  } else if (product.state === store.REGISTERED) {
    $("#menu_duper")
      .html("Loading...")
      .off("click");
    $("#speedLi").html("");
  } else if (product.state === store.INVALID) {
    $("#menu_duper")
      .html("")
      .off("click");
    $("#speedLi").html("");
  } else {
    $("#menu_duper")
      .html("<i class='small material-icons'>attach_money</i>Get Super-Duper CPR")
      .off("click")
      .on("click", () =>
        navigator.notification.confirm(
          "Purchase " + product.title + "?",
          purchaseDuper,
          "Description: " + product.description + "\r\n" + product.price,
          ["Yes", "No"]
        )
      );
    if (product.owned)
      $("#menu_duper")
        .html("<i class='small material-icons'>attach_money</i>Super-Duper CPR - owned")
        .off("click");
    $("#speedLi").html(
      '<label class="yellowText" style="font-size:15px;" for="speed">Metronome Speed <span style="font-size:10px;color:white;">(100-120):</span></label><p class="range-field"><input type="range" id="speed" min="100" max="120" step="5" /></p>'
    );
    $("#speed")
      .off("change")
      .on("change", event => {
        let i = $(event.currentTarget).attr("id");
        let v = $(event.currentTarget).val();
        localStorage.setItem(i, String(v));
        window.plugins.toast.showWithOptions({
          message: "Timer Settings Saved!",
          duration: "short",
          position: "center"
        });
      });
    localStorage.setItem("duper", "unlocked");
    if (product.canPurchase) {
      $("#menu_duper")
        .html("<i class='small material-icons'>attach_money</i>Get Super-Duper CPR")
        .off("click")
        .on("click", () =>
          navigator.notification.confirm(
            "Purchase " + product.title + "?",
            purchaseDuper,
            "Description: " + product.description + "\r\n" + product.price,
            ["Yes", "No"]
          )
        );
    } else {
      $("#speedLi").html("");
      $("#menu_duper")
        .html("")
        .off("click");
    }
  }
};

let initStore = () => {
  if (!window.store) return console.log("Store not available");
  store.register({
    id: "superdupercpr",
    alias: "Super Duper CPR",
    type: store.NON_CONSUMABLE
  });
  store.error(error => console.log("ERROR " + error.code + ": " + error.message));
  store.when("superdupercpr").updated(storeRender);
  store.refresh();
};

let soundInit = () => {
  bufferLoader = new BufferLoader(
    cpr_audio_context,
    [
      "sounds/alert.wav",

      "sounds/100/beep100.wav",
      "sounds/100/click100.wav",
      "sounds/100/floop100.wav",
      "sounds/100/laser100.wav",
      "sounds/100/metal100.wav",
      "sounds/100/pew100.wav",
      "sounds/100/zap100.wav",

      "sounds/105/beep105.wav",
      "sounds/105/click105.wav",
      "sounds/105/floop105.wav",
      "sounds/105/laser105.wav",
      "sounds/105/metal105.wav",
      "sounds/105/pew105.wav",
      "sounds/105/zap105.wav",

      "sounds/110/beep110.wav",
      "sounds/110/click110.wav",
      "sounds/110/floop110.wav",
      "sounds/110/laser110.wav",
      "sounds/110/metal110.wav",
      "sounds/110/pew110.wav",
      "sounds/110/zap110.wav",

      "sounds/115/beep115.wav",
      "sounds/115/click115.wav",
      "sounds/115/floop115.wav",
      "sounds/115/laser115.wav",
      "sounds/115/metal115.wav",
      "sounds/115/pew115.wav",
      "sounds/115/zap115.wav",

      "sounds/120/beep120.wav",
      "sounds/120/click120.wav",
      "sounds/120/floop120.wav",
      "sounds/120/laser120.wav",
      "sounds/120/metal120.wav",
      "sounds/120/pew120.wav",
      "sounds/120/zap120.wav"
    ],
    finishedLoading
  );
  bufferLoader.load();
};

let finishedLoading = bufferList => {
  alert = cpr_audio_context.createBufferSource();
  alert.buffer = bufferList[0];
  let index = 1;
  for (let speedSetting in sounds) {
    for (let file in sounds[speedSetting]) {
      sounds[speedSetting][file] = cpr_audio_context.createBufferSource();
      sounds[speedSetting][file].buffer = bufferList[index];
      index++;
    }
  }
};

let playSound = (buff, time) => {
  let source = cpr_audio_context.createBufferSource();
  source.buffer = buff.buffer;
  source.connect(cpr_audio_context.destination);
  source.loop = true;
  source.start(time);
  metronome_running = true;
  current_sound = source;
  console.log(source);
};

let playSoundOnce = (buff, time) => {
  let source = cpr_audio_context.createBufferSource();
  source.buffer = buff.buffer;
  source.connect(cpr_audio_context.destination);
  source.start(time);
};

let app = {
  initialize: () => $(document).on("deviceready", app.onDeviceReady),

  onDeviceReady: () => {
    app.admob();
    initStore();
    get_duper_status();
    soundInit();
    app.clock.start();
    $("#start").on("click", app.cpr.start);
    $("#drug").on("click", app.drug.start);
    $("#shock").on("click", app.shock.start);
    $(".sidebar-toggle").on("click", () => app.sidebar("open"));
    $(".menuItem:not(.ignore)").on("click", event => {
      navigator.vibrate(500);
      if ($(event.currentTarget).attr("target") === "rate") {
        window.open("market://details?id=com.sixten.superCPR", "_system");
      } else {
        app.nav($(event.currentTarget).attr("target"));
      }
      app.sidebar("close");
    });
    $("#soundSelect").material_select();
    $("#menuImg").on("click", () => app.sidebar("close"));
    $(".Screen")
      .hammer()
      .on("swiperight", () => app.sidebar("open"));
    $("#overlay, #sidebar")
      .hammer()
      .on("swipeleft", () => app.sidebar("close"));
    StatusBar.backgroundColorByName("black");
    StatusBar.styleBlackTranslucent();
    StatusBar.overlaysWebView(false);
  },

  audio: {
    cpr: {
      start: () => {
        let sound = get_cpr_sound();
        let speed = get_cpr_speed();
        console.log(speed, sound);
        playSound(sounds[speed][sound], cpr_audio_context.currentTime);
      },
      stop: () => {
        if (current_sound) current_sound.stop();
        metronome_running = false;
      }
    }
  },

  sidebar: x => {
    let s = $(".sidebar"),
      o = true;
    if (x == "open") {
      s.css("left", "0px");
    } else if (x == "close") {
      s.css("left", "-250px");
    } else {
      o = false;
    }
    if (o) {
      $(".overlay")
        .toggle()
        .off("click")
        .on("click", () => app.sidebar("close"));
    }
  },

  nav: x => {
    console.log(x);
    $(".Screen").each((i, e) => {
      if ($(e).hasClass("active")) {
        if ($(e).attr("id") === x) return;
        let w = $(e).width() + 250;
        $(e).removeClass("active");
        $(e).hide("fast", () => {
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
          .on("click", () => app.log.clear());
        $("#copyLog")
          .off("click")
          .on("click", () => window.plugins.socialsharing.share("Super CPR Log", app.log.retText()));
        break;
      case "SettingsScreen":
        $("#soundSelect option[value='" + get_cpr_sound() + "']").prop("selected", true);
        $("#soundSelect")
          .off("change")
          .on("change", () => app.settings.change($("#soundSelect option:selected").val()));
        $("#medMin").val(app.drug.ret());
        $("#shockMin").val(app.shock.ret());
        $("#speed").val(get_cpr_speed());
        $("#medMin, #shockMin, #speed")
          .off("change")
          .on("change", event => {
            let i = $(event.currentTarget).attr("id");
            let v = $(event.currentTarget).val();
            localStorage.setItem(i, String(v));
            window.plugins.toast.showWithOptions({
              message: "Timer Settings Saved!",
              duration: "short",
              position: "center"
            });
          });
        $("#soundSelect").material_select();
        break;
      case "AboutScreen":
        break;
    }
  },

  settings: {
    onChangeConfirm: x => {
      let running = metronome_running ? true : false;
      app.cpr.stop();
      localStorage.setItem("sound", x);
      window.plugins.toast.showWithOptions({
        message: "CPR Sound has been changed!",
        duration: "short",
        position: "top"
      });
      if (running) app.cpr.start();
    },

    change: x => {
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
          let speed = get_cpr_speed();
          playSoundOnce(sounds[speed][x], cpr_audio_context.currentTime);
        }
      }
    }
  },

  cpr: {
    sec: 0,
    min: 0,
    timerInt: null,

    start: () => {
      window.plugins.insomnia.keepAwake();
      navigator.vibrate(500);
      app.cpr.timerInt = setInterval(app.cpr.timer, 1000);
      $(".timerToggle").toggle();
      $("#startBtn").text("STOP");

      navigator.globalization.dateToString(
        new Date(),
        date => app.log.change({ Start: date.value }),
        () => app.log.change({ Start: "Error Saving Time" }),
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

    stop: () => {
      clearInterval(app.cpr.timerInt);
      app.cpr.timerInt = null;
      window.plugins.insomnia.allowSleepAgain();
      $(".timerToggle").toggle();
      app.audio.cpr.stop();
      app.cpr.sec = 0;
      app.cpr.min = 0;

      navigator.globalization.dateToString(
        new Date(),
        date => app.log.change({ Stop: date.value }),
        () => app.log.change({ Stop: "Error Saving Time" }),
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

      if ((app.drug.min !== 4 && app.drug.sec !== 0) || (app.shock.min !== 2 && app.shock.sec !== 0)) {
        navigator.vibrate(500);
        navigator.notification.confirm("Reset other timers?", app.cpr.onChangeConfirm, "Are you sure?", ["Yes", "No"]);
      }
    },

    onChangeConfirm: x => {
      if (x == 1) {
        app.drug.stop();
        app.shock.stop();
      }
    },

    timer: () => {
      app.cpr.sec++;
      if (app.cpr.sec === 60) {
        app.cpr.sec = 0;
        app.cpr.min++;
      }
      if (app.cpr.min === 60) {
        app.cpr.min = 0;
      }
      app.cpr.min = String(app.cpr.min).length < 2 ? "0" + app.cpr.min : "" + app.cpr.min;
      app.cpr.sec = String(app.cpr.sec).length < 2 ? "0" + app.cpr.sec : "" + app.cpr.sec;
      $("#timer").text(app.cpr.min + ":" + app.cpr.sec);
    }
  },

  drug: {
    min: 0,
    sec: 0,
    timer: null,
    ret: () => {
      let s = localStorage.getItem("medMin");
      if (s === null || s === undefined) {
        localStorage.setItem("medMin", "4");
        s = "4";
      }
      return s;
    },
    start: () => {
      app.drug.min =
        localStorage.getItem("medMin") === null || localStorage.getItem("medMin") === undefined
          ? 4
          : Number(localStorage.getItem("medMin"));
      navigator.vibrate(500);
      $("#drugLabel").text("MED: 0" + app.drug.min + ":0" + app.drug.sec);
      $("#drug").css("background-color", "rgba(255,150,50,0.4)");
      $("#drug")
        .off("click")
        .on("click", app.drug.stop);
      app.drug.timer = setInterval(() => {
        app.drug.sec--;
        if (app.drug.sec === -1) {
          app.drug.sec = 59;
          app.drug.min--;
        }
        app.drug.min = String(app.drug.min).length < 2 ? "0" + app.drug.min : "" + app.drug.min;
        app.drug.sec = String(app.drug.sec).length < 2 ? "0" + app.drug.sec : "" + app.drug.sec;
        $("#drugLabel").text("MED: " + app.drug.min + ":" + app.drug.sec);
        if (Number(app.drug.min) == 0 && Number(app.drug.sec) == 0) {
          app.drug.stop();
          window.plugins.toast.showWithOptions({
            message: "Medication Timer Is Up",
            duration: "short",
            position: "top"
          });
          playSoundOnce(alert, cpr_audio_context.currentTime);
        }
      }, 1000);

      navigator.globalization.dateToString(
        new Date(),
        date => app.log.change({ "Med given": date.value }),
        () => app.log.change({ "Med given": "Error Saving Time" }),
        {
          formatLength: "short",
          selector: "date and time"
        }
      );
    },
    stop: () => {
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
    ret: () => {
      let s = localStorage.getItem("shockMin");
      if (s === null || s === undefined) {
        localStorage.setItem("shockMin", "2");
        s = "2";
      }
      return s;
    },
    start: () => {
      app.shock.min =
        localStorage.getItem("shockMin") === null || localStorage.getItem("shockMin") === undefined
          ? 2
          : Number(localStorage.getItem("shockMin"));
      navigator.vibrate(500);
      $("#shockLabel").text("SHOCK: 0" + app.shock.min + ":0" + app.shock.sec);
      $("#shock").css("background-color", "rgba(255,150,50,0.4)");
      $("#shock")
        .off("click")
        .on("click", app.shock.stop);
      app.shock.timer = setInterval(() => {
        app.shock.sec--;
        if (app.shock.sec === -1) {
          app.shock.sec = 59;
          app.shock.min--;
        }
        app.shock.min = String(app.shock.min).length < 2 ? "0" + app.shock.min : "" + app.shock.min;
        app.shock.sec = String(app.shock.sec).length < 2 ? "0" + app.shock.sec : "" + app.shock.sec;
        $("#shockLabel").text("SHOCK: " + app.shock.min + ":" + app.shock.sec);
        if (Number(app.shock.min) == 0 && Number(app.shock.sec) == 0) {
          app.shock.stop();
          window.plugins.toast.showWithOptions({
            message: "Shock Timer Is Up",
            duration: "short",
            position: "top"
          });
          playSoundOnce(alert, cpr_audio_context.currentTime);
        }
      }, 1000);

      navigator.globalization.dateToString(
        new Date(),
        date => app.log.change({ "Shock delivered": date.value }),
        () => app.log.change({ "Shock delivered": "Error Saving Time" }),
        {
          formatLength: "short",
          selector: "date and time"
        }
      );
    },
    stop: () => {
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
    start: () => {
      let c = $("#clock");
      app.clock.clockInt = setInterval(function() {
        navigator.globalization.dateToString(new Date(), date => c.text(date.value), () => c.text("Error"), {
          formatLength: "short",
          selector: "time"
        });
      }, 1000);
    }
  },

  log: {
    clear: x => {
      navigator.vibrate(500);
      navigator.notification.confirm("Clear entire log?", app.log.onChangeConfirm, "Are you sure?", ["OK", "Cancel"]);
    },

    onChangeConfirm: x => {
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

    change: x => {
      let log =
        localStorage.getItem("log") === null || localStorage.getItem("log") === undefined ? "[]" : localStorage.getItem("log");
      let json = JSON.parse(log);
      json.unshift(x);
      if (json.length > 30) {
        json = json.slice(0, 29);
      }
      localStorage.setItem("log", JSON.stringify(json));
    },

    retText: () => {
      let log =
        localStorage.getItem("log") === null || localStorage.getItem("log") === undefined ? "[]" : localStorage.getItem("log");
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

    ret: () => {
      let log =
        localStorage.getItem("log") === null || localStorage.getItem("log") === undefined ? "[]" : localStorage.getItem("log");
      let json = JSON.parse(log);
      let html = "";
      for (var k in json) {
        if (json.hasOwnProperty(k)) {
          for (var l in json[k]) {
            if (json[k].hasOwnProperty(l)) {
              let type = l === "Start" ? "#efe06e" : l === "Stop" ? "red" : "white";
              html += "<hr/><li style='color:" + type + ";'>" + l + ": " + json[k][l] + "</li>";
            }
          }
        }
      }
      return (html += "<hr/>");
    }
  },

  admob: () => {
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
        isTesting: true,
        success: () => console.log("ADMOB: banner created"),
        error: error => console.log("ADMOB: failed to create banner: ", error)
      });
    } else {
      console.log("AdMob Not Loaded");
    }
  }
};
