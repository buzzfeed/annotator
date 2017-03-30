if (!window.annotate_tools.shapes.rect) {
  
  window.annotate_tools.shapes.rect = {
    getStyle: function(imageWidth, imageHeight, targetConfig) {

      var minTargetSize = 25; // px
      var annotationProperties = {};

      // Work out the radius. It's a percentage of the image width, but we don't want to make things untappably tiny on mobile.
      annotationProperties.width = ((imageWidth/100)*targetConfig.width);
      annotationProperties.height = ((imageWidth/100)*targetConfig.height);
      
      if (annotationProperties.width < minTargetSize) { annotationProperties.width = minTargetSize; }
      if (annotationProperties.height < minTargetSize) { annotationProperties.height = minTargetSize; }

      // The position, unadjusted for the size of the annotation. Will sit to the bottom right of the intended origin if left unadjusted.
      annotationProperties.y = (imageHeight/100) * targetConfig.y;
      annotationProperties.x = (imageWidth/100) * targetConfig.x;

      // Now adjust for size of the annotation
      annotationProperties.y -= annotationProperties.height/2;
      annotationProperties.x -= annotationProperties.width/2;

      if (!targetConfig.lineWidth) {
        targetConfig.lineWidth = 10;
      }
      
      var inlineCSS = "top: " + annotationProperties.y + "px; ";
      inlineCSS += "left: " + annotationProperties.x + "px; ";
      inlineCSS += "border: " + targetConfig.lineWidth + "px solid " + targetConfig.color + "; ";
      inlineCSS += "width: " + annotationProperties.width + "px; ";
      inlineCSS += "height: " + annotationProperties.height + "px; ";
      return inlineCSS;

    }
  };

}