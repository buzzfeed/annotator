if (!window.annotate_tools.styles.circle) {
  
  window.annotate_tools.styles.circle = {

    minTargetSize: 20,

    getStyle: function(imageWidth, imageHeight, targetConfig) {

      var annotationProperties = {};

      // Work out the radius. It's a percentage of the image width, but we don't want to make things untappably tiny on mobile.
      annotationProperties.radius = ((imageWidth/100)*targetConfig.radius);
      
      if (annotationProperties.radius < this.minTargetSize) { annotationProperties.radius = this.minTargetSize; }

      // The position, unadjusted for the size of the annotation. Will sit to the bottom right of the intended origin if left unadjusted.
      annotationProperties.y = (imageHeight/100) * targetConfig.y;
      annotationProperties.x = (imageWidth/100) * targetConfig.x;

      // Now adjust for size of the annotation
      annotationProperties.y -= annotationProperties.radius/2;
      annotationProperties.x -= annotationProperties.radius/2;

      if (!targetConfig.lineWidth) {
        targetConfig.lineWidth = 3;
      }

      // Set up the specific CSS properties of this target
      var inlineCSS = "top: " + annotationProperties.y + "px; ";
      inlineCSS += "left: " + annotationProperties.x + "px; ";
      inlineCSS += "border: " + targetConfig.lineWidth + "px solid " + targetConfig.color + "; ";
      inlineCSS += "width: " + annotationProperties.radius + "px; ";
      inlineCSS += "height: " + annotationProperties.radius + "px; ";
      inlineCSS += "border-radius: 50%; ";
      return inlineCSS;

    }
  };

}