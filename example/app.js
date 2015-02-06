var Api = {
    GET : function (params) {

            return Ember.$.ajax({

                type: 'GET',

                url: params.url,

                data: typeof(params.data) === 'string' ? params.data : JSON.stringify(params.data),

                contentType: 'application/json',

                error: function (e) {

                    if (params.iserror === undefined) {

                        throw(params.type + ' :: ' + Api.base + params.url + ' :: ' + e.status + ' (' + e.statusText + ') ', params.data);
                    }

                    if (params.error) {

                        params.error.call(this);

                    } else {

                        console.error(e);
                    }

                }

            }).then(function (data) {
                data = typeof data === "string" ? JSON.parse(data) : data;
                if (params.then) { // There is a scoped callback
                    return params.then(data, params.scope);
                } else {
                    return data; // There is no scope and no callback
                }

            });
        }
}

window.App = Ember.Application.create();
App.IndexRoute = Em.Route.extend();
App.IndexView = Em.View.extend();
App.IndexController = Em.ObjectController.extend({
    
    currentSelection : "",
    
    companyid : "387409345734905749587",

    actions : {
        personSelected : function (person) {
            this.set('currentSelection', person.name)
        },

        tagSelected : function (val) {
            this.set('currentSelection', val.autocomplete);
        },
        locationSelected : function (ac) {
            ac.component.pause();
            this.set('currentSelection', ac.location );
            ac.component.resume();
        },
    }
});