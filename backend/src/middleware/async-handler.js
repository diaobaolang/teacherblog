// async-handler.js
// Express 4 不会自动捕获 async 路由处理函数中抛出的异常：
// 一旦某个 async handler 抛错，Promise 无人处理，请求会一直悬挂，
// 并触发 unhandledRejection 直接结束 Node 进程（表现为「所有接口都请求失败」）。
// 这里给 Router 的注册方法统一包一层，把 async 异常转交 next(err)，
// 由 error-handler 中间件统一返回 500，避免单个请求打挂整个服务。
const express = require('express');

const routerProto = Object.getPrototypeOf(express.Router());
const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all', 'use'];
const FLAG = '__teacherblogAsyncWrapped';

function wrapHandler(handler) {
  if (typeof handler !== 'function') return handler;
  // 4 个参数为错误处理中间件，不包装
  if (handler.length >= 4) return handler;
  // 只包装 async 函数，避免影响普通同步中间件
  const isAsync = handler.constructor && handler.constructor.name === 'AsyncFunction';
  if (!isAsync) return handler;

  return function asyncHandlerWrapper(req, res, next) {
    Promise.resolve(handler.call(this, req, res, next)).catch(next);
  };
}

function wrapArg(arg) {
  return Array.isArray(arg) ? arg.map(wrapHandler) : wrapHandler(arg);
}

for (const method of METHODS) {
  const original = routerProto[method];
  if (typeof original !== 'function' || original[FLAG]) continue;

  const patched = function (...args) {
    return original.apply(this, args.map(wrapArg));
  };
  patched[FLAG] = true;
  routerProto[method] = patched;
}

module.exports = {};
