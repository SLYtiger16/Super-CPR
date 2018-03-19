let app = {

  initialize: function () {
    $(document).on( 'deviceready', app.onDeviceReady );
  },

  onDeviceReady: function () {
    app.clock.start();

    app.settings.ret();
    $( '#start' ).on( 'click', app.cpr.start );
    $( '#drug' ).on( 'click', app.drug.start );
    $( '#shock' ).on( 'click', app.shock.start );
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
    StatusBar.backgroundColorByName("black");
    StatusBar.styleBlackTranslucent();
    StatusBar.overlaysWebView(false);

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
          $('#' + x).css('display','flex');
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
        $('#medMin').val(Number(app.drug.ret()));
        $('#shockMin').val(Number(app.shock.ret()));
        $('#medMin, #shockMin').off('change').on('change', function(){
          let i = $(this).attr('id');
          let v = $(this).val();
          if(v > 0 && v < 6){
            localStorage.setItem(i,String(v));
          }else{
            alert('Invalid number of minutes!, Try again. Must be 1-5!');
            if (i === "medMin") {
              $(this).val(4);
              v = 4;
            }else{
              $(this).val(2);
              v = 2;
            }
            localStorage.setItem(i,String(v));
          }
        })
        break;
      case "AboutScreen":
        break;
    }
  },

  settings: {
    last: (localStorage.getItem("sound") === null || localStorage.getItem("sound") === undefined) ? "cowbell":localStorage.getItem("sound"),

    next: "",

    ret: function(){
      let s = localStorage.getItem("sound");
      if (s === null || s === undefined) {
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
      navigator.vibrate(500);
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
      window.plugins.insomnia.keepAwake();
      navigator.vibrate(500);
      app.cpr.timerInt = setInterval( function(){
        app.cpr.timer();
      }, 1000 );
      $('.timerToggle').toggle();
      $( '#startBtn' ).text( "STOP" );

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
      window.plugins.insomnia.allowSleepAgain();
      $('.timerToggle').toggle();
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
      $( '#start' )
        .off( 'click' )
        .on( 'click', app.cpr.start )
        .css( 'background-color', 'rgba(0,0,255,0.7)' );
      clearInterval( app.cpr.timerInt );

      if (app.drug.min !== 4 && app.drug.sec !== 0 || app.shock.min !== 2 && app.shock.sec !== 0){
        navigator.vibrate(500);
        navigator.notification.confirm(
          'Reset other timers?',
           app.cpr.onChangeConfirm,
          'Are you sure?',
          ['Yes','No']
        );
      }
    },

    onChangeConfirm: function(x) {
      if(x == 1){
        app.drug.stop();
        app.shock.stop();
      }
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

  drug:{
    min: 0,
    sec: 0,
    timer: null,
    ret: function(){
      let s = localStorage.getItem("medMin");
      if (s === null || s === undefined) {
        localStorage.setItem("medMin","4");
        s = "4";
      }
      return s;
    },
    start: function(){
      app.drug.min = (localStorage.getItem("medMin") === null || localStorage.getItem("medMin") === undefined)? 4:Number(localStorage.getItem("medMin"));
      navigator.vibrate(500);
      $( '#drugLabel' ).text( "MED: 0" + app.drug.min + ":0" + app.drug.sec );
      $('#drug').css('background-color','rgba(255,150,50,0.4)');
      $('#drug').off('click').on('click', app.drug.stop);
      app.drug.timer = setInterval(function(){
        app.drug.sec--;
        if ( app.drug.sec === -1 ) {
          app.drug.sec = 59;
          app.drug.min--;
        }
        app.drug.min = ( String(app.drug.min).length < 2 )
          ? "0" + app.drug.min
          : "" + app.drug.min;
        app.drug.sec = ( String(app.drug.sec).length < 2 )
          ? "0" + app.drug.sec
          : "" + app.drug.sec;
        $( '#drugLabel' ).text( "MED: " + app.drug.min + ":" + app.drug.sec );
        if ( Number(app.drug.min) == 0 && Number(app.drug.sec) == 0 ) {
          app.drug.alert();
          app.drug.stop();
        }
      },1000);

      navigator.globalization.dateToString( new Date(), function ( date ) {
        app.log.change({"Med given":date.value});
      }, function () {
        app.log.change({"Med given":'Error Saving Time'});
      }, {
        formatLength: 'medium',
        selector: 'date and time'
      } );
    },
    stop: function(){
      navigator.vibrate(500);
      clearInterval(app.drug.timer);
      $( '#drugLabel' ).text( "MED" );
      $('#drug').css('background-color','rgba(0,100,255,0.4)');
      $('#drug').off('click').on('click', app.drug.start);
      app.drug.min = 4;
      app.drug.sec = 0;
    },
    alert:function(){
      let a = $('audio#sound_ting')[0];
      a.play();
    }
  },

  shock:{
    min: 0,
    sec: 0,
    timer: null,
    ret: function(){
      let s = localStorage.getItem("shockMin");
      if (s === null || s === undefined) {
        localStorage.setItem("shockMin","2");
        s = "2";
      }
      return s;
    },
    start: function(){
      app.shock.min = (localStorage.getItem("shockMin") === null || localStorage.getItem("shockMin") === undefined)? 2:Number(localStorage.getItem("shockMin"));
      navigator.vibrate(500);
      $( '#shockLabel' ).text( "SHOCK: 0" + app.shock.min + ":0" + app.shock.sec );
      $('#shock').css('background-color','rgba(255,150,50,0.4)');
      $('#shock').off('click').on('click', app.shock.stop);
      app.shock.timer = setInterval(function(){
        app.shock.sec--;
        if ( app.shock.sec === -1 ) {
          app.shock.sec = 59;
          app.shock.min--;
        }
        app.shock.min = ( String(app.shock.min).length < 2 )
          ? "0" + app.shock.min
          : "" + app.shock.min;
        app.shock.sec = ( String(app.shock.sec).length < 2 )
          ? "0" + app.shock.sec
          : "" + app.shock.sec;
        $( '#shockLabel' ).text( "SHOCK: " + app.shock.min + ":" + app.shock.sec );
        if ( Number(app.shock.min) == 0 && Number(app.shock.sec) == 0 ) {
          app.shock.alert();
          app.shock.stop();
        }
      },1000);

      navigator.globalization.dateToString( new Date(), function ( date ) {
        app.log.change({"Shock delivered":date.value});
      }, function () {
        app.log.change({"Shock delivered":'Error Saving Time'});
      }, {
        formatLength: 'medium',
        selector: 'date and time'
      } );
    },
    stop: function(){
      navigator.vibrate(500);
      clearInterval(app.shock.timer);
      $( '#shockLabel' ).text( "SHOCK" );
      $('#shock').css('background-color','rgba(0,100,255,0.4)');
      $('#shock').off('click').on('click', app.shock.start);
      app.shock.min = 4;
      app.shock.sec = 0;
    },
    alert:function(){
      let a = $('audio#sound_ting')[0];
      a.play();
    }
  },

  clock: {
    clockInt: null,
    start: function () {
      let c = $( '#clock' );
      app.clock.clockInt = setInterval( function () {
        navigator.globalization.dateToString( new Date(), function ( date ) {
          c.text(date.value);
        }, function (e) {
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
      navigator.vibrate(500);
      navigator.notification.confirm(
        'Clear entire log?',
         app.log.onChangeConfirm,
        'Are you sure?',
        ['OK','Cancel']
      );
    },

    onChangeConfirm: function(x) {
      if(x == 1){
        localStorage.setItem("log","[]");
        $('#logList').html(app.log.ret());
      }
    },

    change: function(x) {
      let log = (localStorage.getItem("log") === null || localStorage.getItem("log") === undefined) ? "[]":localStorage.getItem("log");
      let json = JSON.parse(log);
      json.unshift(x);
      if(json.length > 30){
        json = json.slice(0,29);
      }
      localStorage.setItem("log",JSON.stringify(json));
    },

    ret: function(){
      let log = (localStorage.getItem("log") === null || localStorage.getItem("log") === undefined) ? "[]":localStorage.getItem("log");
      let json = JSON.parse(log);
      let html = "";
      for (var k in json){
        if (json.hasOwnProperty(k)) {
          for (var l in json[k]){
            if (json[k].hasOwnProperty(l)) {
              let type = (l === "Start") ? '#efe06e':(l === "Stop") ? 'red':'white';
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
    }else{
      console.log('AdMob Not Loaded');
    }
  },
};
