Since it is NodeJs based framework so first install the NodeJs and NPM on the machine. After the NPM install run the following command to install the various packages required for this framework

Pre-requisites to use the framework

npm install restler assert swagger-tools yamljs

RESTLER is being used to make the HTTP calls

ASSERT is being used to do the verification of the response code and response structure

SWAGGER-TOOLS utility is being used to parse the swagger and to compose the model on the basis of the definition in request record in YAML form

YAMLJS utility is to parse the YAML and to read the request data records from a request YAML file

The command to run this script is:

node generictestRestAPI.js request ./swagger.json

The command to run this script is:

node generictestRestAPI.js request ./swagger.json

It takes two parameters , one is request means the name of the request.yml file where all the requests records are defined in YAML form and second is the swagger file in JSON format for those API’s whose end points for a particular end point we want to match
