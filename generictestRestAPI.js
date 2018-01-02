/** Generic Utility to test the Rest API */

var restler = require("restler");
var assert = require('assert');
var swagger = require('swagger-tools').specs.v2;
var YAMLJS = require('yamljs');

var requestFile = process.argv[2];
var swggaerDefinitionFile = process.argv[3];

var swaggerDefinitionObject = require(swggaerDefinitionFile);

var arrKeys = [];

var propertyArrSwagger = [];

var propertyResponseAPIArr = [];

var arrKeysResponseAPI = [];

/** Swagger tools utility to compose the model on the basis of swagger definitions
 *  It also extracts all the properties in response structure from a swagger json file
 *  */
var apiResponseModel = function(definitionValue){
    swagger.composeModel(swaggerDefinitionObject, '#/definitions/'+definitionValue, function (err, schema) {
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
                        propertyArrSwagger.push(Object.keys(properties[property].properties));
                        count = 0;
                        if(properties[property]== undefined){
                            arrKeys.push(property);
                            properties = properties[property].items.properties;
                            propertyArrSwagger.push(Object.keys(properties));
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
                        propertyArrSwagger.push(Object.keys(properties));
                        if(properties!= undefined){
                            count = 1;
                        }
                        else{
                            count = 0;
                        }
                    }
                    else {
                        if(!(propertyArrSwagger.toString().indexOf(property.toString()) > -1)) {
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
var requestLength;

YAMLJS.load(requestFile + '.yml', function (resultdev) {
    requestLength = resultdev.length;
    base_url = resultdev.base_url;
    /**
     * Run the recursive loop for the length of requests
     * Verify the response structure of the API with the response structure of Swagger json file
     */
    (function recursiveLoop() {
        if (requestLength > 0) {
            var apiRequestData = resultdev[requestLength - 1];
            var requestBasePath = apiRequestData.basePath;
            var requestPath = apiRequestData.paths;
            var requestHeaders = apiRequestData.headers;
            var requestQueryData = apiRequestData.query;
            var requestMethodName = apiRequestData.method;
            var requestBodyData = apiRequestData.body;
            var requestDefinition = apiRequestData.definition;
            var requestStatusCode = apiRequestData.status;

            /** parse the swagger file to read the response structure */
            apiResponseModel(requestDefinition);

            restler[requestMethodName](base_url, {
                headers: requestHeaders,
                query: requestQueryData,
                data: JSON.stringify(requestBodyData)
            }).on('complete', function (data, response) {
                    assert.equal(requestStatusCode, response.statusCode);
                    var keys = Object.keys(data);
                    for (var keyValue in data) {
                        if (typeof data[keyValue] != 'string' && data[keyValue]!=null) {
                            if((Object.keys(data[keyValue]).toString().charAt(0)) === '0'){
                                propertyResponseAPIArr.push((Object.keys(data[keyValue][0]).toString()));
                            }
                            else{
                                propertyResponseAPIArr.push((Object.keys(data[keyValue]).toString()));
                            }
                        }
                    }
                    arrKeysResponseAPI.push(keys.toString());
                    if(propertyArrSwagger!="" || propertyResponseAPIArr!="" ) {
                        propertyArrSwagger = propertyArrSwagger.join();
                        propertyResponseAPIArr = propertyResponseAPIArr[0].split(',');
                        var isSuperset = propertyResponseAPIArr.every(function (val) {
                            return propertyArrSwagger.indexOf(val) >= 0;
                        });
                        assert.equal(true,isSuperset);
                    }
                    arrKeysResponseAPI = arrKeysResponseAPI[0].split(',');
                    var isSuperset1 = arrKeysResponseAPI.every(function(val) { return arrKeys.indexOf(val) >= 0; });
                    assert.equal(true,isSuperset1);
                    requestLength = requestLength - 1;
                    arrKeys = [];
                    propertyArrSwagger = [];
                    propertyResponseAPIArr = [];
                    arrKeysResponseAPI = [];
                    recursiveLoop();
            });
        }
    }());

});
