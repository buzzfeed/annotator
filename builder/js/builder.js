// GLOBAL MAGIC:

var state = false;
var defaultState = {
  H1: "Click here to add a hed",
  H2: "Click here to add a dek",
  lastUsedColour: 'rgba(234, 19, 148, 0.7)',
  lastUsedStyle: 'circle',
  configuringATarget: false,
  ptrTrack: false,
  imageURL: '../img/calibration.png',
  sessionUnique: false,
  targetConfiguration: []
}

////// FUNCTIONS ////////

function configureTarget(index) {

  index = parseInt(index);
  
  var current = state.targetConfiguration[index];
  
  state.configuringATarget = index;
  state.currentConfig = current;
  state.currentMinAnnotationDimensionSize = window.annotate_tools.styles[current.style].minTargetSize;

  $("#annoID").text(index);
  $("#configure-row").show();
  $("#content").val(current.content);
  $("#style").val(current.style);
  $("#lineWidth").val(current.lineWidth);
  $("#action-buttons").hide();
  $("#get-embed").hide();
  $(".annotation-target").removeClass("annotation-target-editing");
  $(".annotation-target[data-index=" + index + "]").addClass("annotation-target-editing");

}

function random_chars() {
  return 'xxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
}

function update_preview() {
  
  state.sessionUnique = "annotation-" + random_chars();
  var data = {
    "image": state.imageURL,
    "uniqueID": state.sessionUnique,
    "H1": state.H1,
    "H2": state.H2
  }
  var tpl = $('#preview-template').html();
  var render = Mustache.render(tpl, data);
  $('#live_preview').html(render);

  await_image_load();

}

function await_image_load() {

  if ($("#live_preview img").height() > 50) {
    
    image_loaded();

  } else {

    setTimeout(function() {
      console.info("Deferring render, target image found but isn't rendered yet");
      await_image_load();
    }, 66);

  }

}

function image_loaded() {
  window.annotate_tools.initialise("#" + state.sessionUnique);
  $.each(state.targetConfiguration, function(i,o) {
    var target = window.annotate_tools.install_target(".overlay-container", o, i);
    if (i === state.configuringATarget) {
      $(".annotation-target").last().addClass("annotation-target-editing");
      if (o.content) {
        window.annotate_tools.install_text(o, target);
      }
    }
  })
  // add handles
  $(".overlay-container .annotation-target").each(function(i,o) {
    $(o).append("<div class='resize_handle'></div>")
  });
  // do embed code
  var data = {
    "targetConfig": JSON.stringify(state.targetConfiguration),
    "dist": builderConfig.distURL,
    "uniqueID": state.sessionUnique,
    "sc_open": "<scr" + "ipt",
    "sc_close": "</scr" + "ipt>",
    "image": state.imageURL,
    "H1": state.H1,
    "H2": state.H2
  };
  var e_tpl = $('#full-embed-template').html();
  var render = Mustache.render(e_tpl, data);

  // Update outputs, this may be better on the "Done" routine
  $('#embed-code').text(render);

  var all_text = state.H1 + "\n" + state.H2 + "\n-- ";
  $.each(state.targetConfiguration, function(i,o) {
    all_text += "\n\nAnnotation " + i + ": \n";
    if (o.content) {
      all_text += o.content;
    } else {
      all_text += "No content."
    }
  });
  $('#all-text').text(all_text);
}


function handle_mousedown(e){

  state.ptrTrack = {};

  if ($(e.target).hasClass("resize_handle")) {

    state.ptrTrack.handle = true;
    configureTarget($(e.target).parent().attr("data-index"));

    if ($(this).innerWidth() == state.currentMinAnnotationDimensionSize) {
      state.ptrTrack.origRadiusPixels = 0;
      state.ptrTrack.originalWidthPixels = 0;
      state.ptrTrack.originalHeightPixels = 0;
    } else {
      state.ptrTrack.origRadiusPixels = $(this).innerWidth();
      state.ptrTrack.originalWidthPixels = $(this).innerWidth() + (state.currentConfig.lineWidth*2);
      state.ptrTrack.originalHeightPixels = $(this).innerHeight() + (state.currentConfig.lineWidth*2);
    }

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

    // Remove line and under text
    $(".under-line").remove();

    if (state.ptrTrack.handle == false) {

      // They are dragging the annotation target itself

      var left = state.ptrTrack.offset0.left + (e.pageX - state.ptrTrack.pageX0);
      var top = state.ptrTrack.offset0.top + (e.pageY - state.ptrTrack.pageY0);
      $(state.ptrTrack.elem).offset({top: top, left: left});

    } else {

      // They are dragging the resize handle

      var mode = "radius";
      var targetConfig = state.targetConfiguration[$(state.ptrTrack.elem).attr("data-index")];

      if (targetConfig.style == "rect") {
        mode = "xy";
      }

      if (mode == "radius") {

        // RADIUS ADJUST

        var newx = (e.pageX - state.ptrTrack.pageX0);
        var newy = (e.pageY - state.ptrTrack.pageY0);
        var size = Math.max(newx, newy) * 2;
        
        var perc = getPercs({
          offsetX: (size-(state.currentConfig.lineWidth*2))
        });
        
        state.ptrTrack.extraSize = perc.x;
        
        var livesize = parseFloat(state.ptrTrack.origRadiusPixels) + size;

        if (livesize < state.currentMinAnnotationDimensionSize) {
          livesize = state.currentMinAnnotationDimensionSize
        }

        $(state.ptrTrack.elem).css({
          left: state.ptrTrack.origX - (livesize/2) + (state.ptrTrack.origRadiusPixels/2) + (state.currentConfig.lineWidth),
          top: state.ptrTrack.origY - (livesize/2) + (state.ptrTrack.origRadiusPixels/2) + (state.currentConfig.lineWidth),
          width: livesize,
          height: livesize
        })

      } else if (mode == "xy") {

        // XY ADJUST

        var newx = (e.pageX - state.ptrTrack.pageX0);
        var newy = (e.pageY - state.ptrTrack.pageY0);

        var perc = getPercs({
          offsetX: (newx),
          offsetY: (newy)
        });

        var livesizeX = state.ptrTrack.originalWidthPixels + (newx*2);
        var livesizeY = state.ptrTrack.originalHeightPixels + (newy*2);

        if (livesizeX < state.currentMinAnnotationDimensionSize) {
          livesizeX = state.currentMinAnnotationDimensionSize
        }

        if (livesizeY < state.currentMinAnnotationDimensionSize) {
          livesizeY = state.currentMinAnnotationDimensionSize
        }

        $(state.ptrTrack.elem).css({
          left: (state.ptrTrack.origX) - (livesizeX/2) + (state.ptrTrack.originalWidthPixels/2),
          top: (state.ptrTrack.origY) - (livesizeY/2) + (state.ptrTrack.originalHeightPixels/2),
          width: livesizeX,
          height: livesizeY
        })

      }

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
  var conf = state.targetConfiguration[index];
  
  var iwPixels = $("#live_preview img").innerWidth();
  var minPerc = (state.currentMinAnnotationDimensionSize/iwPixels)*100;

  if (typeof conf.radius !== "undefined") {

    // Radius finalisation

    var oldsize = parseFloat(conf.radius);
    if (oldsize < minPerc) { oldsize = minPerc; }

    var newsize = oldsize + parseFloat(state.ptrTrack.extraSize);
    if (newsize < 0) { newsize = 0; }
    
    conf.radius = newsize.toFixed(3);

  } else if (typeof conf.width !== "undefined" && typeof conf.height !== "undefined") {

    // XY finalisation

    var nw = $(elem).outerWidth();
    var nh = $(elem).outerHeight();

    if (nw < state.currentMinAnnotationDimensionSize) { nw = state.currentMinAnnotationDimensionSize; }
    if (nh < state.currentMinAnnotationDimensionSize) { nh = state.currentMinAnnotationDimensionSize; }

    var percs = getPercs({
      offsetX: nw,
      offsetY: nh
    });
    
    conf.width = percs.x;
    conf.height = percs.y;

  }

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
    offsetX: relpos.left + ($(elem).innerWidth()/2) + state.currentConfig.lineWidth,
    offsetY: relpos.top + ($(elem).innerHeight()/2) + state.currentConfig.lineWidth
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

function start_editor() {
  $("#action-buttons").show();
  $("#starting-inputs").hide();
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
}

// HOOKS

$(document).ready(function() {

  $("#image-ready").click(function() {
    $("#reset").trigger("click");
    state.imageURL = $("#image-url").val();
    start_editor();
  });

  $("#textarea-ready").click(function() {

    $("#reset").trigger("click");

    var html = $("#embed-to-edit").val();

    state.H1 = $(html).find('h1').html();
    state.H2 = $(html).find('h2').html();
    state.imageURL = $(html).find('img').attr("src");

    var script_tags = $(html).find('script');
    $.each(script_tags, function(i,o) {
      var innertag = o.innerHTML;
      innertag = innertag.trim();
      // Find opening and closing JSON {}
      var opening_brace = innertag.indexOf("{");
      var closing_brace = innertag.lastIndexOf("}");
      json_maybe = innertag.substring(opening_brace-1, closing_brace+1);
      json_maybe = json_maybe.trim();
      if (json_maybe.length > 0) {
        state.targetConfiguration = JSON.parse(json_maybe).targets;
      }
    })

    // Show editor area
    start_editor();

  });

  $("#reset").on("click", function() {
    state = false;
    state = $.extend(true, {}, defaultState);
    $("#get-embed").hide();
    $("#action-buttons").hide();
    $("#starting-inputs").show();
    $("#image-preview").hide();
  });

  $("#continue").on("click", function() {
    $("#get-embed").hide();
    $("#action-buttons").show();
  })

  $(".update-live").on("input", function() {
    if (state.configuringATarget !== false) {

      var thing = $(this).attr("id");
      var conf = state.targetConfiguration[state.configuringATarget];
      
      // Rough on the fly conversion
      if (thing == "style") {
        state.lastUsedStyle = $(this).val();
        if (conf.style == "circle" && $(this).val() == "rect") {
          conf.width = conf.radius;
          conf.height = conf.radius;
          delete conf.radius;
        } else if (conf.style == "rect" && $(this).val() == "circle") {
          conf.radius = Math.max(conf.width, conf.height)/2;
          delete conf.width;
          delete conf.height;
        }
      }

      if ($(this).hasClass("treat-as-number")) {
        conf[thing] = parseFloat($(this).val());
      } else {
        conf[thing] = $(this).val();
      }

      update_preview();

    }
  })

  $("#commit-annotation").click(function() {
    state.configuringATarget = false;
    $(".annotation-target").removeClass("annotation-target-editing");
    $(".overlay-under").hide();
    $("#configure-row").hide();
    $("#action-buttons").show();
  });

  $("#remove-annotation").click(function() {
    state.targetConfiguration.splice(state.configuringATarget,1);
    update_preview();
    $("#configure-row").hide();
    $("#action-buttons").show();
  });

  $("body").on("click", ".overlay-container", function(e) {

    if ($(e.target).hasClass("annotation-target")) {

      // clicked on an annotation-target
      configureTarget(parseInt($(e.target).attr("data-index")));

    } else {

      if (state.configuringATarget !== false) {

        $("#commit-annotation").trigger("click");

      } else if (state.ptrTrack == false) {

        var pos = getPercs(e);
        if (state.lastUsedStyle == "circle") {
          state.targetConfiguration.push({
            "style": "circle",
            "color": state.lastUsedColour,
            "radius": 0,
            "x": pos.x,
            "y": pos.y
          });
        } else if (state.lastUsedStyle == "rect") {
          state.targetConfiguration.push({
            "style": "rect",
            "color": state.lastUsedColour,
            "width": 0,
            "height": 0,
            "x": pos.x,
            "y": pos.y
          });
        }
        update_preview();
        configureTarget(state.targetConfiguration.length-1);

      }

    }

  });

  $("body").on("mousedown", ".overlay-container .annotation-target", handle_mousedown);

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