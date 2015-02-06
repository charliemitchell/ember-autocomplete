/*jslint browser: true*/
/*globals App, Em, Ember, $, Api*/

/*
    Author: Charlie Mitchell
    Contact: charlie@webapp.technology
    Title: Ember Autocomplete Component
    Version: 0.1
    Deps: Ember, jQuery
    Licensed under the MIT license.
*/

App.AutoCompleteComponent = Ember.Component.extend({

    api: false, // Your Custom API Implementation, if false then uses Ember.$.ajax, You should change this to point to your API class if desired.

    api_get: 'GET', // If using your custom implementation, what method to use for get requesets

    api_post: false, // If using your custom implementation, what method to use for post requesets (Although I suggest You Use GET for anything Autocomplete..)

    type: 'GET', // Default Transfer type

    onerror: function (e) { // Default Error Handler
        // overwrite with your custom default error handler
        console.error('Error with request from auto complete');
        throw(e);
    },

    responseNamespace : false, // does the response data reside in a key (EX : {authorized : true, results : [... the data]})

    min: 2, // Minimum Characters to trigger API Call

    value: '', // The value of the input

    active: false, // Toggles The Autocomplete List in the Dom

    scope: null, // The Parent Controller, to run functions against                                :: class{} || {}

    config: false, // Build The Component From a config file                                       :: {} || false

    target: '', // Key to use as value for input when selecting

    clear: false, // Should We Clear the input, after selecting 

    formatter: false, // A formatter to use on the data (Specifies what keys to use from payload)  :: function || false   *Context: Parent Controller, via this.get('scope')

    insertData: false, // If the Request should look up properties in the model as well            :: [{},{}] || false

    staticData: false, // Append this static data to the payload                                   :: {} || [] || false

    placeholder: null, //placeholder text for the input                                             :: string || null

    url: false, // the url to get the data                                                         :: string || false

    prefix: false, // Prefix the Autocomplete with a header

    hilite: false, //hilites the words in the autocomplete                                         :: string@color || false

    onSelect: false, // What to do when the user clicks an item in the autocomplete                :: string@scope.method || function || false

    'static': false, // Behave more like a filterable dropdown select, Gets Source From OBJ-L        :: {} || false

    debounce: false, // Time In MS to Debounce the API Calls                                       :: int || string || false

    results: false, // Container for search results and html for autocomplete                      :: {} || false

    selecting: false, // Is the focusOut event caused by selecting and autocomplete item

    ignorefocusOut: false, // Do not run the focusOut method

    limit: 7, // Default limit @data.limit

    offset: 0, // Default offset @data.offset

    predict: false, // Predict Outcome of hilited Matching text in autocomplete when active, zero latency concept, More resource intensive.

    onlyonmatch: false, // Only Show the Autocomplete if there is a match (hide the no results notification)

    lastValue: '',

    lengthWherePrediction: 0,

    lastData: false, // Data from last api request

    paused: false, // Allow Pausing While Setting Attributes Outside The Component

    hasDynamicUrl : true,

    variableUrl: function () {  // If using a url with an id variable in it

        var url = this.get('url'),
            controller = this.get('scope');

        if (!url) {
            return
        }

        // controller.get('id')
        if (url.match(/\:([A-Za-z0-9]*)/)) {
            url = url.replace(/\:([A-Za-z0-9]*)/, function (a,b){
                return controller.get(b);
            });
            this.set('url', url);
        } else {
            this.set('hasDynamicUrl', false);
        }

    },

    pause: function () {
        this.set('paused', true);
    },

    resume: function () {
        Em.run.next(this, function () {
            this.set('paused', false);
        });
    },
    /*
        @keydownPoly
            Map of potential keyboard event char codes, and their associated method
    */
    keydownPoly: {
        13: 'selectFromKeyboard', //enter
        40: 'focusNext', //down
        38: 'focusPrevious', //up
        27: 'focusExit' //esc
    },


    keyDown: function (event) {
        var key = event.keyCode,
            poly = this.get('keydownPoly');
        if (poly[key]) {
            this[poly[key]](this);
        }
    },

    indexFocusedFromKeyboard: false, // Index of the item focused from the keyboard  :: int || false

    focusExit: function () {
        this.set('ignorefocusOut', false).set('active', false);
        this.$('input').blur();
    },

    selectFromKeyboard: function () {
        var current = this.get('indexFocusedFromKeyboard');
        if (current !== false) {
            this.send('select', this.get('results')[current]);
        }
    },

    focusNext: function () {
        var current = this.get('indexFocusedFromKeyboard'),
            len = this.get('results').length,
            next = (current === (len - 1)) ? 0 : current + 1;

        if (current !== false) {
            $(this.$('li')).removeClass('hover');
            $(this.$('li')[next]).addClass('hover');
            this.set('indexFocusedFromKeyboard', next);
        } else {
            $(this.$('li')[0]).addClass('hover');
            this.set('indexFocusedFromKeyboard', 0);
        }
    },

    focusPrevious: function () {
        var current = this.get('indexFocusedFromKeyboard'),
            len = this.get('results').length,
            prev = (current === 0) ? len - 1 : current - 1;

        if (current !== false) {
            $(this.$('li')).removeClass('hover');
            $(this.$('li')[prev]).addClass('hover');
            this.set('indexFocusedFromKeyboard', prev);
        }
    },


    /* @property data:
        Compiles Api Payload.
        Defaults to @term, @limit, @offset
        Extendable via the insertData array
    */
    data: function () {
        var data = {
                term: this.get('value'),
                limit: this.get('limit'),
                offset: this.get('offset')
            },
            k,
            insertData = this.get('insertData'),
            staticData = this.get('staticData');

        if (insertData) {
            for (k in insertData) {
                if (insertData.hasOwnProperty(k)) {
                    data[k] = this.get('scope').get(insertData[k]); // Insert requsted keys with their respective model data in the payload.
                }
            }
        }

        if (staticData) {
            data = $.extend(data, staticData);
        }

        return data;
    },


    /* @getData
        Event Manager for a change on the input, queries the server
        context : component
    */
    getData: function () {

        var confident = false, // Default
            type = this.get('type') /*The Transfer Type*/ || 'GET', // Incase you removed the default type, we actually needed that.
            stat = this.get('static'), // Are we using static data, or do we need to grab it from the server
            value = this.get('value'), // The Search Term
            predict = this.get('predict'), // Should we use prediction
            //lengthWherePrediction = this.get('lengthWherePrediction'), // Forward compatibilty (unused)
            last = this.get('lastData'), // The Last Result Set
            lastValue = this.get('lastValue'), // The Last Search term
            selecting = this.get('selecting'), // User is selecting an item
            min = this.get('min'), // How many chars before we start looking for results
            url = this.get('url'), // The Data Endpoint
            limit = this.get('limit'), // How many results should we include
            input = this.$('input')[0], // The autocomplete input
            focused = $(input).is(':focus'),  // OR: input === document.activeElement, Best to jquery Selector Engine for Cross Browser Compatibility
            results = this.get('responseNamespace');

        if (this.get('paused')) { // Autocomplete is paused, abort mission
            return;
        }

        this.get('hasDynamicUrl') ? this.variableUrl() : 0;

        if (focused) { // The input has focus, this is not a result of data binding

            if (value && (value.length >= min) && !stat && !selecting) { // Test if we should get data from a http(s) endpoint

                if (predict && last) { // if we are using prediction, and there is 

                    if (predict === 'confident') { // You should specify the prediction level, if confident, then we can bypass the http(s) request in many cases.

                        this.predictOutcome(); // Filter the data locally first.

                        // If there are less items than the limit in the current result set,
                        // AND the user is just beginning their search, 
                        // OR most importantly the search term is growing in length (meaning that the user is not deleting characters),
                        // then it is safe to assume that by adding characters, the result can not include any new items, it will be at most the same. 
                        // So rather than create extrenuous API requests, let's just filter the results using the data we have locally..

                        if ((limit >= (results ? last.results.length : last.length)) && (lastValue === '' || value.length > lastValue.length)) {
                            confident = true; // Bypass the call to the endpoint, we don't need the server. (The previous call --> this.predictOutcome(); has already filtered the data)
                            this.set('lastValue', value); // cache the current search term.
                        }

                        // if (!lengthWherePrediction && (limit >= last.results.length)) {

                        // }

                    } else {

                        this.onHasData(last); // Use the local data as the result. We are only hiliting matches.

                    }
                }

                if (!confident) { // We need to get the data from the http(s) endpoint, 

                    // APi Call Configuration, Sent to Either your api method or the internal one
                    var conf = {
                        url: url,
                        data: this.data(),
                        then: function (data) {
                            this.set('lastData', Em.copy(data, true)).set('lastValue', this.get('value'));
                            this.onHasData(data);
                        }.bind(this)
                    };

                    this.get('api') ? (  this.get('api')[this.get('api_' + type.toLowerCase())](conf)  ) : this.getDataFromEndPoint(conf, type);
                    //this.get('api') ? console.log(conf) : console.log(conf, type);

                }

            } else if (stat) { // We are using static data, pass it through

                this.onHasData(stat);

            } else {

                this.set('active', false);

            }

        }
    }.observes('value'),

    serialize : function(obj, prefix) {
      var str = [];
      for(var p in obj) {
        if (obj.hasOwnProperty(p)) {
          var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
          str.push(typeof v == "object" ?
            serialize(v, k) :
            encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
      }
      return str.join("&");
    },

    getDataFromEndPoint: function (params, type) {
        console.log("TYPE", type);

        Ember.$.ajax({
            type: type,
            url: params.url,
            data: type === 'get' ? this.serialize(params.data) : params.data,
            async: params.async || true,
            contentType: type === 'get' ? '' : 'application/json',
            error: function (e) {
                this.get('onerror').call(this, e);
            }.bind(this)
        }).then(function (data) {
           params.then(JSON.parse(data))
        });
    },


    // Filter the data locally
    predictOutcome: function () {

        var last = this.get('lastData'), // get the last search result
            filtered = [], // Container
            k, // forin
            regex = new RegExp("(" + this.get('value') + ")", 'gi'),
            results = this.get('responseNamespace'),
            methods = {
                usingResults : function () {
                    last[results].forEach(function (item) { // loop through the results array
                        for (k in item) { // loop through each key in the result
                            if (item.hasOwnProperty(k)) {
                                if (regex.test(item[k])) { // test it against the search term
                                    filtered.push(item); // it's a win, push it into the output.
                                }
                            }
                        }
                    }, this);
                },
                notUsingResults : function () {
                    last.forEach(function (item) { // loop through the results array
                        for (k in item) { // loop through each key in the result
                            if (item.hasOwnProperty(k)) {
                                if (regex.test(item[k])) { // test it against the search term
                                    filtered.push(item); // it's a win, push it into the output.
                                }
                            }
                        }
                    }, this);
                }
            }; // matching function

        results ? methods.usingResults() : methods.notUsingResults();
        
        // provide the data to the handler
        this.onHasData({
            results: filtered
        });
    },

    /* @onHasData
        Event Manager for successful response from the server
        context : component
    */
    onHasData: function (data) {

        data = data.results ? data : {results : data};

        var results,
            formatted,
            stat = this.get('static'),
            methods = {

                // The data came from an internal variable (static data, but can be dynamic, really this only means we are not getting it from the server)
                staticData: function () {
                    stat = Em.A(stat);
                    data = [];

                    //filter the static data against the search term
                    stat.forEach(function (item) {
                        if (typeof item === 'object') {

                            if (item.label.match(new RegExp("(" + this.get('value') + ")", 'gi')) !== null) {
                                data.push({
                                    autocomplete: item.label
                                });
                            }

                        } else {

                            if (item.match(new RegExp("(" + this.get('value') + ")", 'gi')) !== null) {
                                data.push({
                                    autocomplete: item
                                });
                            }
                        }
                    }, this);

                    if (data.length) {

                        this.set('results', data).set('active', true); // Activate the autocomplete, set the data

                    } else {

                        if (!this.get('onlyonmatch')) {

                            this.set('results', false).set('active', true); // No matching results
                        }
                    }
                },

                // The data came from a http(s) endpoint
                fromEndpoint: function () {

                    data = Em.Object.create(data); // Create a class from the response

                    if (this.get('formatter')) { // If we have a formatter

                        if (this.get('hilite')) { // if we should hilite the matching text

                            formatted = this.get('formatter').call(this.get('scope'), data, this.hiliteMatches.bind(this)); // Format the text, pass in the hiliter

                        } else {
                            formatted = this.get('formatter').call(this.get('scope'), data) // Format the text
                        }

                        this.set('results', formatted).set('active', true); // Activate the autocomplete, set the data

                    } else {

                        console.warn('No formatter detected in this autocomplete'); // Error, You should pass a formatter in

                    }

                },

                // When The Search term gives no results
                noResults: function () {
                    if (!this.get('onlyonmatch')) {
                        this.set('results', false).set('active', true); // No matching results
                    }
                }
            };

        // Call the appropriate method to deal with the data.
        stat ? methods.staticData.call(this) : data.results.length ? methods.fromEndpoint.call(this) : methods.noResults.call(this);

    },



    /* @onActiveChange
        Event Manager for active state change
        context : component
    */
    onActiveChange: function () {

        var active = this.get('active'),
            input = this.$('input');

        if (active) {

            Em.run.next(this, function () {
                this.$('.ac-component.results').css('width', input.width() + 8); // Match Input Width
            });

        } else {

            this.set('indexFocusedFromKeyboard', false);
            this.set('lastData', false);
        }

    }.observes('active'),



    /* @hiliteMatches
        Hilites search term within response text
        context : component
    */
    hiliteMatches: function (str) {
        str = str || "";
        var hilite = this.get('hilite'),
            term = this.get('value');

        // ESC REGEX CHARS
        term = (term + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1").trim();

        return str.replace(new RegExp("(" + term + ")", 'gi'), '<span style="color:' + hilite + ';">$1</span>');
    },


    /* @setupFromConfig
        Sets up the autocomplete using a configuration object instead of setting the values inline.
    */
    setupFromConfig: function () {
        var config = this.get('config'),
            k; // The Configuration
        for (k in config) {
            if (config.hasOwnProperty(k)) {
                if (config[k] === 'default') { // If requesting to use default
                    this.set(k, Ac.defaults[k]); // Use the default
                } else {
                    this.set(k, config[k]); // else, use specified
                }
            }
        }
    },


    willInsertElement: function () {
        if (this.get('config')) {
            this.setupFromConfig();
        }
    },

    didInsertElement: function () {

        this.$().mousedown(function () {
            this.set('ignorefocusOut', true);
        }.bind(this));

        this.$().mouseup(function () {
            this.set('ignorefocusOut', false);
        }.bind(this));

        this.$().mouseout(function () {
            this.set('ignorefocusOut', false);
        }.bind(this));

    },

    click: function (event) {
        if (this.get('static') && event.target.tagName !== "LI" && !this.$('input')[0].hasAttribute('disabled')) {
            this.onHasData(this.get('static'));
        }

        if ((this.get('min') === 0) && (event.target.tagName !== "LI") && (!this.$('input')[0].hasAttribute('disabled'))) {
            this.getData();
        }
    },


    focusOut: function (event) {

        Ember.run.later(this, function () {

            if (!this.get('ignorefocusOut')) {
                this.set('active', false);
            }

        }, 0);
    },

    willClearRender: function () {
        this.$('input').off();
        this.$().off();
    },

    actions: {
        select: function (item) {

            if (this.onSelect) {
                
                var scope = this.get('scope') || this;
                
                item.component = {
                    pause: this.get('pause').bind(this),
                    resume: this.get('resume').bind(this)
                };

                this.onSelect.call(scope, item);

                this.set('active', false).set('selecting', true)
                    .set('value', this.get('target') ? item[this.get('target')] : this.get('clear') ? '' : this.get('value'))
                    .set('ignorefocusOut', false)
                    .set('selecting', false);

            } else {
                this.set('value', this.get('target') ? item[this.get('target')] : this.get('clear') ? '' : this.get('value')).set('ignorefocusOut', false).set('active', false);
            }
        }
    }
});