# docker build -t alc .

# refer to https://docs.amazonaws.cn/en_us/lambda/latest/dg/images-create.html
#FROM scratch 
FROM public.ecr.aws/lambda/nodejs:latest
#FROM node:16-alpine

COPY lambda-entrypoint.sh /lambda-entrypoint.sh
#ADD aws-lambda-rie-x86_64 /usr/local/bin/aws-lambda-rie
COPY /var/runtime/bootstrap /var/runtime/bootstrap
RUN chmod +x /lambda-entrypoint.sh /var/runtime/bootstrap

# Assumes your function is named "app.js", and there is a package.json file in the app directory 
COPY var/task/app.js package.json  ${LAMBDA_TASK_ROOT}

# Install NPM dependencies in the container for function
RUN npm install

WORKDIR /var/task

ENTRYPOINT [ "/bin/sh" ]

CMD ["/lambda-entrypoint.sh", "app.myHandler"]
