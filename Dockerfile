# docker build -t alc .
# see https://github.com/aws/aws-lambda-base-images/tree/nodejs16.x/x86_64
# https://www.npmjs.com/package/aws-lambda-ric
# refer to https://docs.amazonaws.cn/en_us/lambda/latest/dg/images-create.html
#FROM scratch 
FROM public.ecr.aws/lambda/nodejs:latest
#FROM node:16-alpine
WORKDIR /var/task

COPY lambda-entrypoint.sh /lambda-entrypoint.sh
#ADD aws-lambda-rie-x86_64 /usr/local/bin/aws-lambda-rie
COPY /var/runtime/* /var/runtime/
RUN chmod +x /lambda-entrypoint.sh /var/runtime/bootstrap

ENV LAMBDA_TASK_ROOT=/var/task/
# Assumes your function is named "app.js", and there is a package.json file in the app directory 
COPY var/task/* package.json ${LAMBDA_TASK_ROOT}

# Install NPM dependencies in the container for function
RUN npm install

ENTRYPOINT [ "/bin/sh" ]

CMD ["/lambda-entrypoint.sh", "app.myHandler"]
