// GLOBAL MAGIC:

var minCircleSize = 20;
var tpl;
var e_tpl;
var lastKnownColor = 'rgba(234, 19, 148, 0.7)';
var targetConfig = [];
var h1current = "Click here to add a hed";
var h2current = "Click here to add a dek";
var configuringTarget = false;
var last_rc = false;
var placed_percentages = { x: 0, y: 0 };
var dragTrack = false;

////// FUNCTIONS ////////

function configureTarget(index) {
  var current = targetConfig[index];
  configuringTarget = index;
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
  last_rc = "annotation-" + random_chars();
  var data = {
    "image": $("#image-url").val(),
    "uniqueID": last_rc,
    "h1": h1current,
    "h2": h2current
  }
  var render = Mustache.render(tpl, data);
  $('#live_preview').html(render);
  $.each(targetConfig, function(i,o) {
    window.annotate_tools.install_target(".annotation_container", o, i);
    if (i == configuringTarget) {
      $(".circle").last().addClass("circle-editing");
    }
  })
  // add handles
  $(".annotation_container .circle").each(function(i,o) {
    $(o).append("<div class='resize_handle'></div>")
  });
  // do embed code
  var data = {
    "targetConfig": JSON.stringify(targetConfig),
    "dist": builderConfig.distURL,
    "uniqueID": last_rc,
    "sc_open": "<scr" + "ipt",
    "sc_close": "</scr" + "ipt>",
    "image": $("#image-url").val(),
    "h1": h1current,
    "h2": h2current
  };
  var render = Mustache.render(e_tpl, data);
  $('#embed-code').text(render);
}


function handle_mousedown(e){

  dragTrack = {};

  if ($(e.target).hasClass("resize_handle")) {
    dragTrack.handle = true;
    configureTarget($(e.target).parent().attr("data-index"));
    if ($(this).outerWidth() == minCircleSize) {
      dragTrack.origRadius = 0;
    } else {
      var perc = getPercs({
        offsetX: $(this).width()
      });
      dragTrack.origRadius = perc.x;
    }
    dragTrack.origRadiusPx = $(this).outerWidth();
    dragTrack.origX = $(this).position().left;
    dragTrack.origY = $(this).position().top;
  } else {
    dragTrack.handle = false;
    configureTarget($(e.target).attr("data-index"));
  }

  dragTrack.pageX0 = e.pageX;
  dragTrack.pageY0 = e.pageY;
  dragTrack.elem = this;
  dragTrack.offset0 = $(this).offset();

  function handle_dragging(e){
    if (dragTrack.handle == false) {
      var left = dragTrack.offset0.left + (e.pageX - dragTrack.pageX0);
      var top = dragTrack.offset0.top + (e.pageY - dragTrack.pageY0);
      $(dragTrack.elem).offset({top: top, left: left});
    } else {
      var newx = (e.pageX - dragTrack.pageX0);
      var newy = (e.pageY - dragTrack.pageY0);
      var size = Math.max(newx, newy) * 2;
      var perc = getPercs({
        offsetX: size
      });
      dragTrack.extraSize = perc.x;
      var livesize = dragTrack.origRadiusPx + size;
      if (livesize < minCircleSize) {
        livesize = minCircleSize
      }
      $(dragTrack.elem).css({
        left: dragTrack.origX - (livesize/2) + (dragTrack.origRadiusPx/2),
        top: dragTrack.origY - (livesize/2) + (dragTrack.origRadiusPx/2),
        width: livesize,
        height: livesize
      })
    }
  }

  function handle_mouseup(e){
    $('body').off('mousemove', handle_dragging).off('mouseup', handle_mouseup);
    if (dragTrack.handle == false) {
      finalisePosition(dragTrack.elem);
    } else {
      finaliseResize(dragTrack.elem);
    }
    setTimeout(function() {
      dragTrack = false;
    }, 33);
  }

  $('body').on('mouseup', handle_mouseup).on('mousemove', handle_dragging);
}

function finaliseResize(elem) {
  var index = parseInt($(elem).attr("data-index"));
  var oldsize = parseFloat(targetConfig[index].radius);
  var minRendered = $("#live_preview img").innerWidth();
  var minPerc = (minCircleSize/minRendered)*100;
  if (oldsize < minPerc) {
    oldsize = minPerc;
  }
  var newsize = oldsize + parseFloat(dragTrack.extraSize);
  if (newsize < 0) {
    newsize = 0;
  }
  targetConfig[index].radius = newsize.toFixed(3);
  update_preview();
}

function finalisePosition(elem) {
  var index = parseInt($(elem).attr("data-index"));
  var newplace = getPos(dragTrack.elem);
  targetConfig[index].x = newplace.x;
  targetConfig[index].y = newplace.y;
  update_preview();
}

function getPos(elem) {
  var relpos = $(elem).position();
  return getPercs({
    // 3 is a magic number.
    offsetX: relpos.left + ($(elem).innerWidth()/2) + 3,
    offsetY: relpos.top + ($(elem).innerHeight()/2) + 3
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
    if (configuringTarget !== false) {
      var thing = $(this).attr("id");
      var last = targetConfig[targetConfig.length-1];
      last[thing] = $(this).val();
      update_preview();
    }
  })

  $("#commit-annotation").click(function() {
    configuringTarget = false;
    $(".circle").removeClass("circle-editing");
    $("#configure-row").hide();
    $("#action-buttons").show();
  });

  $("#remove-annotation").click(function() {
    targetConfig.splice(configuringTarget,1);
    update_preview();
    $("#configure-row").hide();
    $("#action-buttons").show();
  });

  $("#image-ready").click(function() {
    $("#action-buttons").show();
    $("#image-conf").hide();
    $("#image-preview").show();
    // Parse templates
    tpl = $('#preview-template').html();
    Mustache.parse(tpl);
    e_tpl = $('#full-embed-template').html();
    Mustache.parse(e_tpl);
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
        lastKnownColor = color.toRgbString();
        $("#color").val(lastKnownColor);
        $("#color").trigger("input");
      }
    });
    update_preview();
  });

  $("body").on("click", ".annotation_container", function(e) {

    if ($(e.target).hasClass("circle")) {

      // clicked on an annotation circle
      configureTarget(parseInt($(e.target).attr("data-index")));

    } else {

      if (configuringTarget !== false) {

        $("#commit-annotation").trigger("click");

      } else if (dragTrack == false) {

        var pos = getPercs(e);
        placed_percentages.x = pos.x;
        placed_percentages.y = pos.y;
        targetConfig.push({
          "color": lastKnownColor,
          "radius": 0,
          "x": placed_percentages.x,
          "y": placed_percentages.y
        });
        update_preview();
        configureTarget(targetConfig.length-1);

      }

    }

  });

  $("body").on("mousedown", ".annotation_container .circle", handle_mousedown);

  $("#generate-embed").click(function() {
    $("#action-buttons").hide();
    $("#get-embed").show();
  });

  $("body").on("input", ".annotated_media h1, .annotated_media h2", function(e) {
    var which = $(e.target).prop("tagName");
    var what = $(e.target).text();
    if (which == "H1") {
      h1current = what;
    }
    if (which == "H2") {
      h2current = what;
    }
    update_preview();
  })

});