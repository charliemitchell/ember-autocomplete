var colors = COLORS = {
    hilite : '#ff4e2f'
}


// Note that this file should be written to suit your needs, Hopefully you have some reliable conventions to work with 
// on your API. Here I am illustrating how to store autocomplete configs in a class named Ac. You should note that the component renders string 
// to html at the autocomplete key using {{{}}} the triple stash, you can change this to just a double stash in the template if you are concerned about XSS coming from one
// of your endpoints, but you will need to create your formatter with that in mind (don't pass in any html). 



var Ac = {

    utils : {
        // Assuming that All Respones from the server have a key named results, where the results of the query are stored. 
        // Use this as a template for your formatters. look at params. Your formatter receives the hiliter method to run any hiliting on the data.
        // This is only an example, feel free to modify to suit your needs.
        format : function (data, config, hiliter) {
            var i=0, results = 'results';
            
            for (i; i < data.results.length; i++) {
                
                // If We Are Combining Keys To Create The Main Title
                if (typeof config.main === "object" && config.main.length) {
                    
                    data.results[i].autocomplete = '<div>'; // Create a wrapper for the result
                    
                    config.main.forEach(function (item, index) {
                        data.results[i].autocomplete += (hiliter ? hiliter(data.results.get(i + '.' + item)) : data.get(results + '.' + i + '.' + item)); // add the data in
                        data.results[i].autocomplete += " ";
                    });

                    data.results[i].autocomplete += "</div>"; // End the wrapper

                } else {
                    // We Are Only Using a single key for the main title
                    data.results[i].autocomplete = '<div>' + (hiliter ? hiliter(data.get(results + '.' + i + '.' + config.main)) : data.get(results + '.' + i + '.' + config.main)) + '</div>';
                }

                // We want to show more data, (puts keys specified in the "more" attribute)
                if (config.more) {
                    config.more.forEach(function (item, index) {
                        data.results[i].autocomplete += (!config.combine ? (index === 0 ? '' :'<br/>') : config.combine) +  '<span class="small-details">' + (hiliter ? hiliter(data.get(results + '.' +i + '.' + config.more[index])) :  data.get(results + '.' + i + '.' + config.more[index])) + '</span>';
                
                    });
                }   
            }
            
            return data.results;
        }
    },
    
    config: {

        example_static : {
            'static' : ['Node JS', 'Python', 'Ruby On Rails', 'PHP', 'C++', 'HTML', 'CSS', 'Javascript', 'SCSS', 'SASS', 'Compass', 'NGINX', 'Apache', 'Redis', 'Mongo DB', 'Couch DB', 'MYSQL', 'Postgres'],
            target : 'autocomplete'
        },

        more_advanced_static : {
            prefix : "<b>Tags</b>",
            'static' : ['Node JS', 'Python', 'Ruby On Rails', 'PHP', 'C++', 'HTML', 'CSS', 'Javascript', 'SCSS', 'SASS', 'Compass', 'NGINX', 'Apache', 'Redis', 'Mongo DB', 'Couch DB', 'MYSQL', 'Postgres'],
            target : 'autocomplete',
            onSelect : function (value) {
                this.send('tagSelected', value);
                alert("Hey I have a callback!")
            }
        },

        

        basic : {
            min : 1,
            target : 'name',
            predict : true,
            hilite : '#00AA00',
            url : '/api/basic',
            placeholder : 'Search People (Hit Space to see them all)',
            type : 'POST',
            formatter : function (data, hiliter) {

                return Ac.utils.format(data, {
                    main : 'name',
                    more : ['address']
                }, hiliter);
            },
            onSelect : function (person) {
                this.send('personSelected', person);
            }
        },


        endpoint_2 : {
            predict : 'confident',
            hilite : colors.hilite,
            prefix : "<i style='font-size:0.8rem; color:#8b8b8b'>Authors...</i><br/>",
            target : 'name',
            url : '/api/books/authors',
            placeholder : 'Search Authors',
            formatter : function (data, hiliter) {
                // Pass off to the default formatting method, specify the keys to include in the ui
                return Ac.utils.format(data, {
                    main : ['firstname', 'lastname'],
                    more : ['summary', 'footnote']
                }, hiliter);
  
            },
            
            onSelect : function (author) {
                this.send('selectAuthor', author.id);
            }
        },

        endpoint_3 : {
            predict: true,
            hilite: colors.hilite,
            prefix : "<i class='ac-prefix'>Matching Titles...</i><br/>",
            target : false,
            clear : true,
            url: '/api/books/nonfiction/titles',
            formatter : function (data, hiliter) {
                var i = 0
                    title,
                    summary,
                    isbn;
            
                for (i; i < data.results.length; i += 1) {

                    title = data.results.get(i + '.title');
                    summary = data.results.get(i + '.summary');
                    isbn = data.results.get(i + '.isbn');

                    data.results[i].autocomplete = hiliter(title + '<br/>' + summary + '<br/> ISBN: ' + isbn);
                }

                return data.results;
            },
            
            onSelect : function (book) {
                this.send('selectBook', book.id);
            }
        },

        // Illustrating how to include static data in the request.
        chooseCompany : {
            
            url: '/api/companies/',
            
            target : 'name',
            
            hilite : COLORS.green,
            
            predict : 'confident',
            
            staticData : {
                orderby : 'name#asc'
            },
            onSelect: function (item) {
                console.log(this)
                this.set('companyid', item.id);
            },
            
            formatter: function (data, hiliter) {
                return Ac.utils.format(data, {
                    main : 'name'
                }, hiliter);
            }
        },

        // Illustrating how to include static data in the request, as well as using a variable url
        getLocations : {
            
            url: '/api/company/:companyid/locations',
            
            target : 'location',
            
            hilite : COLORS.green,
            
            predict : 'confident',
            
            staticData : {
                orderby : 'name#asc'
            },

            onSelect: function (item) {
                this.send('locationSelected', item);
            },
            
            formatter: function (data, hiliter) {
                return Ac.utils.format(data, {
                    main : 'location'
                }, hiliter);
            }
        },

        // Explain Only On Match Parameter
        mfgpnduplicate : {
            predict : true,
            hilite : COLORS.error,
            prefix : "<i style='font-size:0.8rem; color:#8b8b8b'>Existing Part Numbers...</i><br/>",
            url : '/api/inventory/parts/search/mfgpn',
            placeholder : 'Search Part',
            formatter : function (data, hiliter) {
                // Pass off to the default formatting method, specify the keys to include in the ui
                return Ac.utils.format(data, {
                    main : 'mfgpn',
                    more : ['mfgname']
                }, hiliter);
            },
            onlyonmatch : true
        },


        // Explain CSS Stuff
        copyto : {
            predict : true,
            hilite : '#F2FF2F',
            url : '/api/universal',
            placeholder : 'Search Items',
            formatter : function (data, hiliter) {
                // Pass off to the default formatting method, specify the keys to include in the ui
                return Ac.utils.format(data, {
                    main : 'title',
                    more : ['description']
                }, hiliter);
            },
            css : true,
            resultsclass : 'quicksearch',
            onSelect : function (item) {
                this.send('copytoSelected', item);
            }
        },

        // Insert Data, Variable Url w/ deep path        
        insert_data_example : {
            min : 1,
            target : 'name',
            predict : true,
            hilite : '#ffcc00',
            url : '/api/user/:id/accounts/:selectedAccount.id/search',
            placeholder : 'Search Your Accounts',
            formatter : function (data, hiliter) {
                // Pass off to the default formatting method, specify the keys
                return Ac.utils.format(data, {
                    main : 'name',
                    more : ['nickname', 'acctnumber']
                }, hiliter);
            },
            insertData : {
                options : 'selectedAccount.options'
            },
            onSelect : function (acct) {
                this.send('subAccountSelected', acct);
            }
        }
    }
};
