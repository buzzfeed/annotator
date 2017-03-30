var $ = jQuery.noConflict();

// Install tclick if not already present on page
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

// Install annotation tools if not already present on page
if (!window.annotate_tools) {

  window.annotate_tools = {

    "shapes": {},

    "defaultLineWidth": 3, // px

    "initialise": function(target) {

      // Install the styling if it's not already present on the page
      if (!document.getElementById("annotatorInlineStyle")) {
        $("head").append('<style id="annotatorInlineStyle">' + annotatorInlineStyle + '</style>');
      }

      // Wrap the image to create a parent container
      $(target).attr("draggable", "false").wrap("<div class='overlay-container'></div>");

      // Append an "overlay-under" to that wrapper
      $(target).parent(".overlay-container").append("<div class='overlay-under'></div>");

      return $(target).parent(".overlay-container");
      
    },
    
    "install_target": function (parentContainer, targetConfig, index) {
      
      // All calculations are based off the image we're installing on.
      var imageWidth = $(parentContainer).find("img").innerWidth();
      var imageHeight = $(parentContainer).find("img").innerHeight();

      // Resolve the CSS for the chosen style
      var inlineCSS;

      // If no style is stated, default to circle, as it got here first.
      if (targetConfig.style && window.annotate_tools.shapes[targetConfig.style]) {
        inlineCSS = window.annotate_tools.shapes[targetConfig.style].getStyle(imageWidth, imageHeight, targetConfig);
      } else {
        inlineCSS = window.annotate_tools.shapes.circle.getStyle(imageWidth, imageHeight, targetConfig);
      }

      // Create the DIV, add the style and class
      var annotation = $('<div></div>').attr("style", inlineCSS).attr("data-index", index).addClass("annotation-target");

      // Append it to the container
      $(parentContainer).append(annotation);
      return annotation;

    },

    "install_all_targets": function(config, parentContainer) {

      // Remove any existing targets; this may be a resize event
      $(parentContainer).find(".annotation-target").remove();

      var activeIndex = $(parentContainer).data("activeIndex");
      if (typeof activeIndex == "undefined") {
        activeIndex = 0;
      }

      // Install each target
      $.each(config.targets, function(index, configuration) {
        // Put the annotation target on the image
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

    "install_text": function (targetConfig, targetElement) {

      var parentContainer = $(targetElement).parent(".overlay-container");

      // Based on the width of the image, figure out if to put the text on the left or right of the line
      var imageWidth = $(parentContainer).find("img").innerWidth();
      var imageCenter = imageWidth/2;
      var centreOfAnnotationX = targetElement.position().left + (targetElement.width()/2);
      
      // Remove any old elements from the container
      $(parentContainer).find(".overlay-under .under-text, .overlay-under .under-line").remove();

      // Set up the text area ready for styling
      var textArea = $('<div></div>').html(targetConfig.content).addClass("under-text");
      var textAreaStyle;

      // Gap between the line and the start of the text; we don't want them right next to eachother
      var lineToTextPadding = 5;

      if (centreOfAnnotationX > imageCenter) {

        // Line on right of text

        var textAreaWidthRight = (centreOfAnnotationX - lineToTextPadding + (targetConfig.lineWidth/2));
        textAreaStyle = "text-align: right; ";
        textAreaStyle += "color: " + targetConfig.color + "; ";
        textAreaStyle += "width: " + textAreaWidthRight + "px; ";
        
      } else {

        // Line on left of text

        var textAreaWidthLeft = (imageWidth - centreOfAnnotationX - lineToTextPadding - (targetConfig.lineWidth*1.5));
        textAreaStyle = "text-align: left; ";
        textAreaStyle += "color: " + targetConfig.color + "; ";
        textAreaStyle += "width: " + textAreaWidthLeft + "px; ";
        textAreaStyle += "left: " + (centreOfAnnotationX + (targetConfig.lineWidth*1.5) + lineToTextPadding) + "px; ";

      }
    
      // Apply the calculated style to the text area
      textArea.attr("style", textAreaStyle)
      $(parentContainer).find(".overlay-under").append(textArea);

      // Calculate style for the simple vertical line

      var verticalLine = $('<div></div>').addClass("under-line");
      var verticalLineTop = targetElement.position().top + targetElement.height() + targetConfig.lineWidth;
      var verticalLineStyle = "background-color: " + targetConfig.color + "; ";
      verticalLineStyle += "width: " + targetConfig.lineWidth + "px; ";
      
      // 4 = approx half a 1em line height; it is a magic number, I admit
      verticalLineStyle += "height: " + (textArea.height() + (textArea.position().top - verticalLineTop) - 4) + "px; ";
      verticalLineStyle += "left: " + (centreOfAnnotationX + (targetConfig.lineWidth/2)) + "px; ";
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

}