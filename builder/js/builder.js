// GLOBAL MAGIC:

var minCircleSize = 20;
var borderWidth = 3;

var state = {
  H1: "Click here to add a hed",
  H2: "Click here to add a dek",
  lastUsedColour: 'rgba(234, 19, 148, 0.7)',
  configuringATarget: false,
  ptrTrack: false,
  sessionUnique: false,
  targetConfiguration: []
}

////// FUNCTIONS ////////

function configureTarget(index) {
  var current = state.targetConfiguration[index];
  state.configuringATarget = index;
  $("#annoID").text(index);
  $("#configure-row").show();
  $("#x").val(current.x);
  $("#y").val(current.y);
  $("#radius").val(current.radius);
  $("#content").val(current.content);
  $("#action-buttons").hide();
  $("#get-embed").hide();
  $(".circle").removeClass("circle-editing");
  $(".circle[data-index=" + index + "]").addClass("circle-editing");
}

function random_chars() {
  return 'xxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
}

function update_preview() {
  state.sessionUnique = "annotation-" + random_chars();
  var data = {
    "image": $("#image-url").val(),
    "uniqueID": state.sessionUnique,
    "H1": state.H1,
    "H2": state.H2
  }
  var tpl = $('#preview-template').html();
  var render = Mustache.render(tpl, data);
  $('#live_preview').html(render);
  window.annotate_tools.initialise("#" + state.sessionUnique);
  $.each(state.targetConfiguration, function(i,o) {
    var target = window.annotate_tools.install_target(".overlay-container", o, i);
    if (o.content) {
      window.annotate_tools.install_text(o, target);
    }
    console.log("Bonza");
    if (i == state.configuringATarget) {
      $(".circle").last().addClass("circle-editing");
    }
  })
  // add handles
  $(".overlay-container .circle").each(function(i,o) {
    $(o).append("<div class='resize_handle'></div>")
  });
  // do embed code
  var data = {
    "targetConfig": JSON.stringify(state.targetConfiguration),
    "dist": builderConfig.distURL,
    "uniqueID": state.sessionUnique,
    "sc_open": "<scr" + "ipt",
    "sc_close": "</scr" + "ipt>",
    "image": $("#image-url").val(),
    "H1": state.H1,
    "H2": state.H2
  };
  var e_tpl = $('#full-embed-template').html();
  var render = Mustache.render(e_tpl, data);
  $('#embed-code').text(render);
}


function handle_mousedown(e){

  state.ptrTrack = {};

  if ($(e.target).hasClass("resize_handle")) {
    state.ptrTrack.handle = true;
    configureTarget($(e.target).parent().attr("data-index"));
    if ($(this).outerWidth() == minCircleSize) {
      state.ptrTrack.origRadius = 0;
    } else {
      var perc = getPercs({
        offsetX: $(this).width()
      });
      state.ptrTrack.origRadius = perc.x;
    }
    state.ptrTrack.origRadiusPx = $(this).outerWidth();
    state.ptrTrack.origX = $(this).position().left;
    state.ptrTrack.origY = $(this).position().top;
  } else {
    state.ptrTrack.handle = false;
    configureTarget($(e.target).attr("data-index"));
  }

  state.ptrTrack.pageX0 = e.pageX;
  state.ptrTrack.pageY0 = e.pageY;
  state.ptrTrack.elem = this;
  state.ptrTrack.offset0 = $(this).offset();

  function handle_dragging(e){
    if (state.ptrTrack.handle == false) {
      var left = state.ptrTrack.offset0.left + (e.pageX - state.ptrTrack.pageX0);
      var top = state.ptrTrack.offset0.top + (e.pageY - state.ptrTrack.pageY0);
      $(state.ptrTrack.elem).offset({top: top, left: left});
    } else {
      var newx = (e.pageX - state.ptrTrack.pageX0);
      var newy = (e.pageY - state.ptrTrack.pageY0);
      var size = Math.max(newx, newy) * 2;
      var perc = getPercs({
        offsetX: size
      });
      state.ptrTrack.extraSize = perc.x;
      var livesize = state.ptrTrack.origRadiusPx + size;
      if (livesize < minCircleSize) {
        livesize = minCircleSize
      }
      $(state.ptrTrack.elem).css({
        left: state.ptrTrack.origX - (livesize/2) + (state.ptrTrack.origRadiusPx/2),
        top: state.ptrTrack.origY - (livesize/2) + (state.ptrTrack.origRadiusPx/2),
        width: livesize,
        height: livesize
      })
    }
  }

  function handle_mouseup(e){
    $('body').off('mousemove', handle_dragging).off('mouseup', handle_mouseup);
    if (state.ptrTrack.handle == false) {
      finalisePosition(state.ptrTrack.elem);
    } else {
      finaliseResize(state.ptrTrack.elem);
    }
    setTimeout(function() {
      state.ptrTrack = false;
    }, 33);
  }

  $('body').on('mouseup', handle_mouseup).on('mousemove', handle_dragging);
}

function finaliseResize(elem) {
  var index = parseInt($(elem).attr("data-index"));
  var oldsize = parseFloat(state.targetConfiguration[index].radius);
  var minRendered = $("#live_preview img").innerWidth();
  var minPerc = (minCircleSize/minRendered)*100;
  if (oldsize < minPerc) {
    oldsize = minPerc;
  }
  var newsize = oldsize + parseFloat(state.ptrTrack.extraSize);
  if (newsize < 0) {
    newsize = 0;
  }
  state.targetConfiguration[index].radius = newsize.toFixed(3);
  update_preview();
}

function finalisePosition(elem) {
  var index = parseInt($(elem).attr("data-index"));
  var newplace = getPos(state.ptrTrack.elem);
  state.targetConfiguration[index].x = newplace.x;
  state.targetConfiguration[index].y = newplace.y;
  update_preview();
}

function getPos(elem) {
  var relpos = $(elem).position();
  return getPercs({
    offsetX: relpos.left + ($(elem).innerWidth()/2) + borderWidth,
    offsetY: relpos.top + ($(elem).innerHeight()/2) + borderWidth
  })
}

function getPercs(e) {
  var iw = $("#live_preview img").innerWidth();
  var ih = $("#live_preview img").innerHeight();
  xPos = (e.offsetX/iw)*100;
  xPos = xPos.toFixed(3);
  yPos = (e.offsetY/ih)*100;
  yPos = yPos.toFixed(3);
  return { x: xPos, y: yPos }
}

// HOOKS

$(document).ready(function() {

  $(".update-live").on("input", function() {
    if (state.configuringATarget !== false) {
      var thing = $(this).attr("id");
      var last = state.targetConfiguration[state.targetConfiguration.length-1];
      last[thing] = $(this).val();
      update_preview();
    }
  })

  $("#commit-annotation").click(function() {
    state.configuringATarget = false;
    $(".circle").removeClass("circle-editing");
    $("#configure-row").hide();
    $("#action-buttons").show();
  });

  $("#remove-annotation").click(function() {
    state.targetConfiguration.splice(state.configuringATarget,1);
    update_preview();
    $("#configure-row").hide();
    $("#action-buttons").show();
  });

  $("#image-ready").click(function() {
    $("#action-buttons").show();
    $("#image-conf").hide();
    $("#image-preview").show();
    // Prep color picker
    $("#color").spectrum({
      showPalette: true,
      showButtons: false,
      color: 'rgba(234, 19, 148, 0.7)',
      palette: [
          ['#eb352c', '#c9cacc', '#000000', '#feec34', '#3eb24b', '#2266dd', '#fd8224', '#43d0c1', '#f13792',
          '#04129d', '#8e5411', '#7b3be8', '#7a0d75', '#1ca8fc', '#fd715e']
      ],
      showAlpha: true,
      move: function(color) {
        state.lastUsedColour = color.toRgbString();
        $("#color").val(state.lastUsedColour);
        $("#color").trigger("input");
      }
    });
    update_preview();
  });

  $("body").on("click", ".overlay-container", function(e) {

    if ($(e.target).hasClass("circle")) {

      // clicked on an annotation circle
      configureTarget(parseInt($(e.target).attr("data-index")));

    } else {

      if (state.configuringATarget !== false) {

        $("#commit-annotation").trigger("click");

      } else if (state.ptrTrack == false) {

        var pos = getPercs(e);
        state.targetConfiguration.push({
          "color": state.lastUsedColour,
          "radius": 0,
          "x": pos.x,
          "y": pos.y
        });
        update_preview();
        configureTarget(state.targetConfiguration.length-1);

      }

    }

  });

  $("body").on("mousedown", ".overlay-container .circle", handle_mousedown);

  $("#generate-embed").click(function() {
    $("#action-buttons").hide();
    $("#get-embed").show();
  });

  $("body").on("blur", ".annotated_media H1, .annotated_media H2", function(e) {
    var which = $(e.target).prop("tagName");
    var what = $(e.target).text();
    state[which] = what;
    update_preview();
  })

});