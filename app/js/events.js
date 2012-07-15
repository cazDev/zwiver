EV = Events = Ember.Application.create({
  toApiUrl: function(path) {
    if(!path) {
      return null;
    } else {
      start =  path.indexOf('/') != 0 ? '/api/' : '/api';
      return start + path;
    }
  }
});

EV.Event = Ember.Object.extend({
  maxDescriptionLength: 140,
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  position: function() {
    return new google.maps.LatLng(this.get('lat'),this.get('lon'));
  }.property('lat','lon'),

  shortDescription: function() {
    var desc = this.get('description') || '';
    var maxLength = this.get('maxDescriptionLength');
    return desc.substring(0,maxLength); 
  }.property('description'), 

  hasMore: function() {
    return this.get('description') && 
      this.get('description').length > this.get('maxDescriptionLength');
  }.property('description'),

  mapMarker: function() {
    return new google.maps.Marker({
      position: this.get('position'),
      title: this.get('title')
    });
  }.property('title','position'),

  infoWindowContent: function() {
    return '<div class="info-window-title">' + 
      this.get('title') + '</div>' +
      '<div class="info-window-content">' + 
        '<div class="info-window-date">' + 
          this.get('formattedDate') + 
        '</div>' + 
        '<div class="info-window-venue">' +
          this.get('venue') + 
        '</div>' +
        this.get('shortDescription') + '...' + 
      '</div>';
  }.property('title','shortDescription'),

  infoWindow: function() {
    return new google.maps.InfoWindow({
      content: this.get('infoWindowContent'),
      position: this.get('position')
    });
  }.property('infoWindowContent','position'),

  formattedDate: function() { 
    var date = new Date(this.get('date'));  
    return this.get('monthNames')[date.getMonth()] + 
      ' ' + date.getDate() + ' ' + 
      (date.getHours() <= 12 ? date.getHours() : date.getHours() - 12) + 
      ':' + date.getMinutes() + 
      (date.getMinutes() < 10 ? '0' : '') + 
      (date.getHours() >= 12 ? 'pm' : 'am');
  }.property('date'),

  remove: function() {
    this.get('infoWindow').close();
    this.get('mapMarker').setMap(null);
  }
});

EV.eventsController = Ember.ArrayController.create({
  content: [],
  selectedEvent: null,
  nextUrl: EV.toApiUrl('/events'),
  previousUrl: null,
  /**
    * Load upcoming events
    */
  init: function() {
    this._super();
    this.loadNext();
  },
  select: function(evt) {
    if(this.get('selectedEvent')) {
      this.get('selectedEvent').get('infoWindow').close();
    }
    this.set('selectedEvent', evt);
  },
  loadNext: function() {
    this._load(this.get('nextUrl'));
  },
  loadPrevious: function() {
    this._load(this.get('previousUrl'));
  },
  //private
  _load: function(url) {
    $.get(url, function(data) {
      EV.eventsController.get('content').invoke('remove');
      EV.eventsController.set('content', data.events.map(function(item) {
        return EV.Event.create(item);
        })
      );
      EV.eventsController.set('nextUrl', EV.toApiUrl(data.nextUrl));
      EV.eventsController.set('previousUrl', EV.toApiUrl(data.prevUrl))
    });
  }
});

EV.listView = Ember.CollectionView.create({
  contentBinding: Ember.Binding.oneWay('EV.eventsController.content'),
  tagName: 'ul',
  classNames: ['event-list','unstyled'],
  itemViewClass: Ember.View.extend({
    templateName: 'list-item',
    classNameBindings: ['itemClass','selected'],
    itemClass: 'list-item',
    selected: false,
    showFullText: false,
    click: function(evt) {
      EV.listView.get('childViews').invoke('set','selected', false);
      this.set('selected', true);
      EV.eventsController.select(this.get('content'));
    },
    showMoreView: Ember.View.extend({
      click: function() {
        this.get('parentView').set('showFullText', true);
      }
    })
  })
});

EV.mapView = Ember.View.create({
  map: null,
  //observes events list and draws markers
  //content may be loaded before the map is ready,
  //so observe both properties
  pointsObserver: function() {
    var markers = this.get('markers')
    var map = this.get('map');
    //add new markers to map
    if(map) {
      EV.eventsController.get('content').forEach(function(evt) {
        //TODO: click listener on markers for selecting the event
        evt.get('mapMarker').setMap(map);
      });
    }
  }.observes('map','EV.eventsController.content.@each'),
  
  selectedEventObserver: function() {
    var map = this.get('map');
    var selectedEvent = EV.eventsController.getPath('selectedEvent');
    if(map && selectedEvent) {
      map.panTo(selectedEvent.get('position'));
      selectedEvent.get('infoWindow').open(map);
    }
  }.observes('EV.eventsController.selectedEvent'),

  //initialize the map when we're appending to the dom
  appendTo: function(selector) {
    this._super(selector);
    this.set('map', new google.maps.Map($(selector).get(0),  { 
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
});

EV.nextButton = Ember.View.create({
  templateName: 'next-button',
  clickable: function() {
    return EV.eventsController.get('nextUrl') != null;
  }.property('EV.eventsController.nextUrl'),
  click: function() {
    EV.eventsController.loadNext();
  }
});

EV.prevButton = Ember.View.create({
  templateName: 'prev-button',

  clickable: function() {
    return EV.eventsController.get('previousUrl') != null;
  }.property('EV.eventsController.previousUrl'),

  click: function() {
    if(this.get('clickable')) {
      EV.eventsController.loadPrevious();
    }
  }
});
