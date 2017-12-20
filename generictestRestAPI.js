/** Generic Utility to test the Rest API */

var rest = require("restler");
var assert = require('assert');
var spec = require('swagger-tools').specs.v2;
var YAML = require('yamljs');

var apiFile = process.argv[2];
var swggaerFile = process.argv[3];

var swaggerObject = require(swggaerFile);

var arrKeys = [];

var propertyArr = [];

var propertyResponseArr = [];

var arrKeysResponse = [];

/** Swagger tools utility to compose the model on the basis of definitions
 *  It also extracts all the properties in response structure from a swagger json file
 *  */
var apiModel = function(definitionValue){
    spec.composeModel(swaggerObject, '#/definitions/'+definitionValue, function (err, schema) {
        if (err) {
            throw err;
        }
        var properties = schema.properties;

        var getPropertyValues = function(count) {
            if(count === 1) {
                var length = Object.keys(properties).length;
                for (var property in properties) {
                    if(properties[property]!= undefined)
                    if (properties[property].hasOwnProperty("properties")) {
                        arrKeys.push(property);
                        propertyArr.push(Object.keys(properties[property].properties));
                        count = 0;
                        if(properties[property]== undefined){
                            arrKeys.push(property);
                            properties = properties[property].items.properties;
                            propertyArr.push(Object.keys(properties));
                            if(properties!= undefined){
                                count = 1;
                            }
                            else{
                                count = 0;
                            }
                        }
                        else{
                            count = 0;
                        }
                    }
                    else if (properties[property].type === 'array') {
                        arrKeys.push(property);
                        properties = properties[property].items.properties;
                        propertyArr.push(Object.keys(properties));
                        if(properties!= undefined){
                            count = 1;
                        }
                        else{
                            count = 0;
                        }
                    }
                    else {
                        if(!(propertyArr.toString().indexOf(property.toString()) > -1)) {
                            arrKeys.push(property);
                        }
                        length = length - 1;
                        if (length === 0) {
                            count = 0;
                        }
                    }
                }
                return getPropertyValues(count);
            }
        };
        getPropertyValues(1);
    });
};

/**
 * Read the API file passed as command line argument
 * Read all the request file values and store the length of the no of requests
 */
var length;

YAML.load(apiFile + '.yml', function (resultdev) {
    length = resultdev.length;
    base_url = resultdev.base_url;
    /**
     * Run the recursive loop for the length of requests
     * Verify the response structure of the API with the response structure of Swagger json file
     */
    (function loop() {
        if (length > 0) {
            var apiData = resultdev[length - 1];
            var basePath = apiData.basePath;
            var path = apiData.paths;
            var headers = apiData.headers;
            var queryData = apiData.query;
            var methodName = apiData.method;
            var bodyData = apiData.body;
            var definition = apiData.definition;
            var statusCode = apiData.status;

            /** parse the swagger file to read the response structure */
            apiModel(definition);

            rest[methodName](base_url, {
                headers: headers,
                query: queryData,
                data: JSON.stringify(bodyData)
            }).on('complete', function (data, response) {
                    assert.equal(statusCode, response.statusCode);
                    var keys = Object.keys(data);
                    for (var keyValue in data) {
                        if (typeof data[keyValue] != 'string' && data[keyValue]!=null) {
                            if((Object.keys(data[keyValue]).toString().charAt(0)) === '0'){
                                propertyResponseArr.push((Object.keys(data[keyValue][0]).toString()));
                            }
                            else{
                                propertyResponseArr.push((Object.keys(data[keyValue]).toString()));
                            }
                        }
                    }
                    arrKeysResponse.push(keys.toString());
                    if(propertyArr!="" || propertyResponseArr!="" ) {
                        propertyArr = propertyArr.join();
                        propertyResponseArr = propertyResponseArr[0].split(',');
                        var isSuperset = propertyResponseArr.every(function (val) {
                            return propertyArr.indexOf(val) >= 0;
                        });
                        assert.equal(true,isSuperset);
                    }
                    arrKeysResponse = arrKeysResponse[0].split(',');
                    var isSuperset1 = arrKeysResponse.every(function(val) { return arrKeys.indexOf(val) >= 0; });
                    assert.equal(true,isSuperset1);
                    length = length - 1;
                    arrKeys = [];
                    propertyArr = [];
                    propertyResponseArr = [];
                    arrKeysResponse = [];
                    loop();
            });
        }
    }());

});
