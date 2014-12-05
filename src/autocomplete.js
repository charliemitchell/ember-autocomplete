/*
    Author: Charlie Mitchell
    Contact: charlie@webapp.technology
    Title: Ember Autocomplete Component
    Version: NA
    Deps: Ember
    Licensed under the MIT license.
*/

App.AutoCompleteComponent = Ember.Component.extend({

    api: false, // Your Custom API Implementation, if false then uses Ember.$.ajax, You should change this to point to your class if desired.

    api_get: false, // If using your custom implementation, what method to use for get requesets

    api_post: false, // If using your custom implementation, what method to use for post requesets

    type: 'GET', // Default Transfer type

    onerror: function (e) { // Default Error Handler
        // overwrite with your custom default error handler
        console.error('Error with request from auto complete');
    },

    min: 2, // Minimum Characters to trigger API Call

    value: '', // The value of the input

    active: false, // Toggles The Autocomplete List in the Dom

    scope: null, // The Parent Controller, to run functions against                                :: class{} || {}

    config: false, // Build The Component From a config file                                       :: {} || false

    target: '', // Key to use as value for input when selecting

    placeholder: null, //placeholder text for the input                                             :: string || null

    url: false, // the url to get the data                                                         :: string || false

    onSelect: false, // What to do when the user clicks an item in the autocomplete                :: string@scope.method || function || false

    debounce: false, // Time In MS to Debounce the API Calls                                       :: int || string || false

    results: false, // Container for search results and html for autocomplete                      :: {} || false

    predict: false, // Predict Outcome of hilited Matching text in autocomplete when active, zero latency concept, More resource intensive.

    onlyonmatch: false, // Only Show the Autocomplete if there is a match (hide the no results notification)

    lastData: false, // Data from last api request

    variableUrl: function () {
        // If using a url with an id variable in it like posts/:id/comments
    }.observes('url'),

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
        // Handle the keydown event
    },

    focusExit: function () {
        // Autocomplete Lost Focus
    },

    selectFromKeyboard: function () {
        // Select an entry from the keyboard
    },

    focusNext: function () {
        // down arrow, hilite the next result
    },

    focusPrevious: function () {
        // Up Arrow, hilite the previous result
    },


    /* @property data:
        Compiles Api Payload.
        Defaults to @string, @limit, @offset
        Extendable via the insertData array
    */
    data: function () {

    },


    /* @getData
        Event Manager for a change on the input, queries the server
        context : component
    */
    getData: function () {

    }.observes('value'),

    get: function (params, type) {
        // Initiate a request
    },


    // Filter the data locally
    predictOutcome: function () {

        // get the last search result
        // create matching function

        // loop through the results array
        // loop through each key in the result
        // test it against the search term
        // it's a win, push it into the output.

        // provide the data to the handler
    },

    /* @onHasData
        Event Manager for successful response from the server
        context : component
    */
    onHasData: function (data) {
        // Handle The Data
    },



    /* @onActiveChange
        Event Manager for active state change
        context : component
    */
    onActiveChange: function () {
        // Handle When Active State Changes
    }.observes('active'),



    /* @hiliteMatches
        Hilites search term within response text
        context : component
    */
    hiliteMatches: function (str) {

    },


    /* @setupFromConfig
        Sets up the autocomplete using a configuration object instead of setting the values inline.
    */
    setupFromConfig: function () {

    },


    willInsertElement: function () {

    },

    didInsertElement: function () {

    },

    click: function (event) {

    },

    focusOut: function (event) {

    },

    willClearRender: function () {

    },

    actions: {
        select: function (item) {

        }
    }
});