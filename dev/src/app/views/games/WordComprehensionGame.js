LSCP.View.WordComprehensionGame = LSCP.View.Game.extend({

    current_level: null,
    current_stage: null,
    layers: {},
    objects: {},
    timers: {},
    $character: null,

	initialize: function(){
        LSCP.View.Game.prototype.initialize.apply(this, arguments);

        log('LSCP.View.WordComprehensionGame initialized!');

        // Preload assets
        var images = [
            ['slot', LSCP.Locations.Images + "slot-bg.png"],
            ['slot-correct', LSCP.Locations.Images + "slot-correct-bg.png"],
            ['slot-wrong', LSCP.Locations.Images + "slot-wrong-bg.png"]
        ];
        var sounds = [
            ['intro', {urls: ['mandy/intro.mp3']}],
            ['mandy', {
                urls: ['mandy/sprite.mp3'],
                sprite: {
                    intro: [0, 800],
                    greeting: [1000, 1600],
                    wrong: [3000, 1800],
                    idle: [5000, 3000]
                }
            }],
            ['plop', {urls: ['plop.mp3']}]
        ];

        // Objects
        _.each(this.game_session.get('assets').objects, function(objects, family){
            _.each(objects, function(object){
                images.push(['object_' + object, LSCP.Locations.Images + "objects/" + family + "/" + object + ".png"]);
                sounds.push(['object_' + object, {
                    urls: ['objects/' + family + '/' + object + '-sprite.mp3'],
                    sprite: {
                        intro1: [0, 2500],
                        intro2: [3000, 2500],
                        ask1: [6000, 2500],
                        ask2: [9000, 2500]
                    }
                }]);
            });
        });

        // Backgrounds
        _.each(this.game_session.get('assets').backgrounds, function(background){
            images.push(["background_" + background, LSCP.Locations.Images + "backgrounds/" + background + ".jpg"]);
        });

        this.preloadImages(_.object(images));
        images = null;

        this.preloadSounds(_.object(sounds));
        sounds = null;

        /*
         TODO
         - set the game data
         - create new game session
         - start
         */
	},

    getCurrentLevel: function(){
        return this.game_session.get('levels').at(this.current_level);
    },

    getCurrentStage: function(){
        return this.getCurrentLevel().get('stages').at(this.current_stage);
    },

    render: function(){
        LSCP.View.Game.prototype.render.apply(this, arguments);
        log('LSCP.View.WordComprehensionGame.render');


        // Background

        this.layers.background = new collie.Layer(this.layersSize);


        // Object slots

        this.layers.slots = new collie.Layer({
            x: 20,
            y: 20,
            width: this.layersSize.width - 40,
            height: this.layersSize.height - 40
        });


        // Character

        this.layers.character = new collie.Layer(this.layersSize);
        this.objects.overlay = new collie.DisplayObject({
            backgroundColor: '#000',
            height: 768,
            width: 1024,
            opacity: 1
        }).addTo(this.layers.character);
        this.objects.character = new collie.DisplayObject({
            x: "center",
            y: 800,
            height: 400,
            width: 400
        }).addTo(this.layers.character);

        LSCP.Mandy.initialize();
        this.objects.characters = LSCP.Mandy.addAnimations(this.objects.character);
        this.timers.characters = LSCP.Mandy.getTimers(this.objects.characters);


        // HUD

        this.layers.hud = new collie.Layer(this.layersSize);
        this.objects.hud_text = new collie.Text({
            x: "center",
            y: "bottom",
            fontColor: "#000",
            fontSize: 12,
            textAlign: 'center',
            width: this.layersSize.width,
            height: 100,
            visible: false
        }).addTo(this.layers.hud);
        if (this.subtitles) this.objects.subtitles = new collie.Text({
            x: "center",
            y: this.layersSize.height - 50,
            fontColor: "#FFF",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: 'center',
            width: this.layersSize.width,
            height: 50
        }).addTo(this.layers.hud);


        // Rendering

        _.each(this.layers, function(l){
            collie.Renderer.addLayer(l);
        });
        collie.Renderer.load(this.el);
        collie.Renderer.start();

        return this;
    },


    // Game cycle

    start: function(){
        LSCP.View.Game.prototype.start.apply(this, arguments);
        log('LSCP.View.WordComprehensionGame starts!');

        this.current_level = 0;
        this.current_stage = 0;

        this.onIteration();
    },

    nextStage: function(){

        var level = this.getCurrentLevel();

        this.current_stage += 1;

        if (this.current_stage > level.get('stages').length - 1) {
            this.reward.show().on('end', function(){
                this.reward.hide().off('end');
                this.current_level += 1;
                this.current_stage = 0;
                log("NEXT STAGE: level ", this.current_level, "stage", this.current_stage);
                this.onIteration();
            }.bind(this));
            return;
        }

        if (this.current_level > this.game_session.get('levels').length - 1) {
            this.end();
            return;
        }

        log("NEXT STAGE: level ", this.current_level, "stage", this.current_stage);

        this.onIteration();
    },

    retryStage: function(){

        log("RETRY STAGE: level ", this.current_level, "stage", this.current_stage);

        this.onIteration();
    },

    end: function(){
        LSCP.View.Game.prototype.end.apply(this, arguments);
        /* TODO
        - save game session
        - send GAME_END to controller
        */
    },


    // Game iteration management

    onIteration: function(){
        LSCP.View.Game.prototype.onIteration.apply(this, arguments);

        log('onIteration', this.current_level, this.current_stage);

        var level = this.getCurrentLevel();
        var stage = this.getCurrentStage();

        // Progress
        if (this.current_stage === 0) this.game_session.set({progress: 0});


        // Background
        if (this.objects.background) this.layers.background.removeChild(this.objects.background);
        this.objects.background = new collie.DisplayObject({
            x: "center",
            y: "center",
            backgroundImage: "background_" + level.get('background'),
            height: 768,
            width: 1024,
            opacity: 1
        }).addTo(this.layers.background);


        // Object slots
        this.objects.slots = [];

        // "Tutorial" mode when only one object
        var introduce_objects = true;
//        var show_character = true;
//        if (stage.get("objects").length == 1) {
//            introduce_objects = true;
//            show_character = false;
//        }

        // Override objects positions
        var objects_positions = [];
        if (stage.get("objects_positions") == 'NATURAL') {
            objects_positions = this.pos['FOR_' + stage.get("objects").length];
        } else if (_.isArray(stage.get("objects_positions"))) {
            objects_positions = _.map(stage.get("objects_positions"), function(pos) {
                if (typeof this.pos[pos] == 'undefined') throw 'Wrong value "'+pos+'" for "objects_positions" on level '+this.current_level+' stage '+this.current_stage;
                return this.pos[pos];
            }, this);
        } else {
            throw 'Wrong value for "objects_positions" on level '+this.current_level+' stage '+this.current_stage;
        }

        // Create slots
        _.each(stage.get("objects"), function(object, i){
            var slot = new collie.DisplayObject({
                backgroundImage: "slot",
                opacity: 0
            }).set(objects_positions[i]).addTo(this.layers.slots);
            new collie.DisplayObject({
                backgroundImage: 'object_' + object
            }).addTo(slot).align('center', 'center', slot);
            this.objects.slots.push(slot);
        }, this);


        // HUD

        this.objects.hud_text.text('LEVEL: ' + level.get('name'));


        // Display queue

        collie.Timer.queue().

            delay(function(){
                this.objects.hud_text.set({visible: true});
            }.bind(this), 1000 / this.speed).

            transition(this.objects.overlay, 1000 / this.speed, {
                from: 1,
                to: 0,
                set: "opacity",
                effect: collie.Effect.easeOutQuint
            }).

            delay(function(){
                if (introduce_objects) {
                    this.introduceObject(this.objects.slots[0], 0);
                }
                else this.onObjectsIntroduced();
            }.bind(this), 0)

        ;

    },

    introduceObject: function(slot, i){
        var stage = this.getCurrentStage();

        this.sound.play('object_' + stage.get('objects')[i], 'intro*');

        collie.Timer.queue().

            transition(slot, 1000 / this.speed, {
                from: 0,
                to: 1,
                set: "opacity",
                effect: collie.Effect.easeOutQuint
            }).

            delay(function(){
                if (this.subtitles) this.objects.subtitles.set({visible: true}).text("♫ This is " + stage.get('objects')[i]);

                slot.set({backgroundColor: 'rgba(255,255,255,0.2)'})
                    .attach({
                        mousedown: function () {
                            this.sound.play('plop');
                            var currentY = slot.get('y');
                            collie.Timer.transition(slot, 400 / this.speed, {
                                to: currentY - 50,
                                set: "y",
                                effect: collie.Effect.wave(2, 0.25)
                            });

                            if (this.subtitles) this.objects.subtitles.set({visible: false});

                            _.invoke(this.objects.slots, 'set', {backgroundColor: 'rgba(255,255,255,0)'});
                            _.invoke(this.objects.slots, 'detachAll');

                            setTimeout(function(){
                                if (i < stage.get("objects").length - 1) {
                                    i++;
                                    this.introduceObject(this.objects.slots[i], i);
                                } else {
                                    this.onObjectsIntroduced();
                                }
                            }.bind(this), 2000 / this.speed);
                        }.bind(this)
                    });
            }.bind(this), 0)

        ;

    },

    onCorrectAnswer: function(slot){
        LSCP.View.Game.prototype.onCorrectAnswer.apply(this, arguments);

        // Animation
        this.timers.characters.happy.start();

        // Sound
        this.sound.play('mandy', 'greeting');
        if (this.subtitles) this.objects.subtitles.set({visible: true}).text("♫ BRAVO!");

        // Slot
        slot.set('backgroundImage', 'slot-correct');

        // Progress
        var level = this.getCurrentLevel();
        var progress = 100 / level.get('stages').length * (this.current_stage+1);
        this.game_session.set({progress: Math.floor(progress)});

        // Display queue

        var currentY = slot.get('y');
        collie.Timer.queue().

            transition(slot, 400 / this.speed, {
                to: currentY - 50,
                set: "y",
                effect: collie.Effect.wave(2, 0.25)
            }).

            delay(function(){
                if (this.subtitles) this.objects.subtitles.set({visible: false});
            }.bind(this), 2000 / this.speed).

            delay(function(){

                collie.Timer.transition(this.objects.overlay, 800 / this.speed, {
                    from: 0,
                    to: 1,
                    set: "opacity",
                    effect: collie.Effect.easeOutQuint
                });
                collie.Timer.transition(this.objects.character, 1000 / this.speed, {
                    from: 1,
                    to: 0,
                    set: "opacity",
                    effect: collie.Effect.easeOutQuint
                });

            }.bind(this), 4000 / this.speed).

            delay(function(){
                this.objects.character.set({
                    opacity: 1,
                    y: 800
                });
                this.layers.slots.removeChildren(this.objects.slots);
                this.nextStage();
            }.bind(this), 2000 / this.speed)

        ;

        /* TODO
        - animate object and character
        - success sound
        - character leaves
        - fade to black
        - next iteration
        */
    },

    onWrongAnswer: function(slot){
        LSCP.View.Game.prototype.onWrongAnswer.apply(this, arguments);

        // Animation
        this.timers.characters.sad.start();

        // Sound
        this.sound.play('mandy', 'wrong');
        if (this.subtitles) this.objects.subtitles.set({visible: true}).text("♫ NO, YOU'RE WRONG");

        // Slot
        slot.set('backgroundImage', 'slot-wrong');

        // Display queue

        collie.Timer.queue().

            delay(function(){
                if (this.subtitles) this.objects.subtitles.set({visible: false});
            }.bind(this), 2000 / this.speed).

            delay(function(){

                collie.Timer.transition(this.objects.overlay, 800 / this.speed, {
                    from: 0,
                    to: 1,
                    set: "opacity",
                    effect: collie.Effect.easeOutQuint
                });
                collie.Timer.transition(this.objects.character, 1000 / this.speed, {
                    from: 1,
                    to: 0,
                    set: "opacity",
                    effect: collie.Effect.easeOutQuint
                });

            }.bind(this), 4000 / this.speed).

            delay(function(){
                this.objects.character.set({
                    opacity: 1,
                    y: 800
                });
                this.layers.slots.removeChildren(this.objects.slots);
                this.retryStage();
            }.bind(this), 2000 / this.speed)

        ;

        /* TODO
         - animate object and character
         - failure sound
         - character leaves
         - fade to black
         - next iteration
         */
    },

    onNoAnswer: function(){
        LSCP.View.Game.prototype.onNoAnswer.apply(this, arguments);
        /* TODO
         - wait 5 seconds
         - character leaves
         - fade to black
         - next iteration
         */
    },

    onIdle: function(){
        LSCP.View.Game.prototype.onIdle.apply(this, arguments);
        /* TODO
         - character talks
         - idle sound
         - after 3 times, end session
         */
    },


    // Game interaction

    onTouch: function(){
        LSCP.View.Game.prototype.onTouch.apply(this, arguments);
        /* TODO */
    },

    onObjectsIntroduced: function(){

        collie.Timer.queue().

            transition(this.objects.overlay, 1000 / this.speed, {
                from: 0,
                to: 0.9,
                set: "opacity",
                effect: collie.Effect.easeOutQuint
            }).

            transition(this.objects.character, 1000 / this.speed, {
                to: 200,
                set: "y",
                effect: collie.Effect.easeOutQuint
            }).

            delay(function(){
                this.timers.characters.hello.start();
                this.sound.delayedPlay(600, 'mandy', 'intro');

                this.objects.character.set({backgroundColor: 'rgba(255,255,255,0.1)'})
                    .attach({
                        mousedown: function () {
                            this.objects.character.set({backgroundColor: 'rgba(255,255,255,0)'});
                            this.objects.character.detachAll();

                            this.onTouchCharacter();
                        }.bind(this)
                    });
            }.bind(this), 0)

        ;
    },

    onTouchCharacter: function(){
        this.sound.play('plop');
        var stage = this.getCurrentStage();

        collie.Timer.queue().

            delay(function(){
                this.timers.characters.ask.start();
                this.sound.delayedPlay(500, 'object_' + stage.get('ask_for'), 'ask*');
                if (this.subtitles) this.objects.subtitles.set({visible: true}).text("♫ Where is the " + stage.get('ask_for') + "?");
            }.bind(this), 500 / this.speed).

            delay(function(){
                _.each(this.objects.slots, function(slot, i){
                    slot.set({backgroundColor: 'rgba(255,255,255,0.2)'})
                        .attach({
                            mousedown: function () {
                                this.sound.play('plop');
                                this.game_session.saveAction('touch', 'slot#'+i);

                                _.invoke(this.objects.slots, 'set', {backgroundColor: 'rgba(255,255,255,0)'});
                                _.invoke(this.objects.slots, 'detachAll');

                                if (stage.get("objects")[i] == stage.get("ask_for"))
                                    this.onCorrectAnswer(slot);
                                else
                                    this.onWrongAnswer(slot);
                            }.bind(this)
                        });
                }, this);
            }.bind(this), 2000 / this.speed).

            transition(this.objects.overlay, 1000 / this.speed, {
                from: 0.9,
                to: 0,
                set: "opacity",
                effect: collie.Effect.easeOutQuint
            })

        ;

    }


});