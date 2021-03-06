/**
 * Ember wrapper around google map
 *
 * @requires app.js
 * @requires controllers/events_controller.js
 * @requires models/event.js
 * @exports ZWVR.mapView
 * @modifies ZWVR.Event
 */
(function(Ember, $, google, ZWVR) {
  //extend the event model with google maps functions
  ZWVR.Event.reopen({
    /**
     * @return a google maps LatLng object with the position of this event
     */
    position: function() {
      return new google.maps.LatLng(this.get('lat'),this.get('lon'));
    }.property('lat','lon'),
    /**
     * @return a google maps Marker object for the event
     */
    mapMarker: function() {
      return new google.maps.Marker({
        position: this.get('position'),
        title: this.get('title'), 
        icon: '/images/map_marker.png'
      });
    }.property('title','position'),
    /**
     * @return html content for the map info window
     */
    infoWindowContent: function() {
      var title; 
      if(this.get('url')) {
        title = '<a target="_blank" href="' + this.get('url') + '">' + this.get('title') + '</a>';
      } else {
        title = this.get('title');
      }
      return '<div class="info-window-title">' + title + '</div>' +
        '<div class="info-window-content">' + 
          '<div class="info-window-date">' +
            this.get('formattedDate') +
          '</div>' +
          '<div class="info-window-venue">' +
            this.get('venue') +
          '</div>' +
          '<div class="info-window-address">' +
            this.get('address') +
          '</div>' +
        '</div>';
    }.property('formattedDate', 'address', 'venue', 'url'),
    /**
     * @return A google maps info window object 
     */
    infoWindow: function() {
      return new google.maps.InfoWindow({
        content: this.get('infoWindowContent'),
        position: this.get('position')
      });
    }.property('infoWindowContent','position'),
   /**
     * Remove this event from the map
     */
    remove: function() {
      this.get('infoWindow').close();
      this.get('mapMarker').setMap(null);
    }
  });

  ZWVR.mapView = Ember.View.create({
    map: null,
    //observes events list and draws markers
    //content may be loaded before the map is ready,
    //so observe both properties
    pointsObserver: function() {
      var markers = this.get('markers')
      var map = this.get('map');
      //add new markers to map
      if(map) {
        ZWVR.eventsController.get('content').forEach(function(evt) {
          //TODO: click listener on markers for selecting the event
          evt.get('mapMarker').setMap(map);
          google.maps.event.addListener(evt.get('mapMarker'), 'click', function() {
            ZWVR.eventsController.select(evt);
          });
        });
        if(ZWVR.eventsController.toArray().length) {
          map.panTo(ZWVR.eventsController.toArray()[0].get('position'));
        }
      }
    }.observes('map','ZWVR.eventsController.content.@each'),
    
    selectedEventObserver: function() {
      var map = this.get('map');
      var selectedEvent = ZWVR.eventsController.getPath('selectedEvent');
      if(map && selectedEvent) {
        map.panTo(selectedEvent.get('position'));
        selectedEvent.get('infoWindow').open(map);
      }
    }.observes('ZWVR.eventsController.selectedEvent'),

    //initialize the map when we're appending to the dom
    didInsertElement: function() {
      if(!this.get('map')) {
        this.set('map', new google.maps.Map(this.$().parent().get(0),  { 
          //TODO: more intelligent center for the map
          center: new google.maps.LatLng(37.78,-122.442),
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          panControl: true,
          scrollwheel: false,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        }));
      }
    }
  });
})(Ember, jQuery, google, ZWVR);

