let app = {
  timerInterval: null,
  clockInterval: null,

  initialize: function () {
    $(document).on( 'deviceready', app.onDeviceReady );
  },

  onDeviceReady: function () {
    app.clockStart();
    app.nav('HomeScreen');
    app.settings.ret();
    console.log( 'deviceready: ' + app.now() );
    $( '#cpr' ).height( $( 'main' ).height() - 240 );
    $( '#start' ).on( 'click', app.cpr.start );
    $('.sidebar-toggle').on('click', function(){
      app.sidebar('open');
    });
    $('.menuItem').on('click',function(){
      app.nav($(this).attr('target'));
      app.sidebar('close');
    });
    $('#menuImg').on('click',function(){
      app.sidebar('close');
    });
    $('.Screen').hammer().on("swiperight", function() {
      app.sidebar('open');
    });
    $('#overlay, #sidebar').hammer().on("swipeleft", function() {
      app.sidebar('close');
    });

    if (cordova.platformId == 'android') {
      StatusBar.backgroundColorByHexString("#333");
    }

    app.initAd();
    app.pushInit();
  },

  sidebar: function (x) {
    let s = $('.sidebar'),
      o = true;
    if(s.offset().left == "-250" && x === 'open'){
      s.css('left','0px');
    }else if(s.offset().left == "0" && x === 'close'){
      s.css('left','-250px');
    }else{
      o = false;
    }
    if (o){
      $('.overlay')
        .toggle()
        .off('click')
        .on('click', function(){
          app.sidebar('close');
        });
    }
  },

  nav: function(x){
    $('.Screen').each(function(i,e){
      if($(e).hasClass('active')){
        if($(e).attr('id') === x){
          return;
        }
        let w = $(e).width()+250;
        $(e).removeClass('active');
        $(e).hide("fast",function(){
          $('#' + x).show("fast");
        });
      }
    });

    $('#' + x).addClass('active');

    switch(x){
      case "HomeScreen":
        break;
      case "LogScreen":
        $('#logList').html(app.log.ret());
        $( '#logListCard' ).css( 'height', 'calc(100vh - 150px)');
        $( '#logList' ).height( $( '#logListCard' ).height() - 50 );
        $('#clearLog').off('click').on('click', function(){
          app.log.clear();
        });
        break;
      case "SettingsScreen":
        $('input#'+app.settings.ret()).attr("checked","checked");
        $('#soundRadio input').off('change').on('change', function(){
          app.settings.change($(this).attr("id"));
        });
        break;
      case "AboutScreen":
        break;
    }
  },

  ajax: function (x) {
    console.log( 'start AJAX' );
    $.ajax( {
      url: 'https://610ind.com/test/ajax.php',
      method: 'POST',
      dataType: 'json',
      data: {
        data: String(x)
      }
    }).done( function ( res ) {
      console.log( 'success AJAX' );
    }).fail( function ( res ) {
      console.log( res );
      console.log( 'fail AJAX' );
    });
  },

  settings: {
    last: (localStorage.getItem("sound") === null) ? "cowbell":localStorage.getItem("sound"),

    next: "",

    ret: function(){
      let s = localStorage.getItem("sound");
      if (s === null) {
        localStorage.setItem("sound","cowbell");
        s = "cowbell";
      }
      return s;
    },

    onChangeConfirm: function(x) {
      if(x === 2){
        app.cpr.stop();
        app.settings.last = app.settings.next;
        localStorage.setItem("sound",app.settings.next);
        app.settings.next = "";
      }else{
        $('input#'+app.settings.last).prop('checked','checked');
      }
    },

    change: function(x){
      navigator.vibrate(1000);
      app.settings.next = x;
      navigator.notification.confirm(
        'Change metronome sound to '+x+'?',
         app.settings.onChangeConfirm,
        'Are you sure?',
        ['No way!','Yes!']
      );
    }
  },

  now: function () {
    let x = new Date(),
      d = x.toLocaleDateString(),
      t = x.toLocaleTimeString();
    return d + " " + t;
  },

  cpr: {
    start: function () {
      app.timerFunc.start();
      app.play();
      $( '#start' )
        .off( 'click' )
        .on( 'click', app.cpr.stop )
        .css( 'background-color', 'red' );
    },

    stop: function () {
      app.timerFunc.stop();
      $( '#startBtn' ).text( "START" );
      $( '#timer' ).text("00:00");
      $( '#startedAt' ).text("---");
      $( '#start' )
        .off( 'click' )
        .on( 'click', app.cpr.start )
        .css( 'background-color', 'rgba(0,0,255,0.7)' );
      clearInterval( app.timerInterval );
    }
  },

  clockStart: function () {
    let c = $( '#clock' );
    app.clockInterval = setInterval( function () {
      navigator.globalization.dateToString( new Date(), function ( date ) {
        c.text(date.value);
      }, function () {
        c.text('Error');
      }, {
        formatLength: 'full',
        selector: 'time'
      } );
    }, 1000 );
  },

  play: function () {
    let a = $('audio#sound_'+app.settings.ret())[0];
    if ( typeof a.loop == 'boolean' ) {
      a.loop = true;
    } else {
      a.addEventListener( 'ended', function () {
        this.currentTime = 0;
        this.play();
      }, false );
    }
    a.play();
  },

  log:{
    clear: function(x) {
      navigator.vibrate(1000);
      navigator.notification.confirm(
        'Clear entire log?',
         app.log.onChangeConfirm,
        'Are you sure?',
        ['No way!','Yes!']
      );
    },

    onChangeConfirm: function(x) {
      if(x === 2){
        localStorage.setItem("log","[]");
        $('#logList').html(app.log.ret());
      }
    },

    change: function(x) {
      let log = (localStorage.getItem("log") === null) ? "[]":localStorage.getItem("log");
      let json = JSON.parse(log);
      try {
        json.unshift(x);
        if(json.length > 30){
          json = json.slice(0,29);
        }
        localStorage.setItem("log",JSON.stringify(json));
      }catch(e){
        console.log("Logging Error");
      }
    },

    ret: function(){
      let log = (localStorage.getItem("log") === null) ? "[]":localStorage.getItem("log");
      let json = JSON.parse(log);
      let html = "";
      for (var k in json){
        if (json.hasOwnProperty(k)) {
          for (var l in json[k]){
            if (json[k].hasOwnProperty(l)) {
              let type = (l === "Start") ? '#efe06e':'red';
              html += "<hr/><li style='color:"+type+";'>" + l + ": " + json[k][l] + "</li>";
            }
          }
        }
      }
      return html += "<hr/>";
    }
  },

  timerFunc: {
    sec: 0,
    min: 0,

    stop: function () {
      let a = $('audio#sound_'+app.settings.ret())[0];
      if ( typeof a.loop == 'boolean' ) {
        a.loop = false;
      }
      a.pause();
      a.currentTime = 0;
      app.timerFunc.sec = 0;
      app.timerFunc.min = 0;

      navigator.globalization.dateToString( new Date(), function ( date ) {
        app.log.change({Stop:date.value});
      }, function () {
        app.log.change({Stop:'Error Saving Time'});
      }, {
        formatLength: 'medium',
        selector: 'date and time'
      } );
    },

    timer: function () {
      app.timerFunc.sec++;
      if ( app.timerFunc.sec === 60 ) {
        app.timerFunc.sec = 0;
        app.timerFunc.min++;
      }
      if ( app.timerFunc.min === 60 ) {
        app.timerFunc.min = 0;
      }
      $( '#timer' ).text(app.timerFunc.normalize( app.timerFunc.min ) + ":" + app.timerFunc.normalize( app.timerFunc.sec ));
    },

    start: function () {
      app.timerFunc.timer();
      app.timerInterval = setInterval( function(){
        app.timerFunc.timer();
      }, 1000 );
      $( '#startBtn' ).text( "STOP" );

      navigator.globalization.dateToString( new Date(), function ( date ) {
        $( '#startedAt' ).text("Started at: " + date.value);
      }, function () {
        $( '#startedAt' ).text("Started at: ERROR");
      }, {
        formatLength: 'full',
        selector: 'time'
      } );

      navigator.globalization.dateToString( new Date(), function ( date ) {
        app.log.change({Start:date.value});
      }, function () {
        app.log.change({Start:'Error Saving Time'});
      }, {
        formatLength: 'medium',
        selector: 'date and time'
      } );
    },

    normalize: function ( x ) {
      return ( x < 10 )
        ? "0" + x
        : "" + x;
    }
  },

  initAd: function(){
    var admobid = {};
    if( /(android)/i.test(navigator.userAgent) ) {
      admobid = { // for Android
        banner: 'ca-app-pub-1667173736779668/1176510567'
      };
    } else if(/(ipod|iphone|ipad)/i.test(navigator.userAgent)) {
      admobid = { // for iOS
        banner: 'ca-app-pub-1667173736779668/4205998582'
      };
    }
    if(AdMob) {
      AdMob.createBanner( {
      	adId:admobid.banner,
      	overlap:true,
      	position:AdMob.AD_POSITION.BOTTOM_CENTER,
      	autoShow:true,
        isTesting:true,
        success: function(){
          console.log('ADMOB: banner created');
      	},
      	error: function(){
      		console.log('ADMOB: failed to create banner');
      	}
      } );
      document.addEventListener('onAdLoaded', function(){console.log('onAdLoaded')});
      document.addEventListener('onAdFailLoad', function(data){console.log('onAdFailLoad: ' + data.error)});
      document.addEventListener('onAdPresent', function(){console.log('onAdPresent')});
      document.addEventListener('onAdDismiss', function(){console.log('onAdDismiss')});
      document.addEventListener('onAdLeaveApp', function(){console.log('onAdLeaveApp')});
    }
  },

  push: null,
  pushInit: function() {
    app.push = PushNotification.init({
      android:{
        forceShow: true
      },
      ios:{
        alert: true,
        sound: true
      }
    });
    PushNotification.hasPermission((data) => {
      if (data.isEnabled) {
        console.log('Push is Enabled');
      }
    });
    // app.push.on('registration', (data) => {
    //   console.log("Reg ID: "+data.registrationId);
    //   console.log("Reg Type: "+data.registrationType);
    //   let oldRegId = localStorage.getItem('registrationId');
    //   if (oldRegId !== data.registrationId) {
    //     localStorage.setItem('registrationId', data.registrationId);
    //     app.ajax(data.registrationId);
    //     console.log("AJAX: PUSH ID SENT");
    //   }
    // });
    app.push.on('error', (e) => {
    	console.log("Push Error: "+e.message);
    });
  },



};
