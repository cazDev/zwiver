/**
 * Creates the application namespace, EV
 * @exports EV
 */
(function(window, Ember) {
  window.EV = Ember.Application.create({
  /**
   * Different options by which to sort events.
   */
   sorts: {
     DISTANCE: 0,
     DATE: 1 
   },
   /**
    * Transform a relative or absolute url into one to access the api
    */
    toApiUrl: function(path) {
      if(!path) {
        return null;
      } else {
        var apiIndex = path.indexOf('api');
        if (apiIndex > 0) {
          //any absolute url will contain api
          //e.g. http://localhost/api/events
          return '/' + path.substring(apiIndex, path.length); 
        } else {
          //Got to be something like /events
          var start =  path.indexOf('/') != 0 ? '/api/' : '/api';
          return start + path;
        }
      }
    }
  });
})(window, Ember);
