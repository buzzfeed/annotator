var $ = jQuery.noConflict();

// Install the styling if it's not already present on the page

if (!document.getElementById("annotatorInlineStyle")) {
  document.querySelector('head').innerHTML += '<style id="annotatorInlineStyle">' + annotatorInlineStyle + '</style>';
}

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

window.annotate_media = function(target, config) {

  // Temporary configuration; this should be set (or at least extended) by the widget config

  var target = $(target);
  var lineWidth = 3;
  var minTargetSize = 20; // px

  // Wait for an image to both load and be sized correctly by the page before adding annotations.

  function goWhenReady() {
    if (target.height() > 50) {
      //console.log("Installing; config: ", config)
      goInstallThings(target, config);
    } else {
      setTimeout(function() {
        //console.info("Deferring render, target image found but isn't rendered yet");
        goWhenReady();
      }, 66);
    }
  }

  goWhenReady();

  // Okay, wrap the image and install the targets.

  function goInstallThings(target, config) {

    $(target).attr("draggable", "false");
    $(target).wrap("<div class='overlay-container'></div>");

    var parentContainer = $(".overlay-container").last();
    $(parentContainer).append("<div class='overlay-under'></div>");

    function install_target(targetConfig) {
      
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
      inlineCSS += "border: " + lineWidth + "px solid " + targetConfig.color + "; ";
      inlineCSS += "width: " + annotationCircleRadius + "px; ";
      inlineCSS += "height: " + annotationCircleRadius + "px; ";

      // Create the DIV, add the style and class
      var circle = $('<div></div>').attr("style", inlineCSS).addClass("circle");

      // Append it to the container
      $(parentContainer).append(circle);
      return circle;

    }

    function install_targets(parentContainer) {

      // Remove any existing targets; this may be a resize event
      $(parentContainer).find(".circle").remove();

      // Install each target
      $.each(config.targets, function(index, configuration) {
        // Put the circle on the image
        var target = install_target(configuration);
        // Attach click event
        $(target).tclick(function() {
          if (configuration.content) {
            install_text(configuration, target);
          }
        })
        // If it's the first circle, pop the text on straight away
        if (index == config.targets.length - 1) {
          if (configuration.content) {
            install_text(configuration, target);
          }
        }
      });
      
    }

    function install_text(targetConfiguration, targetElement) {

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

        var textAreaWidthRight = (centreOfCircleX - lineToTextPadding + (lineWidth/2));
        textAreaStyle = "text-align: right; ";
        textAreaStyle += "color: " + targetConfiguration.color + "; ";
        textAreaStyle += "width: " + textAreaWidthRight + "px; ";
        
      } else {

        // Line on left of text

        var textAreaWidthLeft = (imageWidth - centreOfCircleX - lineToTextPadding - (lineWidth*1.5));
        textAreaStyle = "text-align: left; ";
        textAreaStyle += "color: " + targetConfiguration.color + "; ";
        textAreaStyle += "width: " + textAreaWidthLeft + "px; ";
        textAreaStyle += "left: " + (centreOfCircleX + (lineWidth*1.5) + lineToTextPadding) + "px; ";

      }
    
      // Apply the calculated style to the text area
      textArea.attr("style", textAreaStyle)
      $(parentContainer).find(".overlay-under").append(textArea);

      // Calculate style for the simple vertical line

      var verticalLine = $('<div></div>').addClass("under-line");
      var verticalLineTop = targetElement.position().top + targetElement.height() + lineWidth;
      var verticalLineStyle = "background-color: " + targetConfiguration.color + "; ";
      verticalLineStyle += "width: " + lineWidth + "px; ";
      
      // 1.4 is a magic number, I admit
      verticalLineStyle += "height: " + (textArea.height() + (textArea.position().top - verticalLineTop) - (lineWidth*1.4)) + "px; ";
      verticalLineStyle += "left: " + (centreOfCircleX + (lineWidth/2)) + "px; ";
      verticalLineStyle += "top: " + verticalLineTop + "px; ";

      // Draw the vertical line
      verticalLine.attr("style", verticalLineStyle);
      $(parentContainer).find(".overlay-under").append(verticalLine);

    }

    // Immediately install the targets
    install_targets(parentContainer);

    // Do it again if the window resizes. RESPONSIVE!
    $(window).on("resize", function() { install_targets(parentContainer) }.bind(parentContainer));

  }

}