// Localization
module.exports = function localizationInitializer() {
	var i18n = require('../extensions/i18n-namespace')
	,	i18nConfiguration = {
		    defaultLocale : 'en',
		    locales:['en', 'fr'],
		    directory: __dirname + '/../../app/locales/',
		    updateFiles: false,
		    cookie: 'lang'
	};

	
	// lambda for hogan-express
	this.set('lambdas', {
		"localizeLambda": function(text, hogan, context){
			return text;
		}
	});
	
	switch (this.env) {
		case 'production':
			break;
		case 'staging' :
			break;
		case 'development' :
			i18nConfiguration.updateFiles = true;
			break;
	}
	
	i18n.configure(i18nConfiguration);
};
