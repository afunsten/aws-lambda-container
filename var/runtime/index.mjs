/** Copyright 2019,2020,2021,2022 Amazon.com, Inc. or its affiliates. All Rights Reserved. */
// node_modules/lambda-runtime/dist/node16/index.mjs
import { createRequire } from "module";
var require2 = createRequire(import.meta.url);
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require2 !== "undefined" ? require2 : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require2 !== "undefined" ? require2 : a)[b]
}) : x)(function(x) {
  if (typeof require2 !== "undefined")
    return require2.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_Errors = __commonJS({
  "Errors.js"(exports, module) {
    "use strict";
    var util = __require("util");
    function _isError(obj) {
      return obj && obj.name && obj.message && obj.stack && typeof obj.name === "string" && typeof obj.message === "string" && typeof obj.stack === "string";
    }
    function intoError(err) {
      if (err instanceof Error) {
        return err;
      } else {
        return new Error(err);
      }
    }
    module.exports.intoError = intoError;
    function toRapidResponse(error) {
      try {
        if (util.types.isNativeError(error) || _isError(error)) {
          return {
            errorType: error.name,
            errorMessage: error.message,
            trace: error.stack.split("\n")
          };
        } else {
          return {
            errorType: typeof error,
            errorMessage: error.toString(),
            trace: []
          };
        }
      } catch (_err) {
        return {
          errorType: "handled",
          errorMessage: "callback called with Error argument, but there was a problem while retrieving one or more of its message, name, and stack"
        };
      }
    }
    module.exports.toRapidResponse = toRapidResponse;
    module.exports.toFormatted = (error) => {
      try {
        return "	" + JSON.stringify(error, (_k, v) => _withEnumerableProperties(v));
      } catch (err) {
        return "	" + JSON.stringify(toRapidResponse(error));
      }
    };
    function _withEnumerableProperties(error) {
      if (error instanceof Error) {
        let ret = Object.assign({
          errorType: error.name,
          errorMessage: error.message,
          code: error.code
        }, error);
        if (typeof error.stack == "string") {
          ret.stack = error.stack.split("\n");
        }
        return ret;
      } else {
        return error;
      }
    }
    var errorClasses = [
      class ImportModuleError extends Error {
      },
      class HandlerNotFound extends Error {
      },
      class MalformedHandlerName extends Error {
      },
      class UserCodeSyntaxError extends Error {
      },
      class MalformedStreamingHandler extends Error {
      },
      class InvalidStreamingOperation extends Error {
      },
      class UnhandledPromiseRejection extends Error {
        constructor(reason, promise) {
          super(reason);
          this.reason = reason;
          this.promise = promise;
        }
      }
    ];
    errorClasses.forEach((e) => {
      module.exports[e.name] = e;
      e.prototype.name = `Runtime.${e.name}`;
    });
  }
});
var require_XRayError = __commonJS({
  "XRayError.js"(exports, module) {
    "use strict";
    module.exports.formatted = (err) => {
      try {
        return JSON.stringify(new XRayFormattedCause(err));
      } catch (err2) {
        return "";
      }
    };
    var XRayFormattedCause = class {
      constructor(err) {
        this.working_directory = process.cwd();
        let stack = [];
        if (err.stack) {
          let stackLines = err.stack.split("\n");
          stackLines.shift();
          stackLines.forEach((stackLine) => {
            let line = stackLine.trim().replace(/\(|\)/g, "");
            line = line.substring(line.indexOf(" ") + 1);
            let label = line.lastIndexOf(" ") >= 0 ? line.slice(0, line.lastIndexOf(" ")) : null;
            let path = label == void 0 || label == null || label.length === 0 ? line : line.slice(line.lastIndexOf(" ") + 1);
            path = path.split(":");
            let entry = {
              path: path[0],
              line: parseInt(path[1]),
              label: label || "anonymous"
            };
            stack.push(entry);
          });
        }
        this.exceptions = [
          {
            type: err.name,
            message: err.message,
            stack
          }
        ];
        let paths = /* @__PURE__ */ new Set();
        stack.forEach((entry) => {
          paths.add(entry.path);
        });
        this.paths = Array.from(paths);
      }
    };
  }
});
var require_VerboseLog = __commonJS({
  "VerboseLog.js"(exports) {
    "use strict";
    var EnvVarName = "AWS_LAMBDA_RUNTIME_VERBOSE";
    var Tag = "RUNTIME";
    var Verbosity = (() => {
      if (!process.env[EnvVarName]) {
        return 0;
      }
      try {
        const verbosity = parseInt(process.env[EnvVarName]);
        return verbosity < 0 ? 0 : verbosity > 3 ? 3 : verbosity;
      } catch (_) {
        return 0;
      }
    })();
    exports.logger = function(category) {
      return {
        verbose: function() {
          if (Verbosity >= 1) {
            console.log.apply(null, [Tag, category, ...arguments]);
          }
        },
        vverbose: function() {
          if (Verbosity >= 2) {
            console.log.apply(null, [Tag, category, ...arguments]);
          }
        },
        vvverbose: function() {
          if (Verbosity >= 3) {
            console.log.apply(null, [Tag, category, ...arguments]);
          }
        }
      };
    };
  }
});
var require_ChunkAdapterStream = __commonJS({
  "ChunkAdapterStream.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { InvalidStreamingOperation, toRapidResponse } = require_Errors();
    var { verbose, vverbose, vvverbose } = require_VerboseLog().logger("STREAM");
    var finished = __require("util").promisify(__require("stream").finished);
    var STATUS_READY = "ready";
    var STATUS_PENDING = "pending";
    var STATUS_ENDED = "ended";
    var ChunkAdapterStream = class extends Duplex {
      #transport;
      #finalCallback;
      #responseEnded = false;
      constructor(options) {
        super();
        this.status = STATUS_READY;
        this.#transport = options.transport;
        this.#transport.on("headers", (headers) => {
          this.emit("headers", headers);
        }).on("data", (chunk) => {
          this.push(chunk);
        }).on("error", (err) => {
          this.destroy(err);
        }).on("aborted", (err) => {
          this.destroy(err);
        }).on("end", () => {
          this.push(null);
          this.#responseEnded = true;
          this.#tryTriggerFinal();
        });
      }
      isEnded() {
        return !!this.#responseEnded;
      }
      setContentType(contentType) {
        if (this.status !== STATUS_READY) {
          throw new InvalidStreamingOperation("Cannot set content-type, too late.");
        }
        this.#transport.setHeader("Content-Type", contentType);
      }
      fail(err, callback) {
        verbose("ChunkAdapterStream::fail err:", err);
        const error = toRapidResponse(err);
        this.#transport.setErrorTrailers(error.errorType, error);
        this.end(callback);
      }
      #tryTriggerFinal() {
        if (this.#responseEnded && this.#finalCallback) {
          vverbose("triggering finalCallback");
          this.#finalCallback();
          vverbose("triggered finalCallback");
          this.#finalCallback = null;
        } else {
          vverbose("finalCallback not triggered.");
        }
      }
      write(chunk, encoding, cb) {
        if (typeof chunk !== "string" && !Buffer.isBuffer(chunk) && chunk?.constructor !== Uint8Array) {
          chunk = JSON.stringify(chunk);
        }
        super.write(chunk, encoding, cb);
      }
      _onBeforeFirstWrite(_w) {
      }
      _write(chunk, _encoding, callback) {
        vvverbose("ChunkAdapterStream::_write", chunk.length, callback);
        vvverbose("ChunkAdapterStream::_write", new String(chunk));
        if (this.status === STATUS_ENDED) {
          throw new InvalidStreamingOperation("Cannot write after end.");
        }
        if (this.status === STATUS_READY && typeof this._onBeforeFirstWrite === "function") {
          this._onBeforeFirstWrite((ch) => this.#transport.write(ch));
        }
        this.#transport.write(chunk);
        if (this.status === STATUS_READY) {
          this.status = STATUS_PENDING;
        }
        callback();
      }
      _final(callback) {
        verbose("ChunkAdapterStream::_final");
        this.#transport.end();
        this.status = STATUS_ENDED;
        this.#finalCallback = callback;
        this.#tryTriggerFinal();
      }
      _destroy(err, callback) {
        verbose("ChunkAdapterStream::_destroy");
        super._destroy(err, callback);
      }
      _read(_size) {
        verbose("ChunkAdapterStream::_read");
      }
      finished() {
        return finished(this, {
          writable: true,
          readable: false
        });
      }
    };
    module.exports.ChunkAdapterStream = ChunkAdapterStream;
  }
});
var require_JSStreamingResponseTransport = __commonJS({
  "JSStreamingResponseTransport.js"(exports, module) {
    "use strict";
    var { EventEmitter } = __require("events");
    var HEADER_RESPONSE_MODE = "Lambda-Runtime-Function-Response-Mode";
    var VALUE_STREAMING = "streaming";
    var TRAILER_NAME_ERROR_TYPE = "Lambda-Runtime-Function-Error-Type";
    var TRAILER_NAME_ERROR_BODY = "Lambda-Runtime-Function-Error-Body";
    var JSStreamingResponseTransport = class extends EventEmitter {
      #req;
      constructor(options) {
        super();
        this.#req = this.#createRequest({
          contentType: options.contentType,
          path: options.path,
          http: options.http,
          method: options.method,
          hostname: options.hostname,
          port: options.port,
          agent: options.agent
        });
      }
      setHeader(name, value) {
        this.#req.setHeader(name, value);
      }
      setErrorTrailers(errorType, errorBody) {
        this.#req.addTrailers({
          [TRAILER_NAME_ERROR_TYPE]: errorType,
          [TRAILER_NAME_ERROR_BODY]: Buffer.from(JSON.stringify(errorBody)).toString("base64")
        });
      }
      write(buffer) {
        this.#req.write(buffer);
      }
      end() {
        this.#req.end();
      }
      #createRequest(options) {
        const DEFAULT_CONTENT_TYPE = "application/octet-stream";
        const headers = {
          [HEADER_RESPONSE_MODE]: VALUE_STREAMING,
          Trailer: [TRAILER_NAME_ERROR_TYPE, TRAILER_NAME_ERROR_BODY],
          "Content-Type": options.contentType ? options.contentType : DEFAULT_CONTENT_TYPE
        };
        return options.http.request({
          method: options.method,
          hostname: options.hostname,
          port: options.port,
          path: options.path,
          headers,
          agent: options.agent
        }, (res) => {
          this.emit("headers", {
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers
          });
          res.on("data", (chunk) => {
            this.emit("data", chunk);
          });
          res.on("error", (err) => {
            this.emit("error", err);
          });
          res.on("aborted", (err) => {
            this.emit("aborted", err);
          });
          res.on("end", () => {
            this.emit("end");
          });
        });
      }
    };
    module.exports.JSStreamingResponseTransport = JSStreamingResponseTransport;
  }
});
var require_NativeModuleLoader = __commonJS({
  "NativeModuleLoader.js"(exports) {
    "use strict";
    exports.load = () => __require("./rapid-client.node");
  }
});
var require_RAPIDClient = __commonJS({
  "RAPIDClient.js"(exports, module) {
    "use strict";
    var Errors2 = require_Errors();
    var XRayError = require_XRayError();
    var ERROR_TYPE_HEADER = "Lambda-Runtime-Function-Error-Type";
    var { ChunkAdapterStream } = require_ChunkAdapterStream();
    var {
      JSStreamingResponseTransport
    } = require_JSStreamingResponseTransport();
    module.exports = class RAPIDClient {
      constructor(hostnamePort, httpClient, nativeClient) {
        this.http = httpClient || __require("http");
        this.nativeClient = nativeClient || require_NativeModuleLoader().load();
        this.useAlternativeClient = process.env["AWS_LAMBDA_NODEJS_USE_ALTERNATIVE_CLIENT_1"] === "true";
        let [hostname, port] = hostnamePort.split(":");
        this.hostname = hostname;
        this.port = parseInt(port, 10);
        this.agent = new this.http.Agent({
          keepAlive: true,
          maxSockets: 1
        });
      }
      postInvocationResponse(response, id, callback) {
        let bodyString = _trySerializeResponse(response);
        this.nativeClient.done(id, bodyString);
        callback();
      }
      getStreamForInvocationResponse(id, callback) {
        const transport = new JSStreamingResponseTransport({
          agent: this.agent,
          http: this.http,
          hostname: this.hostname,
          method: "POST",
          port: this.port,
          path: "/2018-06-01/runtime/invocation/" + id + "/response"
        });
        return new ChunkAdapterStream({
          transport
        }).on("error", (e) => {
          throw e;
        }).on("end", () => {
          if (callback) {
            callback();
          }
        });
      }
      postInitError(error, callback) {
        let response = Errors2.toRapidResponse(error);
        this._post(`/2018-06-01/runtime/init/error`, response, { [ERROR_TYPE_HEADER]: response.errorType }, callback);
      }
      postInvocationError(error, id, callback) {
        let response = Errors2.toRapidResponse(error);
        let bodyString = _trySerializeResponse(response);
        let xrayString = XRayError.formatted(error);
        this.nativeClient.error(id, bodyString, xrayString);
        callback();
      }
      async nextInvocation() {
        if (this.useAlternativeClient) {
          const options = {
            hostname: this.hostname,
            port: this.port,
            path: "/2018-06-01/runtime/invocation/next",
            method: "GET",
            agent: this.agent
          };
          return new Promise((resolve, reject) => {
            let request = this.http.request(options, (response) => {
              let data = "";
              response.setEncoding("utf-8").on("data", (chunk) => {
                data += chunk;
              }).on("end", () => {
                resolve({
                  bodyJson: data,
                  headers: response.headers
                });
              });
            });
            request.on("error", (e) => {
              reject(e);
            }).end();
          });
        }
        return this.nativeClient.next();
      }
      _post(path, body, headers, callback) {
        let bodyString = _trySerializeResponse(body);
        const options = {
          hostname: this.hostname,
          port: this.port,
          path,
          method: "POST",
          headers: Object.assign({
            "Content-Type": "application/json",
            "Content-Length": Buffer.from(bodyString).length
          }, headers || {}),
          agent: this.agent
        };
        let request = this.http.request(options, (response) => {
          response.on("end", () => {
            callback();
          }).on("error", (e) => {
            throw e;
          }).on("data", () => {
          });
        });
        request.on("error", (e) => {
          throw e;
        }).end(bodyString, "utf-8");
      }
    };
    function _trySerializeResponse(body) {
      try {
        return JSON.stringify(body === void 0 ? null : body);
      } catch (err) {
        throw new Error("Unable to stringify response body");
      }
    }
  }
});
var require_LogPatch = __commonJS({
  "LogPatch.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var fs = __require("fs");
    var levels = Object.freeze({
      INFO: { name: "INFO" },
      DEBUG: { name: "DEBUG" },
      WARN: { name: "WARN" },
      ERROR: { name: "ERROR" },
      TRACE: { name: "TRACE" },
      FATAL: { name: "FATAL" }
    });
    var REQUEST_ID_SYMBOL = Symbol.for("aws.lambda.runtime.requestId");
    var _currentRequestId = {
      get: () => global[REQUEST_ID_SYMBOL],
      set: (id) => global[REQUEST_ID_SYMBOL] = id
    };
    var _logToStdout = (level, message) => {
      let time = new Date().toISOString();
      let requestId = _currentRequestId.get();
      let line = `${time}	${requestId}	${level.name}	${message}`;
      line = line.replace(/\n/g, "\r");
      process.stdout.write(line + "\n");
    };
    var _logToFd = function(logTarget) {
      let typeAndLength = Buffer.alloc(8);
      typeAndLength.writeUInt32BE(2774138881, 0);
      typeAndLength.writeUInt32BE(0, 4);
      return (level, message) => {
        let time = new Date().toISOString();
        let requestId = _currentRequestId.get();
        let enrichedMessage = `${time}	${requestId}	${level.name}	${message}
`;
        let messageBytes = Buffer.from(enrichedMessage, "utf8");
        typeAndLength.writeInt32BE(messageBytes.length, 4);
        fs.writeSync(logTarget, typeAndLength);
        fs.writeSync(logTarget, messageBytes);
      };
    };
    function _patchConsoleWith(log) {
      console.log = (msg, ...params) => {
        log(levels.INFO, util.format(msg, ...params));
      };
      console.debug = (msg, ...params) => {
        log(levels.DEBUG, util.format(msg, ...params));
      };
      console.info = (msg, ...params) => {
        log(levels.INFO, util.format(msg, ...params));
      };
      console.warn = (msg, ...params) => {
        log(levels.WARN, util.format(msg, ...params));
      };
      console.error = (msg, ...params) => {
        log(levels.ERROR, util.format(msg, ...params));
      };
      console.trace = (msg, ...params) => {
        log(levels.TRACE, util.format(msg, ...params));
      };
      console.fatal = (msg, ...params) => {
        log(levels.FATAL, util.format(msg, ...params));
      };
    }
    var _patchConsole = () => {
      if (process.env["_LAMBDA_TELEMETRY_LOG_FD"] != null && process.env["_LAMBDA_TELEMETRY_LOG_FD"] != void 0) {
        let logFd = parseInt(process.env["_LAMBDA_TELEMETRY_LOG_FD"]);
        _patchConsoleWith(_logToFd(logFd));
        delete process.env["_LAMBDA_TELEMETRY_LOG_FD"];
      } else {
        _patchConsoleWith(_logToStdout);
      }
    };
    module.exports = {
      setCurrentRequestId: _currentRequestId.set,
      patchConsole: _patchConsole
    };
  }
});
var require_InvokeContext = __commonJS({
  "InvokeContext.js"(exports, module) {
    "use strict";
    var assert = __require("assert").strict;
    var { setCurrentRequestId } = require_LogPatch();
    var INVOKE_HEADER = {
      ClientContext: "lambda-runtime-client-context",
      CognitoIdentity: "lambda-runtime-cognito-identity",
      ARN: "lambda-runtime-invoked-function-arn",
      AWSRequestId: "lambda-runtime-aws-request-id",
      DeadlineMs: "lambda-runtime-deadline-ms",
      XRayTrace: "lambda-runtime-trace-id"
    };
    module.exports = class InvokeContext {
      constructor(headers) {
        this.headers = _enforceLowercaseKeys(headers);
      }
      get invokeId() {
        let id = this.headers[INVOKE_HEADER.AWSRequestId];
        assert.ok(id, "invocation id is missing or invalid");
        return id;
      }
      updateLoggingContext() {
        setCurrentRequestId(this.invokeId);
      }
      attachEnvironmentData(callbackContext) {
        this._forwardXRay();
        return Object.assign(callbackContext, this._environmentalData(), this._headerData());
      }
      _environmentalData() {
        return {
          functionVersion: process.env["AWS_LAMBDA_FUNCTION_VERSION"],
          functionName: process.env["AWS_LAMBDA_FUNCTION_NAME"],
          memoryLimitInMB: process.env["AWS_LAMBDA_FUNCTION_MEMORY_SIZE"],
          logGroupName: process.env["AWS_LAMBDA_LOG_GROUP_NAME"],
          logStreamName: process.env["AWS_LAMBDA_LOG_STREAM_NAME"]
        };
      }
      _headerData() {
        const deadline = this.headers[INVOKE_HEADER.DeadlineMs];
        return {
          clientContext: _parseJson(this.headers[INVOKE_HEADER.ClientContext], "ClientContext"),
          identity: _parseJson(this.headers[INVOKE_HEADER.CognitoIdentity], "CognitoIdentity"),
          invokedFunctionArn: this.headers[INVOKE_HEADER.ARN],
          awsRequestId: this.headers[INVOKE_HEADER.AWSRequestId],
          getRemainingTimeInMillis: function() {
            return deadline - Date.now();
          }
        };
      }
      _forwardXRay() {
        if (this.headers[INVOKE_HEADER.XRayTrace]) {
          process.env["_X_AMZN_TRACE_ID"] = this.headers[INVOKE_HEADER.XRayTrace];
        } else {
          delete process.env["_X_AMZN_TRACE_ID"];
        }
      }
    };
    function _parseJson(jsonString, name) {
      if (jsonString !== void 0) {
        try {
          return JSON.parse(jsonString);
        } catch (err) {
          throw new Error(`Cannot parse ${name} as json: ${err.toString()}`);
        }
      } else {
        return void 0;
      }
    }
    function _enforceLowercaseKeys(original) {
      return Object.keys(original).reduce((enforced, originalKey) => {
        enforced[originalKey.toLowerCase()] = original[originalKey];
        return enforced;
      }, {});
    }
  }
});
var require_BeforeExitListener = __commonJS({
  "BeforeExitListener.js"(exports, module) {
    "use strict";
    var LISTENER_SYMBOL = Symbol.for("aws.lambda.beforeExit");
    var NO_OP_LISTENER = () => {
    };
    module.exports = {
      invoke: () => global[LISTENER_SYMBOL](),
      reset: () => global[LISTENER_SYMBOL] = NO_OP_LISTENER,
      set: (listener) => global[LISTENER_SYMBOL] = listener
    };
  }
});
var require_CallbackContext = __commonJS({
  "CallbackContext.js"(exports, module) {
    "use strict";
    var BeforeExitListener2 = require_BeforeExitListener();
    var { toFormatted, intoError } = require_Errors();
    function _rawCallbackContext(client, id, scheduleNext) {
      const postError = (err, callback2) => {
        console.error("Invoke Error", toFormatted(intoError(err)));
        client.postInvocationError(err, id, callback2);
      };
      const complete = (result, callback2) => {
        client.postInvocationResponse(result, id, callback2);
      };
      let waitForEmptyEventLoop = true;
      const callback = function(err, result) {
        BeforeExitListener2.reset();
        if (err !== void 0 && err !== null) {
          postError(err, scheduleNext);
        } else {
          if (!waitForEmptyEventLoop) {
            complete(result, scheduleNext);
          } else {
            BeforeExitListener2.set(() => {
              setImmediate(() => {
                complete(result, scheduleNext);
              });
            });
          }
        }
      };
      const done = (err, result) => {
        BeforeExitListener2.reset();
        if (err !== void 0 && err !== null) {
          postError(err, scheduleNext);
        } else {
          complete(result, scheduleNext);
        }
      };
      const succeed = (result) => {
        done(null, result);
      };
      const fail = (err) => {
        if (err === void 0 || err === null) {
          done("handled");
        } else {
          done(err, null);
        }
      };
      const callbackContext = {
        get callbackWaitsForEmptyEventLoop() {
          return waitForEmptyEventLoop;
        },
        set callbackWaitsForEmptyEventLoop(value) {
          waitForEmptyEventLoop = value;
        },
        succeed,
        fail,
        done
      };
      return [callback, callbackContext];
    }
    function _wrappedCallbackContext(callback, callbackContext) {
      let finished = false;
      const onlyAllowFirstCall = function(toWrap) {
        return function() {
          if (!finished) {
            toWrap.apply(null, arguments);
            finished = true;
          }
        };
      };
      callbackContext.succeed = onlyAllowFirstCall(callbackContext.succeed);
      callbackContext.fail = onlyAllowFirstCall(callbackContext.fail);
      callbackContext.done = onlyAllowFirstCall(callbackContext.done);
      return [onlyAllowFirstCall(callback), callbackContext];
    }
    module.exports.build = function(client, id, scheduleNext) {
      let rawCallbackContext = _rawCallbackContext(client, id, scheduleNext);
      return _wrappedCallbackContext(...rawCallbackContext);
    };
  }
});
var require_StreamingContext = __commonJS({
  "StreamingContext.js"(exports, module) {
    "use strict";
    var BeforeExitListener2 = require_BeforeExitListener();
    var {
      InvalidStreamingOperation,
      toFormatted,
      intoError
    } = require_Errors();
    var { verbose, vverbose } = require_VerboseLog().logger("STREAM");
    module.exports.build = function(client, id, scheduleNext) {
      let waitForEmptyEventLoop = true;
      const scheduleNextNow = () => {
        verbose("StreamingContext::scheduleNextNow entered");
        if (!waitForEmptyEventLoop) {
          scheduleNext();
        } else {
          BeforeExitListener2.set(() => {
            setImmediate(() => {
              scheduleNext();
            });
          });
        }
      };
      let isStreamCreated = false;
      const streamingContext = {
        get callbackWaitsForEmptyEventLoop() {
          return waitForEmptyEventLoop;
        },
        set callbackWaitsForEmptyEventLoop(value) {
          waitForEmptyEventLoop = value;
        },
        createStream: (callback) => {
          if (isStreamCreated) {
            throw new InvalidStreamingOperation("Cannot create stream for the same StreamingContext more than once.");
          }
          const responseStream = client.getStreamForInvocationResponse(id, callback);
          isStreamCreated = true;
          vverbose("StreamingContext::createStream stream created");
          return {
            fail: (err, callback2) => {
              console.error("Invoke Error", toFormatted(intoError(err)));
              responseStream.fail(err, callback2);
            },
            responseStream,
            scheduleNext: () => {
              verbose("StreamingContext::createStream scheduleNext");
              BeforeExitListener2.reset();
              scheduleNextNow();
            }
          };
        }
      };
      return streamingContext;
    };
  }
});
var require_HttpResponseStream = __commonJS({
  "HttpResponseStream.js"(exports, module) {
    "use strict";
    var METADATA_PRELUDE_CONTENT_TYPE = "application/vnd.awslambda.http-integration-response";
    var DELIMITER_LEN = 8;
    var HttpResponseStream = class {
      static from(underlyingStream, prelude) {
        underlyingStream.setContentType(METADATA_PRELUDE_CONTENT_TYPE);
        const metadataPrelude = JSON.stringify(prelude);
        underlyingStream._onBeforeFirstWrite = (write) => {
          write(metadataPrelude);
          write(new Uint8Array(DELIMITER_LEN));
        };
        return underlyingStream;
      }
    };
    module.exports.HttpResponseStream = HttpResponseStream;
  }
});
var require_UserFunction = __commonJS({
  "UserFunction.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var fs = __require("fs");
    var {
      HandlerNotFound,
      MalformedHandlerName,
      ImportModuleError,
      UserCodeSyntaxError
    } = require_Errors();
    var { verbose } = require_VerboseLog().logger("LOADER");
    var { HttpResponseStream } = require_HttpResponseStream();
    var FUNCTION_EXPR = /^([^.]*)\.(.*)$/;
    var RELATIVE_PATH_SUBSTRING = "..";
    var HANDLER_STREAMING = Symbol.for("aws.lambda.runtime.handler.streaming");
    var STREAM_RESPONSE = "response";
    var NoGlobalAwsLambda = process.env["AWS_LAMBDA_NODEJS_NO_GLOBAL_AWSLAMBDA"] === "1" || process.env["AWS_LAMBDA_NODEJS_NO_GLOBAL_AWSLAMBDA"] === "true";
    function _moduleRootAndHandler(fullHandlerString) {
      let handlerString = path.basename(fullHandlerString);
      let moduleRoot = fullHandlerString.substring(0, fullHandlerString.indexOf(handlerString));
      return [moduleRoot, handlerString];
    }
    function _splitHandlerString(handler) {
      let match = handler.match(FUNCTION_EXPR);
      if (!match || match.length != 3) {
        throw new MalformedHandlerName("Bad handler");
      }
      return [match[1], match[2]];
    }
    function _resolveHandler(object, nestedProperty) {
      return nestedProperty.split(".").reduce((nested, key) => {
        return nested && nested[key];
      }, object);
    }
    function _tryRequireFile(file, extension) {
      const path2 = file + (extension || "");
      verbose("Try loading as commonjs:", path2);
      return fs.existsSync(path2) ? __require(path2) : void 0;
    }
    async function _tryAwaitImport(file, extension) {
      const path2 = file + (extension || "");
      verbose("Try loading as esmodule:", path2);
      if (fs.existsSync(path2)) {
        return await import(path2);
      }
      return void 0;
    }
    function _hasFolderPackageJsonTypeModule(folder) {
      if (folder.endsWith("/node_modules")) {
        return false;
      }
      const pj = path.join(folder, "/package.json");
      if (fs.existsSync(pj)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pj));
          if (pkg) {
            if (pkg.type === "module") {
              verbose(`'type: module' detected in ${pj}`);
              return true;
            } else {
              verbose(`'type: module' not detected in ${pj}`);
              return false;
            }
          }
        } catch (e) {
          console.warn(`${pj} cannot be read, it will be ignored for ES module detection purposes.`, e);
          return false;
        }
      }
      if (folder === "/") {
        return false;
      }
      return _hasFolderPackageJsonTypeModule(path.resolve(folder, ".."));
    }
    function _hasPackageJsonTypeModule(file) {
      const jsPath = file + ".js";
      return fs.existsSync(jsPath) ? _hasFolderPackageJsonTypeModule(path.resolve(path.dirname(jsPath))) : false;
    }
    async function _tryRequire(appRoot, moduleRoot, module2) {
      verbose("Try loading as commonjs: ", module2, " with paths: ,", appRoot, moduleRoot);
      const lambdaStylePath = path.resolve(appRoot, moduleRoot, module2);
      const extensionless = _tryRequireFile(lambdaStylePath);
      if (extensionless) {
        return extensionless;
      }
      const pjHasModule = _hasPackageJsonTypeModule(lambdaStylePath);
      if (!pjHasModule) {
        const loaded2 = _tryRequireFile(lambdaStylePath, ".js");
        if (loaded2) {
          return loaded2;
        }
      }
      const loaded = pjHasModule && await _tryAwaitImport(lambdaStylePath, ".js") || await _tryAwaitImport(lambdaStylePath, ".mjs") || _tryRequireFile(lambdaStylePath, ".cjs");
      if (loaded) {
        return loaded;
      }
      verbose("Try loading as commonjs: ", module2, " with path(s): ", appRoot, moduleRoot);
      const nodeStylePath = __require.resolve(module2, {
        paths: [appRoot, moduleRoot]
      });
      return __require(nodeStylePath);
    }
    async function _loadUserApp(appRoot, moduleRoot, module2) {
      if (!NoGlobalAwsLambda) {
        globalThis.awslambda = {
          streamifyResponse: (handler) => {
            handler[HANDLER_STREAMING] = STREAM_RESPONSE;
            return handler;
          },
          HttpResponseStream
        };
      }
      try {
        return await _tryRequire(appRoot, moduleRoot, module2);
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new UserCodeSyntaxError(e);
        } else if (e.code !== void 0 && e.code === "MODULE_NOT_FOUND") {
          verbose("globalPaths", JSON.stringify(__require("module").globalPaths));
          throw new ImportModuleError(e);
        } else {
          throw e;
        }
      }
    }
    function _throwIfInvalidHandler(fullHandlerString) {
      if (fullHandlerString.includes(RELATIVE_PATH_SUBSTRING)) {
        throw new MalformedHandlerName(`'${fullHandlerString}' is not a valid handler name. Use absolute paths when specifying root directories in handler names.`);
      }
    }
    function _isHandlerStreaming(handler) {
      if (typeof handler[HANDLER_STREAMING] === "undefined" || handler[HANDLER_STREAMING] === null || handler[HANDLER_STREAMING] === false) {
        return false;
      }
      if (handler[HANDLER_STREAMING] === STREAM_RESPONSE) {
        return STREAM_RESPONSE;
      } else {
        throw new MalformedStreamingHandler("Only response streaming is supported.");
      }
    }
    module.exports.load = async function(appRoot, fullHandlerString) {
      _throwIfInvalidHandler(fullHandlerString);
      let [moduleRoot, moduleAndHandler] = _moduleRootAndHandler(fullHandlerString);
      let [module2, handlerPath] = _splitHandlerString(moduleAndHandler);
      let userApp = await _loadUserApp(appRoot, moduleRoot, module2);
      let handlerFunc = _resolveHandler(userApp, handlerPath);
      if (!handlerFunc) {
        throw new HandlerNotFound(`${fullHandlerString} is undefined or not exported`);
      }
      if (typeof handlerFunc !== "function") {
        throw new HandlerNotFound(`${fullHandlerString} is not a function`);
      }
      return handlerFunc;
    };
    module.exports.getHandlerMetadata = function(handlerFunc) {
      return {
        streaming: _isHandlerStreaming(handlerFunc)
      };
    };
    module.exports.STREAM_RESPONSE = STREAM_RESPONSE;
  }
});
var require_Runtime = __commonJS({
  "Runtime.js"(exports, module) {
    "use strict";
    var InvokeContext = require_InvokeContext();
    var CallbackContext = require_CallbackContext();
    var StreamingContext = require_StreamingContext();
    var BeforeExitListener2 = require_BeforeExitListener();
    var { STREAM_RESPONSE } = require_UserFunction();
    var { verbose } = require_VerboseLog().logger("RAPID");
    module.exports = class Runtime {
      constructor(client, handler, handlerMetadata, errorCallbacks) {
        this.client = client;
        this.handler = handler;
        this.errorCallbacks = errorCallbacks;
        this.handleOnce = handlerMetadata.streaming === STREAM_RESPONSE ? this.handleOnceStreaming : this.handleOnceNonStreaming;
      }
      scheduleIteration() {
        let that = this;
        setImmediate(() => {
          that.handleOnce().then(() => {
          }, (err) => {
            console.log(`Unexpected Top Level Error: ${err.toString()}`);
            this.errorCallbacks.uncaughtException(err);
          });
        });
      }
      async handleOnceNonStreaming() {
        let { bodyJson, headers } = await this.client.nextInvocation();
        let invokeContext = new InvokeContext(headers);
        invokeContext.updateLoggingContext();
        let [callback, callbackContext] = CallbackContext.build(this.client, invokeContext.invokeId, this.scheduleIteration.bind(this));
        try {
          this._setErrorCallbacks(invokeContext.invokeId);
          this._setDefaultExitListener(invokeContext.invokeId);
          let result = this.handler(JSON.parse(bodyJson), invokeContext.attachEnvironmentData(callbackContext), callback);
          if (_isPromise(result)) {
            result.then(callbackContext.succeed, callbackContext.fail).catch(callbackContext.fail);
          }
        } catch (err) {
          callback(err);
        }
      }
      async handleOnceStreaming() {
        let { bodyJson, headers } = await this.client.nextInvocation();
        let invokeContext = new InvokeContext(headers);
        invokeContext.updateLoggingContext();
        let streamingContext = StreamingContext.build(this.client, invokeContext.invokeId, this.scheduleIteration.bind(this));
        const {
          responseStream,
          scheduleNext,
          fail: ctxFail
        } = streamingContext.createStream();
        delete streamingContext.createStream;
        try {
          this._setErrorCallbacks(invokeContext.invokeId);
          this._setStreamingExitListener(invokeContext.invokeId, responseStream);
          const ctx = invokeContext.attachEnvironmentData(streamingContext);
          verbose("Runtime::handleOnceStreaming", "invoking handler");
          const event = JSON.parse(bodyJson);
          const handlerResult = this.handler(event, responseStream, ctx);
          verbose("Runtime::handleOnceStreaming", "handler returned");
          responseStream.on("data", (res) => {
            verbose("Response from RAPID", res);
          });
          if (!_isPromise(handlerResult)) {
            verbose("Runtime got non-promise response");
            ctxFail("Streaming does not support non-async handlers.", scheduleNext);
            return;
          }
          const result = await handlerResult;
          if (typeof result !== "undefined") {
            console.warn("Streaming handlers ignore return values.");
          }
          verbose("Runtime::handleOnceStreaming result is awaited.");
          if (!responseStream.isEnded()) {
            ctxFail("Response stream not closed.", scheduleNext);
            return;
          }
          scheduleNext();
        } catch (err) {
          ctxFail(err, scheduleNext);
        } finally {
          responseStream.destroy();
          verbose("Runtime::handleOnceStreaming::finally stream destroyed");
        }
      }
      _setErrorCallbacks(invokeId) {
        this.errorCallbacks.uncaughtException = (error) => {
          this.client.postInvocationError(error, invokeId, () => {
            process.exit(129);
          });
        };
        this.errorCallbacks.unhandledRejection = (error) => {
          this.client.postInvocationError(error, invokeId, () => {
            process.exit(128);
          });
        };
      }
      _setDefaultExitListener(invokeId) {
        BeforeExitListener2.set(() => {
          this.client.postInvocationResponse(null, invokeId, () => this.scheduleIteration());
        });
      }
      _setStreamingExitListener(_invokeId) {
        BeforeExitListener2.set(() => {
          this.scheduleIteration();
        });
      }
    };
    function _isPromise(obj) {
      return obj && obj.then && typeof obj.then === "function";
    }
  }
});
var RAPIDClient = require_RAPIDClient();
var Runtime = require_Runtime();
var UserFunction = require_UserFunction();
var Errors = require_Errors();
var BeforeExitListener = require_BeforeExitListener();
var LogPatch = require_LogPatch();
async function start() {
  LogPatch.patchConsole();
  const client = new RAPIDClient(process.env.AWS_LAMBDA_RUNTIME_API);
  let errorCallbacks = {
    uncaughtException: (error) => {
      client.postInitError(error, () => process.exit(129));
    },
    unhandledRejection: (error) => {
      client.postInitError(error, () => process.exit(128));
    }
  };
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception", Errors.toFormatted(error));
    errorCallbacks.uncaughtException(error);
  });
  process.on("unhandledRejection", (reason, promise) => {
    let error = new Errors.UnhandledPromiseRejection(reason, promise);
    console.error("Unhandled Promise Rejection", Errors.toFormatted(error));
    errorCallbacks.unhandledRejection(error);
  });
  BeforeExitListener.reset();
  process.on("beforeExit", BeforeExitListener.invoke);
  const handlerFunc = await UserFunction.load(process.env.LAMBDA_TASK_ROOT, process.env._HANDLER);
  const metadata = UserFunction.getHandlerMetadata(handlerFunc);
  new Runtime(client, handlerFunc, metadata, errorCallbacks).scheduleIteration();
}

// src/index.mjs
await start();
