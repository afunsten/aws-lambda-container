  // fetch(event.url)
  //   .then((response) => {
  //     if (response.ok) {
  //       return response;
  //     }
  //     return Promise.reject(new Error(
  //           `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`));
  //   })
  //   .then(response => response.buffer())
  //   .then(buffer => (
      // s3.putObject({
      //   Bucket: process.env.BUCKET,
      //   Key: event.key,
      //   Body: "<h1>works</h1>",
      // }).promise( context.succeed('OK') );
  //   ))
  //   .then(v => callback(null, v), callback);
