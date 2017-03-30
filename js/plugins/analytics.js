// Use window.annotate_tools to store a mutex
if (typeof window.annotate_tools.analytics == "undefined") {

  var ga_account = 'UA-1740781-1';

  window.annotate_tools.analytics = true;

  // Monitor entire page for clicks on .annotation-target within our container, record clicks/taps
  jQuery("body").on("click", ".overlay-container .annotation-target", function() {
    var evdata = {
        "category": 'NewFormats: Annotator',
        "action": "Annotation clicked",
        "label": $(this).parent(".overlay-container").find("img").attr("id"),
        "value": $(this).attr("data-index")
    };
    if (typeof ga == "undefined") {
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
      ga('create', ga_account, 'auto');
    }
    ga('send', 'event', evdata.category, evdata.action, evdata.label, evdata.value);
  });

}