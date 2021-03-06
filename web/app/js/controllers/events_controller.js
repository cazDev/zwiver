/**
 * Controller for events.
 *
 * @requires app.js
 * @requires controllers/location_controller.js
 * @exports ZWVR.eventsController
 */
(function(Ember, $, ZWVR) {
  ZWVR.eventsController = Ember.ArrayController.create({
    content: [],
    selectedEvent: null,
    nextUrl: ZWVR.toApiUrl('/events'),
    previousUrl: null,
    /**
      * Load upcoming events
      */
    init: function() {
      this._super();
      this.loadNext();
    },
    select: function(evt) {
      if(this.get('selectedEvent') && this.get('selectedEvent').get('infoWindow')) {
        this.get('selectedEvent').get('infoWindow').close();
      }
      this.set('selectedEvent', evt);
    },
    /**
      * sort the loaded events by the given sort parameter.
      * @param sort One of <code>ZWVR.sorts</code>. required. 
      */
    sortBy: function(sort) {
      switch(sort) {
        case ZWVR.sorts.DISTANCE:
          ZWVR.locationController.withLocation(function(location) {
            var sortedContent = $.merge([], ZWVR.eventsController.get('content'));
            sortedContent.sort(function(left, right) {
              var leftDistance = ZWVR.locationController.distance(location, {
                latitude: parseFloat(left.get('lat')),
                longitude: parseFloat(left.get('lon')),
              });
              var rightDistance = ZWVR.locationController.distance(location, {
                latitude: parseFloat(right.get('lat')),
                longitude: parseFloat(right.get('lon')),
              });
              return leftDistance - rightDistance;
            });
            ZWVR.eventsController.set('content', sortedContent); 
          });
          break;
        case ZWVR.sorts.DATE:
          var sortedContent = $.merge([], this.get('content'));
          sortedContent.sort(function(left, right) {
            return Date.parse(left.get('date')) - Date.parse(right.get('date'));
          });
          this.set('content', sortedContent);
          break;
        default: 
          console.warn('called sort with unknown parameter ' + sort);
      }
    },
    search: function(keywords) {
      this._load(ZWVR.toApiUrl('/events/search'), {q: keywords});
    },
    loadNext: function() {
      this._load(this.get('nextUrl'));
    },
    loadPrevious: function() {
      this._load(this.get('previousUrl'));
    },
    //private
    _load: function(url, params) {
      params = params || {};
      $.get(url, params, function(data) {
        ZWVR.eventsController.get('content').invoke('remove');
        ZWVR.eventsController.set('content', data.events.map(function(item) {
          return ZWVR.Event.create(item);
          })
        );
        ZWVR.eventsController.set('nextUrl', ZWVR.toApiUrl(data.nextUrl));
        ZWVR.eventsController.set('previousUrl', ZWVR.toApiUrl(data.prevUrl));
      });
    }
  });
})(Ember, jQuery, ZWVR);
