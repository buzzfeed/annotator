var $ = jQuery.noConflict();

if (!jQuery.fn.tclick) {
  // Helper function for fast mobile click
  jQuery.fn.tclick = function (onclick) {
    // http://stackoverflow.com/questions/13655919
    this.on("touchstart", function (e) { 
        onclick.call(this, e); 
        e.stopPropagation(); 
        e.preventDefault();
    });
    this.on("click", function (e) {
        onclick.call(this, e); 
    }); 
    return this;
  };
}

window.annotate_tools = {

  "lineWidth": 3, // px

  "initialise": function(target) {

    // Install the styling if it's not already present on the page

    if (!document.getElementById("annotatorInlineStyle")) {
      $("head").append('<style id="annotatorInlineStyle">' + annotatorInlineStyle + '</style>');
    }

    var embed_unique_id = $(target).attr("id");

    // Wrap the image to create a parent container
    $(target).attr("draggable", "false");
    $(target).wrap("<div class='overlay-container'></div>");

    var parent = $("#" + embed_unique_id).parent(".overlay-container");
    $(parent).append("<div class='overlay-under'></div>");

    return parent;
    
  },
  
  "install_target": function (parentContainer, targetConfig, index) {
    
    var minTargetSize = 20; // px

    // All calculations are based off the image we're installing on.
    var imageWidth = $(parentContainer).find("img").innerWidth();
    var imageHeight = $(parentContainer).find("img").innerHeight();

    // Work out the radius. It's a percentage of the image width, but we don't want to make things untappably tiny on mobile.
    var annotationCircleRadius = ((imageWidth/100)*targetConfig.radius);
    if (annotationCircleRadius < minTargetSize) { annotationCircleRadius = minTargetSize; }

    // The position, unadjusted for the size of the circle. Will sit to the bottom right of the intended origin if left unadjusted.
    var placementTop = (imageHeight/100) * targetConfig.y;
    var placementLeft = (imageWidth/100) * targetConfig.x;

    // Now adjust for size of the circle
    placementTop -= annotationCircleRadius/2;
    placementLeft -= annotationCircleRadius/2;

    // Set up the specific CSS properties of this target
    var inlineCSS = "top: " + placementTop + "px; ";
    inlineCSS += "left: " + placementLeft + "px; ";
    inlineCSS += "border: " + this.lineWidth + "px solid " + targetConfig.color + "; ";
    inlineCSS += "width: " + annotationCircleRadius + "px; ";
    inlineCSS += "height: " + annotationCircleRadius + "px; ";

    // Create the DIV, add the style and class
    var circle = $('<div></div>').attr("style", inlineCSS).attr("data-index", index).addClass("circle");

    // Append it to the container
    $(parentContainer).append(circle);
    return circle;

  },

  "install_all_targets": function(config, parentContainer) {

    // Remove any existing targets; this may be a resize event
    $(parentContainer).find(".circle").remove();

    var activeIndex = $(parentContainer).data("activeIndex");
    if (typeof activeIndex == "undefined") {
      activeIndex = 0;
    }

    // Install each target
    $.each(config.targets, function(index, configuration) {
      // Put the circle on the image
      var target = window.annotate_tools.install_target(parentContainer, configuration, index);
      // Attach click event
      $(target).tclick(function() {
        // Remember which index is active so resize events don't knock out the users' choice
        $(this).parent(".overlay-container").data("activeIndex", $(this).attr("data-index"));
        // Install the content if there is any
        if (configuration.content) {
          window.annotate_tools.install_text(configuration, target);
        }
      })
      // Pop the text on the active (or first) annotation
      if (index == activeIndex) {
        if (configuration.content) {
          window.annotate_tools.install_text(configuration, target);
        }
      }
    });
    
  },

  "install_text": function (targetConfiguration, targetElement) {

    var parentContainer = $(targetElement).parent(".overlay-container");

    // Based on the width of the image, figure out if to put the text on the left or right of the line
    var imageWidth = $(parentContainer).find("img").innerWidth();
    var imageCenter = imageWidth/2;
    var centreOfCircleX = targetElement.position().left + (targetElement.width()/2);
    
    // Remove any old elements from the container
    $(parentContainer).find(".overlay-under .under-text, .overlay-under .under-line").remove();

    // Set up the text area ready for styling
    var textArea = $('<div></div>').html(targetConfiguration.content).addClass("under-text");
    var textAreaStyle;

    // Gap between the line and the start of the text; we don't want them right next to eachother
    var lineToTextPadding = 5;

    if (centreOfCircleX > imageCenter) {

      // Line on right of text

      var textAreaWidthRight = (centreOfCircleX - lineToTextPadding + (this.lineWidth/2));
      textAreaStyle = "text-align: right; ";
      textAreaStyle += "color: " + targetConfiguration.color + "; ";
      textAreaStyle += "width: " + textAreaWidthRight + "px; ";
      
    } else {

      // Line on left of text

      var textAreaWidthLeft = (imageWidth - centreOfCircleX - lineToTextPadding - (this.lineWidth*1.5));
      textAreaStyle = "text-align: left; ";
      textAreaStyle += "color: " + targetConfiguration.color + "; ";
      textAreaStyle += "width: " + textAreaWidthLeft + "px; ";
      textAreaStyle += "left: " + (centreOfCircleX + (this.lineWidth*1.5) + lineToTextPadding) + "px; ";

    }
  
    // Apply the calculated style to the text area
    textArea.attr("style", textAreaStyle)
    $(parentContainer).find(".overlay-under").append(textArea);

    // Calculate style for the simple vertical line

    var verticalLine = $('<div></div>').addClass("under-line");
    var verticalLineTop = targetElement.position().top + targetElement.height() + this.lineWidth;
    var verticalLineStyle = "background-color: " + targetConfiguration.color + "; ";
    verticalLineStyle += "width: " + this.lineWidth + "px; ";
    
    // 1.4 is a magic number, I admit
    verticalLineStyle += "height: " + (textArea.height() + (textArea.position().top - verticalLineTop) - (this.lineWidth*1.4)) + "px; ";
    verticalLineStyle += "left: " + (centreOfCircleX + (this.lineWidth/2)) + "px; ";
    verticalLineStyle += "top: " + verticalLineTop + "px; ";

    // Draw the vertical line
    verticalLine.attr("style", verticalLineStyle);
    $(parentContainer).find(".overlay-under").append(verticalLine);

  }

}

window.annotate_media = function(target, config) {

  var target = $(target);

  // Wait for an image to both load and be sized correctly by the page before adding annotations.

  function goWhenReady() {

    if (target.height() > 50) {
      
      // Set up the DIVs
      var parentContainer = window.annotate_tools.initialise(target);

      // Install all the annotation targets
      window.annotate_tools.install_all_targets(config, parentContainer);

      // Do it again if the window resizes. RESPONSIVE!
      $(window).on("resize", function() { window.annotate_tools.install_all_targets(config, parentContainer) }.bind(config, parentContainer));

    } else {

      setTimeout(function() {
        //console.info("Deferring render, target image found but isn't rendered yet");
        goWhenReady();
      }, 66);

    }

  }

  goWhenReady();

}