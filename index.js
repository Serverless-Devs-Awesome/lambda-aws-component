const { Component } = require('@serverless-devs/s-core');
const Logger = require('./utils/logger');
const AWSClient = require('./utils/getClient');
const { Function, EventSource } = require('./utils/handlerRequest');

class AWSComponent extends Component {
  constructor() {
    super();
    this.logger = new Logger();
  }

  handlerInput (inputs) {
    if (!(inputs.Credentials.AccessKeyID || inputs.Credentials.SecretAccessKey)) {
      const msg = `Credentials not found. `
      throw new Error(msg)
    }

    const {
      Credentials,
      Properties = {}
    } = inputs;
    
    if (Properties.Function && Properties.Function.Name) {
      Properties.Function.FunctionName = Properties.Function.Name;
      delete Properties.Function.Name;
    }

    const awsClients = new AWSClient(Credentials, Properties.Region)
    return {
      awsClients,
      credentials: Credentials,
      properties: Properties,
      region: Properties.Region
    }
  }

  async deploy (inputs) {
    const {
      properties,
      awsClients,
      region
    } = this.handlerInput(inputs);
    const functionName = properties.Function.FunctionName;
    if (!functionName) {
      throw new Error(`FunctionName is empty.`)
    }

    const functionClient = new Function(awsClients.lambda());

    this.logger.info(
      `Starting deploy of AWS Lambda "${functionName}" to the AWS region "${region}".`
    )
    const res = await functionClient.deploy(properties, region);
    this.logger.info(
      `Successfully deploy AWS Lambda function.`
    )
    return res;
  }
  async remove (inputs) {
    const {
      awsClients,
      properties,
      region
    } = this.handlerInput(inputs);

    const functionName = properties.Function.FunctionName;
    if (!functionName) {
      throw new Error(`FunctionName is empty.`)
    }
    
    this.logger.info(
      `Starting remove of AWS Lambda "${functionName}" to the AWS region "${region}".`
    )
    const functionClient = new Function(awsClients.lambda());
    await functionClient.remove(properties);
    this.logger.info(
      `Successfully remove AWS Lambda function.`
    )
    return {
      region,
      FunctionName: functionName
    };
  }
  async get (inputs) {
    const {
      awsClients,
      properties,
    } = this.handlerInput(inputs);

    const functionName = properties.Function.FunctionName;
    if (!functionName) {
      throw new Error(`FunctionName is empty.`)
    }
    const functionClient = new Function(awsClients.lambda());
    const res = await functionClient.get(functionName);
    return res
  }
}

module.exports = AWSComponent