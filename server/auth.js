function setupAuth(User, Config, app) {
    var passport = require('passport');
    var FacebookStrategy = require('passport-facebook').Strategy;

    /************************ PASSPORT-CONFIG  ************************/

    // PASSPORT-SESSION-CONFIG


    /*
     -------Login Sessions---------
     --
     In a typical web application, the credentials used to authenticate a user will only be transmitted during the login request.
     If authentication succeeds, a session will be established and maintained via a cookie set in the user's browser.
     Each subsequent request will not contain credentials, but rather the unique cookie that identifies the session.
     --

     ** In order to support login sessions, Passport will serialize and deserialize user instances to and from the session.
     */


    //serializeUser and deserializeUser functions --> to store the 'user' in SESSION

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        User.findOne({_id: id}).exec(done);
    });


    // PASSPORT-STRATEGY-CONFIG

    // Facebook-specific
    passport.use(new FacebookStrategy(
        {
            clientID: Config.facebookClientId,
            clientSecret: Config.facebookClientSecret,
            callbackURL: 'http://localhost:3000/auth/facebook/callback',
            profileFields: ['id', 'emails', 'name', 'gender', 'displayName', 'profileUrl']
        },
        function (accessToken, refreshToken, profile, done) {
            if (!profile.emails || !profile.emails.length) {
                return done('No emails associated with this account!');
            }

            User.findOneAndUpdate(
                {'data.oauth': profile.id},
                {
                    $set: {
                        'profile.username': profile.emails[0].value,
                        'profile.picture': 'http://graph.facebook.com/' +
                        profile.id.toString() + '/picture?type=large'
                    }
                },
                {'new': true, upsert: true, runValidators: true},
                function (error, user) {
                    done(error, user);
                });
        }));


    /************************ / PASSPORT-CONFIG  ************************/


    /************************ ATTACH: PASSPORT-CONFIG (in Express App) ************************/

    app.use(require('express-session')({secret: 'this is a secret'}));
    app.use(passport.initialize());
    app.use(passport.session());


    // Express Route -for Authentication
    //Fb-Login
    app.get('/auth/facebook',
        function (req, res, next) {
            var redirectURL = encodeURIComponent(req.query.redirect || '/');
            var fbCallbackURL = 'http://localhost:3000/auth/facebook/callback?redirect=' + redirectURL;


            //Asking 'Passport' to Authenticate -via Facebook
            passport.authenticate('facebook', {scope: ['email'], callbackURL: fbCallbackURL})(req, res, next);


        });

    //Fb-Login (Callback)
    app.get('/auth/facebook/callback',
        function (req, res, next) {
            var redirectURL = encodeURIComponent(req.query.redirect);
            var fbCallbackURL = 'http://localhost:3000/auth/facebook/callback?redirect=' + redirectURL;


            passport.authenticate('facebook', {callbackURL: fbCallbackURL})(req, res, next);

        },
        function (req, res) {
            res.redirect(req.query.redirect);
        });


    /************************ / ATTACH: PASSPORT-CONFIG (in Express App) ************************/


}

module.exports = setupAuth;
