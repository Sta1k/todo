/**
 * Created by user on 25.11.15.
 */
$(function () {
// пространство имён
    window.App = {
        Models: {},
        Collections: {},
        Views: {}
    };


    window.template = function (id) {
        return _.template($('#' + id).html());
    };
    App.Models.User = Parse.User.extend('User', {
        defaults: {
            login: '',
            password: ''
        }

    });
    App.Views.User = Backbone.View.extend({
        el: '#login',
        events: {
            'click .to_subscribe': 'to_subscribe',
            'submit': 'login'
        },
        login: function (e) {
            e.preventDefault();
            var login = $('#username').val(),
                pass = $('#password').val();
            Parse.User.logIn(login, pass, {
                success: function () {
                    console.log('login success');

                    return this.checkLogin()
                }.bind(this),
                error: function (login, error) {
                    console.log('LOGIN ERROR: ' + error.message)
                }
            })
        },
        checkLogin: function () {

            if (Parse.User.current()) {
                $("#login").hide();
                $(".todoapp").show();
                $('#logout-form').append(Parse.User.current().get('username'));//not work

                //this.collection.reset();
                var query = new Parse.Query('Task');
                id = Parse.User.current();
                query.equalTo('share', id);
                //query.include('shared');
                query.find({
                    success: function (results) {
                        console.log(results);
                        _.each(results, function (value) {
                            this.collection.add(value);
                        }, this);
                    }.bind(this),
                    error: function (error) {
                        console.log('Query Error' + error.message);
                    }
                });
            }
            else {

            }
        },


        to_subscribe: function () {//
            $("#login").hide();
            $("#subscribe").show();
        }
    });
    App.Views.AddUser = Backbone.View.extend({
        el: '#subscribe',
        events: {
            'submit': 'addUser',
            'click .to_login': 'to_login'
        },
        to_login: function () {
            $("#subscribe").hide();
            $("#login").show();
        },
        initialize: function () {
        },

        addUser: function (e) {

            e.preventDefault();
            var newUserLogin = document.getElementById("usernamesignup").value,
                newUserPass = document.getElementById("passwordsignup").value;
            var newUser = new App.Models.User();
            newUser.set("username", newUserLogin);
            newUser.set("password", newUserPass);
            newUser.signUp(null, {
                success: function (object) {
                    console.log('User: ' + newUserLogin + 'is created');
                    $("#subscribe").hide();
                    $("#login").show();
                },
                error: function (model, error) {
                    console.log('User: ' + newUserLogin + 'Error: ' + error.message);
                }
            });
            this.collection.add(newUser);


        }
    });
    App.Models.Task = Parse.Object.extend('Task', {
        defaults: {
            user: '',
            title: '',
            completed: false
        },
        toggle: function () {
            this.get('completed') ? this.set('completed', false) : this.set('completed', true)
        },
        validate: function (attrs) {
            if (!$.trim(attrs.title)) {
                return 'Имя задачи должно быть валидным!';
            }
        }


    });

    App.Views.AddTask = Backbone.View.extend({
        el: '.todoapp',
        events: {
            'click .task': 'addTask',
            'click #logout': 'logout'


        },

        logout: function (e) {
            e.preventDefault();
            $('ul').empty();
            this.collection.reset();
            Parse.User.logOut();
            $(".todoapp").hide();
            $("#login").show();

        },
        initialize: function () {
        },

        addTask: function (e) {
            e.preventDefault();
            console.log('button addTask is working');
            var newTaskTitle = $('.input-task').val(),
            user = Parse.User.current(),
            //
                newTask = new App.Models.Task();

            newTask.save({title: newTaskTitle}, {
                success: function (object) {
                    $('.success').show();


                },
                error: function (model, error) {
                    $('.error').show();
                }
            });
            this.collection.add(newTask);
            var relation = newTask.relation('share');
            relation.add(user);
            newTask.save();


        }
    });
    App.Views.RemoveTask = Backbone.View.extend({
        el: '.clear',
        events: {
            'click .clear': 'clearCompleted'
        },
        destroy: function () {
            this.model.destroy();
        },
        clearCompleted: function () {
            /*_.each(tasksCollection.models.attributes('completed'), function(task){ task.destroy();
             });
             return false;*/
            for (var i = 0; i < this.collection.length; i++) {
                var model = this.collection.models[i];
                if (model.get('completed')) {

                    model.destroy();
                    i--;
                }
            }
        }

    });
    App.Views.Task = Backbone.View.extend({
        tagName: 'li',
        initialize: function () {
            this.model.on('change', this.render, this);
            this.model.on('destroy', this.remove, this);

        },
        template: template('taskTemplate'),
        render: function () {

            var template = this.template(this.model.toJSON());
            this.$el.html(template);
            return this;
        },
        events: {
            'click .edit': 'editTask',
            'click .toggle': 'toggleCompleted',
            'click .share': 'share',
            'click .ok': 'ok'

        },
        //ok: function(e) {
        //    e.preventDefault();
        //    var shared = prompt('Введите имя пользоавтеля');//$('.share-name').val();
        //    //$('.share-name').hide();
        //    //$('.share').show();
        //    var query = new Parse.Query('User');
        //    query.equalTo('username', shared);
        //    query.first({
        //        success: function (results) {//TODO verification
        //
        //            this.model.addUnique('shared',results.id);
        //            this.model.save();
        //
        //        }.bind(this),
        //        error: function(error) {
        //            alert("Error: " + error.code + " " + error.message);
        //        }
        //    });
        //},

        share: function (e) {
            e.preventDefault();
            var shared = prompt('Введите имя пользоавтеля');//$('.share-name').val();
            if (shared === null) return;
            //$('.share-name').hide();
            //$('.share').show();
            console.log(this.model);
            var relation = this.model.relation('share');

            var query = new Parse.Query('User');
            query.equalTo('username', shared);
            query.first({
                success: function (results) {//TODO verification
                    relation.add(results);
                    //this.model.addUnique('share',results);
                    this.model.save();

                }.bind(this),
                error: function (error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            });


        },

        toggleCompleted: function () {
            this.model.toggle();
            this.model.save({
                success: function (object) {
                    $('.success').show();
                },
                error: function (model, error) {
                    $('.error').show();
                }
            })
        },


        remove: function () {
            this.$el.remove();
        }

    });
    App.Collections.User = Parse.Collection.extend({
        model: App.Models.User
    });
    App.Collections.Task = Parse.Collection.extend({
        model: App.Models.Task
    });

    App.Views.Tasks = Backbone.View.extend({
        tagName: 'ul',
        initialize: function () {
            this.collection.on('add', this.addOne, this);

        },
        render: function () {
            this.collection.each(this.addOne, this);
            return this;

        },
        addOne: function (task) {
            var taskView = new App.Views.Task({model: task});
            this.$el.append(taskView.render().el);
        }
    });

    window.usersCollection = new App.Collections.User([]);
    window.tasksCollection = new App.Collections.Task([]);
    var user = new App.Views.User({collection: tasksCollection});
    var userView = new App.Views.AddUser({collection: usersCollection});
    var tasksView = new App.Views.Tasks({collection: tasksCollection});
    var addTaskView = new App.Views.AddTask({collection: tasksCollection});
    var removeTask = new App.Views.RemoveTask({collection: tasksCollection});

    $('.tasks').html(tasksView.render().el);


});
