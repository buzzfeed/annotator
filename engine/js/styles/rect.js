if (!window.annotate_tools.styles.rect) {
  
  window.annotate_tools.styles.rect = {

    minTargetSize: 25,

    getStyle: function(imageWidth, imageHeight, targetConfig) {

      var annotationProperties = {};

      // Work out the radius. It's a percentage of the image width, but we don't want to make things untappably tiny on mobile.
      annotationProperties.width = ((imageWidth/100)*targetConfig.width);
      annotationProperties.height = ((imageHeight/100)*targetConfig.height);
      
      if (annotationProperties.width < this.minTargetSize) { annotationProperties.width = this.minTargetSize; }
      if (annotationProperties.height < this.minTargetSize) { annotationProperties.height = this.minTargetSize; }

      // The position, unadjusted for the size of the annotation. Will sit to the bottom right of the intended origin if left unadjusted.
      annotationProperties.y = (imageHeight/100) * targetConfig.y;
      annotationProperties.x = (imageWidth/100) * targetConfig.x;

      // Now adjust for size of the annotation
      annotationProperties.y -= annotationProperties.height/2;
      annotationProperties.x -= annotationProperties.width/2;

      if (!targetConfig.lineWidth) {
        targetConfig.lineWidth = 3;
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