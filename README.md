# aws-lambda-container
aws lambda container stuff

#required
 container 10GB limit!
`https://github.com/aws/aws-lambda-runtime-interface-emulator`
`https://docs.aws.amazon.com/lambda/latest/dg/images-test.html`
`https://aws.amazon.com/blogs/compute/node-js-16-x-runtime-now-available-in-aws-lambda/`

#dev setup
`mkdir -p ~/.aws-lambda-rie && curl -Lo ~/.aws-lambda-rie/aws-lambda-rie \
https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie \
&& chmod +x ~/.aws-lambda-rie/aws-lambda-rie`

`npm run lint && npm run build && npm run test`

`curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{"key":"test"}'`