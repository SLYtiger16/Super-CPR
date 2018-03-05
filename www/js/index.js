let app = {

  initialize: function () {
    $(document).on( 'deviceready', app.onDeviceReady );
  },

  onDeviceReady: function () {
    app.clock.start();

    app.nav('HomeScreen');

    app.settings.ret();

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

    app.admob();
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
      if(x == 1){
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
        ['OK','Cancel']
      );
    }
  },

  cpr: {
    sec: 0,
    min: 0,
    timerInt: null,

    start: function () {
      app.cpr.timer();
      app.cpr.timerInt = setInterval( function(){
        app.cpr.timer();
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

      app.cpr.audio();
      $( '#start' )
        .off( 'click' )
        .on( 'click', app.cpr.stop )
        .css( 'background-color', 'red' );
    },

    stop: function () {
      let a = $('audio#sound_'+app.settings.ret())[0];
      if ( typeof a.loop == 'boolean' ) {
        a.loop = false;
      }
      a.pause();
      a.currentTime = 0;
      app.cpr.sec = 0;
      app.cpr.min = 0;

      navigator.globalization.dateToString( new Date(), function ( date ) {
        app.log.change({Stop:date.value});
      }, function () {
        app.log.change({Stop:'Error Saving Time'});
      }, {
        formatLength: 'medium',
        selector: 'date and time'
      } );

      $( '#startBtn' ).text( "START" );
      $( '#timer' ).text("00:00");
      $( '#startedAt' ).text("---");
      $( '#start' )
        .off( 'click' )
        .on( 'click', app.cpr.start )
        .css( 'background-color', 'rgba(0,0,255,0.7)' );
      clearInterval( app.cpr.timerInt );
    },

    audio: function () {
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

    timer: function () {
      app.cpr.sec++;
      if ( app.cpr.sec === 60 ) {
        app.cpr.sec = 0;
        app.cpr.min++;
      }
      if ( app.cpr.min === 60 ) {
        app.cpr.min = 0;
      }
      app.cpr.min = ( String(app.cpr.min).length < 2 )
        ? "0" + app.cpr.min
        : "" + app.cpr.min;
      app.cpr.sec = ( String(app.cpr.sec).length < 2 )
        ? "0" + app.cpr.sec
        : "" + app.cpr.sec;
      $( '#timer' ).text( app.cpr.min + ":" + app.cpr.sec );
    },
  },

  clock: {
    clockInt: null,
    start: function () {
      let c = $( '#clock' );
      app.clock.clockInt = setInterval( function () {
        navigator.globalization.dateToString( new Date(), function ( date ) {
          c.text(date.value);
        }, function (e) {
          console.log(e)
          c.text('Error');
        }, {
          formatLength: 'short',
          selector: 'time'
        } );
      }, 1000 );
    },
  },

  log:{
    clear: function(x) {
      navigator.vibrate(1000);
      navigator.notification.confirm(
        'Clear entire log?',
         app.log.onChangeConfirm,
        'Are you sure?',
        ['OK','Cancel']
      );
    },

    onChangeConfirm: function(x) {
      console.log(x)
      if(x == 1){
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

  admob: function(){
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
        isTesting:false,
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
};
