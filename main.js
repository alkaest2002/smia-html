(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // node_modules/alpinejs/dist/module.esm.js
  var flushPending = false;
  var flushing = false;
  var queue = [];
  var lastFlushedIndex = -1;
  function scheduler(callback) {
    queueJob(callback);
  }
  function queueJob(job) {
    if (!queue.includes(job))
      queue.push(job);
    queueFlush();
  }
  function dequeueJob(job) {
    let index = queue.indexOf(job);
    if (index !== -1 && index > lastFlushedIndex)
      queue.splice(index, 1);
  }
  function queueFlush() {
    if (!flushing && !flushPending) {
      flushPending = true;
      queueMicrotask(flushJobs);
    }
  }
  function flushJobs() {
    flushPending = false;
    flushing = true;
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
      lastFlushedIndex = i;
    }
    queue.length = 0;
    lastFlushedIndex = -1;
    flushing = false;
  }
  var reactive;
  var effect;
  var release;
  var raw;
  var shouldSchedule = true;
  function disableEffectScheduling(callback) {
    shouldSchedule = false;
    callback();
    shouldSchedule = true;
  }
  function setReactivityEngine(engine) {
    reactive = engine.reactive;
    release = engine.release;
    effect = (callback) => engine.effect(callback, { scheduler: (task) => {
      if (shouldSchedule) {
        scheduler(task);
      } else {
        task();
      }
    } });
    raw = engine.raw;
  }
  function overrideEffect(override) {
    effect = override;
  }
  function elementBoundEffect(el) {
    let cleanup2 = () => {
    };
    let wrappedEffect = (callback) => {
      let effectReference = effect(callback);
      if (!el._x_effects) {
        el._x_effects = /* @__PURE__ */ new Set();
        el._x_runEffects = () => {
          el._x_effects.forEach((i) => i());
        };
      }
      el._x_effects.add(effectReference);
      cleanup2 = () => {
        if (effectReference === void 0)
          return;
        el._x_effects.delete(effectReference);
        release(effectReference);
      };
      return effectReference;
    };
    return [wrappedEffect, () => {
      cleanup2();
    }];
  }
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        // Allows events to pass the shadow DOM barrier.
        composed: true,
        cancelable: true
      })
    );
  }
  function walk(el, callback) {
    if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
      Array.from(el.children).forEach((el2) => walk(el2, callback));
      return;
    }
    let skip = false;
    callback(el, () => skip = true);
    if (skip)
      return;
    let node = el.firstElementChild;
    while (node) {
      walk(node, callback, false);
      node = node.nextElementSibling;
    }
  }
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }
  var started = false;
  function start() {
    if (started)
      warn("Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems.");
    started = true;
    if (!document.body)
      warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
    dispatch(document, "alpine:init");
    dispatch(document, "alpine:initializing");
    startObservingMutations();
    onElAdded((el) => initTree(el, walk));
    onElRemoved((el) => destroyTree(el));
    onAttributesAdded((el, attrs) => {
      directives(el, attrs).forEach((handle) => handle());
    });
    let outNestedComponents = (el) => !closestRoot(el.parentElement, true);
    Array.from(document.querySelectorAll(allSelectors().join(","))).filter(outNestedComponents).forEach((el) => {
      initTree(el);
    });
    dispatch(document, "alpine:initialized");
  }
  var rootSelectorCallbacks = [];
  var initSelectorCallbacks = [];
  function rootSelectors() {
    return rootSelectorCallbacks.map((fn) => fn());
  }
  function allSelectors() {
    return rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn) => fn());
  }
  function addRootSelector(selectorCallback) {
    rootSelectorCallbacks.push(selectorCallback);
  }
  function addInitSelector(selectorCallback) {
    initSelectorCallbacks.push(selectorCallback);
  }
  function closestRoot(el, includeInitSelectors = false) {
    return findClosest(el, (element) => {
      const selectors = includeInitSelectors ? allSelectors() : rootSelectors();
      if (selectors.some((selector) => element.matches(selector)))
        return true;
    });
  }
  function findClosest(el, callback) {
    if (!el)
      return;
    if (callback(el))
      return el;
    if (el._x_teleportBack)
      el = el._x_teleportBack;
    if (!el.parentElement)
      return;
    return findClosest(el.parentElement, callback);
  }
  function isRoot(el) {
    return rootSelectors().some((selector) => el.matches(selector));
  }
  var initInterceptors = [];
  function interceptInit(callback) {
    initInterceptors.push(callback);
  }
  function initTree(el, walker = walk, intercept = () => {
  }) {
    deferHandlingDirectives(() => {
      walker(el, (el2, skip) => {
        intercept(el2, skip);
        initInterceptors.forEach((i) => i(el2, skip));
        directives(el2, el2.attributes).forEach((handle) => handle());
        el2._x_ignore && skip();
      });
    });
  }
  function destroyTree(root) {
    walk(root, (el) => {
      cleanupAttributes(el);
      cleanupElement(el);
    });
  }
  var onAttributeAddeds = [];
  var onElRemoveds = [];
  var onElAddeds = [];
  function onElAdded(callback) {
    onElAddeds.push(callback);
  }
  function onElRemoved(el, callback) {
    if (typeof callback === "function") {
      if (!el._x_cleanups)
        el._x_cleanups = [];
      el._x_cleanups.push(callback);
    } else {
      callback = el;
      onElRemoveds.push(callback);
    }
  }
  function onAttributesAdded(callback) {
    onAttributeAddeds.push(callback);
  }
  function onAttributeRemoved(el, name, callback) {
    if (!el._x_attributeCleanups)
      el._x_attributeCleanups = {};
    if (!el._x_attributeCleanups[name])
      el._x_attributeCleanups[name] = [];
    el._x_attributeCleanups[name].push(callback);
  }
  function cleanupAttributes(el, names) {
    if (!el._x_attributeCleanups)
      return;
    Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
      if (names === void 0 || names.includes(name)) {
        value.forEach((i) => i());
        delete el._x_attributeCleanups[name];
      }
    });
  }
  function cleanupElement(el) {
    if (el._x_cleanups) {
      while (el._x_cleanups.length)
        el._x_cleanups.pop()();
    }
  }
  var observer = new MutationObserver(onMutate);
  var currentlyObserving = false;
  function startObservingMutations() {
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
    currentlyObserving = true;
  }
  function stopObservingMutations() {
    flushObserver();
    observer.disconnect();
    currentlyObserving = false;
  }
  var recordQueue = [];
  var willProcessRecordQueue = false;
  function flushObserver() {
    recordQueue = recordQueue.concat(observer.takeRecords());
    if (recordQueue.length && !willProcessRecordQueue) {
      willProcessRecordQueue = true;
      queueMicrotask(() => {
        processRecordQueue();
        willProcessRecordQueue = false;
      });
    }
  }
  function processRecordQueue() {
    onMutate(recordQueue);
    recordQueue.length = 0;
  }
  function mutateDom(callback) {
    if (!currentlyObserving)
      return callback();
    stopObservingMutations();
    let result = callback();
    startObservingMutations();
    return result;
  }
  var isCollecting = false;
  var deferredMutations = [];
  function deferMutations() {
    isCollecting = true;
  }
  function flushAndStopDeferringMutations() {
    isCollecting = false;
    onMutate(deferredMutations);
    deferredMutations = [];
  }
  function onMutate(mutations) {
    if (isCollecting) {
      deferredMutations = deferredMutations.concat(mutations);
      return;
    }
    let addedNodes = [];
    let removedNodes = [];
    let addedAttributes = /* @__PURE__ */ new Map();
    let removedAttributes = /* @__PURE__ */ new Map();
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].target._x_ignoreMutationObserver)
        continue;
      if (mutations[i].type === "childList") {
        mutations[i].addedNodes.forEach((node) => node.nodeType === 1 && addedNodes.push(node));
        mutations[i].removedNodes.forEach((node) => node.nodeType === 1 && removedNodes.push(node));
      }
      if (mutations[i].type === "attributes") {
        let el = mutations[i].target;
        let name = mutations[i].attributeName;
        let oldValue = mutations[i].oldValue;
        let add2 = () => {
          if (!addedAttributes.has(el))
            addedAttributes.set(el, []);
          addedAttributes.get(el).push({ name, value: el.getAttribute(name) });
        };
        let remove = () => {
          if (!removedAttributes.has(el))
            removedAttributes.set(el, []);
          removedAttributes.get(el).push(name);
        };
        if (el.hasAttribute(name) && oldValue === null) {
          add2();
        } else if (el.hasAttribute(name)) {
          remove();
          add2();
        } else {
          remove();
        }
      }
    }
    removedAttributes.forEach((attrs, el) => {
      cleanupAttributes(el, attrs);
    });
    addedAttributes.forEach((attrs, el) => {
      onAttributeAddeds.forEach((i) => i(el, attrs));
    });
    for (let node of removedNodes) {
      if (addedNodes.includes(node))
        continue;
      onElRemoveds.forEach((i) => i(node));
      destroyTree(node);
    }
    addedNodes.forEach((node) => {
      node._x_ignoreSelf = true;
      node._x_ignore = true;
    });
    for (let node of addedNodes) {
      if (removedNodes.includes(node))
        continue;
      if (!node.isConnected)
        continue;
      delete node._x_ignoreSelf;
      delete node._x_ignore;
      onElAddeds.forEach((i) => i(node));
      node._x_ignore = true;
      node._x_ignoreSelf = true;
    }
    addedNodes.forEach((node) => {
      delete node._x_ignoreSelf;
      delete node._x_ignore;
    });
    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
  }
  function scope(node) {
    return mergeProxies(closestDataStack(node));
  }
  function addScopeToNode(node, data2, referenceNode) {
    node._x_dataStack = [data2, ...closestDataStack(referenceNode || node)];
    return () => {
      node._x_dataStack = node._x_dataStack.filter((i) => i !== data2);
    };
  }
  function closestDataStack(node) {
    if (node._x_dataStack)
      return node._x_dataStack;
    if (typeof ShadowRoot === "function" && node instanceof ShadowRoot) {
      return closestDataStack(node.host);
    }
    if (!node.parentNode) {
      return [];
    }
    return closestDataStack(node.parentNode);
  }
  function mergeProxies(objects) {
    return new Proxy({ objects }, mergeProxyTrap);
  }
  var mergeProxyTrap = {
    ownKeys({ objects }) {
      return Array.from(
        new Set(objects.flatMap((i) => Object.keys(i)))
      );
    },
    has({ objects }, name) {
      if (name == Symbol.unscopables)
        return false;
      return objects.some(
        (obj) => Object.prototype.hasOwnProperty.call(obj, name)
      );
    },
    get({ objects }, name, thisProxy) {
      if (name == "toJSON")
        return collapseProxies;
      return Reflect.get(
        objects.find(
          (obj) => Object.prototype.hasOwnProperty.call(obj, name)
        ) || {},
        name,
        thisProxy
      );
    },
    set({ objects }, name, value, thisProxy) {
      const target = objects.find(
        (obj) => Object.prototype.hasOwnProperty.call(obj, name)
      ) || objects[objects.length - 1];
      const descriptor = Object.getOwnPropertyDescriptor(target, name);
      if ((descriptor == null ? void 0 : descriptor.set) && (descriptor == null ? void 0 : descriptor.get))
        return Reflect.set(target, name, value, thisProxy);
      return Reflect.set(target, name, value);
    }
  };
  function collapseProxies() {
    let keys = Reflect.ownKeys(this);
    return keys.reduce((acc, key) => {
      acc[key] = Reflect.get(this, key);
      return acc;
    }, {});
  }
  function initInterceptors2(data2) {
    let isObject2 = (val) => typeof val === "object" && !Array.isArray(val) && val !== null;
    let recurse = (obj, basePath = "") => {
      Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, { value, enumerable }]) => {
        if (enumerable === false || value === void 0)
          return;
        let path = basePath === "" ? key : `${basePath}.${key}`;
        if (typeof value === "object" && value !== null && value._x_interceptor) {
          obj[key] = value.initialize(data2, path, key);
        } else {
          if (isObject2(value) && value !== obj && !(value instanceof Element)) {
            recurse(value, path);
          }
        }
      });
    };
    return recurse(data2);
  }
  function interceptor(callback, mutateObj = () => {
  }) {
    let obj = {
      initialValue: void 0,
      _x_interceptor: true,
      initialize(data2, path, key) {
        return callback(this.initialValue, () => get(data2, path), (value) => set(data2, path, value), path, key);
      }
    };
    mutateObj(obj);
    return (initialValue) => {
      if (typeof initialValue === "object" && initialValue !== null && initialValue._x_interceptor) {
        let initialize = obj.initialize.bind(obj);
        obj.initialize = (data2, path, key) => {
          let innerValue = initialValue.initialize(data2, path, key);
          obj.initialValue = innerValue;
          return initialize(data2, path, key);
        };
      } else {
        obj.initialValue = initialValue;
      }
      return obj;
    };
  }
  function get(obj, path) {
    return path.split(".").reduce((carry, segment) => carry[segment], obj);
  }
  function set(obj, path, value) {
    if (typeof path === "string")
      path = path.split(".");
    if (path.length === 1)
      obj[path[0]] = value;
    else if (path.length === 0)
      throw error;
    else {
      if (obj[path[0]])
        return set(obj[path[0]], path.slice(1), value);
      else {
        obj[path[0]] = {};
        return set(obj[path[0]], path.slice(1), value);
      }
    }
  }
  var magics = {};
  function magic(name, callback) {
    magics[name] = callback;
  }
  function injectMagics(obj, el) {
    Object.entries(magics).forEach(([name, callback]) => {
      let memoizedUtilities = null;
      function getUtilities() {
        if (memoizedUtilities) {
          return memoizedUtilities;
        } else {
          let [utilities, cleanup2] = getElementBoundUtilities(el);
          memoizedUtilities = __spreadValues({ interceptor }, utilities);
          onElRemoved(el, cleanup2);
          return memoizedUtilities;
        }
      }
      Object.defineProperty(obj, `$${name}`, {
        get() {
          return callback(el, getUtilities());
        },
        enumerable: false
      });
    });
    return obj;
  }
  function tryCatch(el, expression, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      handleError(e, el, expression);
    }
  }
  function handleError(error2, el, expression = void 0) {
    Object.assign(error2, { el, expression });
    console.warn(`Alpine Expression Error: ${error2.message}

${expression ? 'Expression: "' + expression + '"\n\n' : ""}`, el);
    setTimeout(() => {
      throw error2;
    }, 0);
  }
  var shouldAutoEvaluateFunctions = true;
  function dontAutoEvaluateFunctions(callback) {
    let cache = shouldAutoEvaluateFunctions;
    shouldAutoEvaluateFunctions = false;
    let result = callback();
    shouldAutoEvaluateFunctions = cache;
    return result;
  }
  function evaluate(el, expression, extras = {}) {
    let result;
    evaluateLater(el, expression)((value) => result = value, extras);
    return result;
  }
  function evaluateLater(...args) {
    return theEvaluatorFunction(...args);
  }
  var theEvaluatorFunction = normalEvaluator;
  function setEvaluator(newEvaluator) {
    theEvaluatorFunction = newEvaluator;
  }
  function normalEvaluator(el, expression) {
    let overriddenMagics = {};
    injectMagics(overriddenMagics, el);
    let dataStack = [overriddenMagics, ...closestDataStack(el)];
    let evaluator = typeof expression === "function" ? generateEvaluatorFromFunction(dataStack, expression) : generateEvaluatorFromString(dataStack, expression, el);
    return tryCatch.bind(null, el, expression, evaluator);
  }
  function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {
    }, { scope: scope2 = {}, params = [] } = {}) => {
      let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
      runIfTypeOfFunction(receiver, result);
    };
  }
  var evaluatorMemo = {};
  function generateFunctionFromString(expression, el) {
    if (evaluatorMemo[expression]) {
      return evaluatorMemo[expression];
    }
    let AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression.trim()) || /^(let|const)\s/.test(expression.trim()) ? `(async()=>{ ${expression} })()` : expression;
    const safeAsyncFunction = () => {
      try {
        let func2 = new AsyncFunction(
          ["__self", "scope"],
          `with (scope) { __self.result = ${rightSideSafeExpression} }; __self.finished = true; return __self.result;`
        );
        Object.defineProperty(func2, "name", {
          value: `[Alpine] ${expression}`
        });
        return func2;
      } catch (error2) {
        handleError(error2, el, expression);
        return Promise.resolve();
      }
    };
    let func = safeAsyncFunction();
    evaluatorMemo[expression] = func;
    return func;
  }
  function generateEvaluatorFromString(dataStack, expression, el) {
    let func = generateFunctionFromString(expression, el);
    return (receiver = () => {
    }, { scope: scope2 = {}, params = [] } = {}) => {
      func.result = void 0;
      func.finished = false;
      let completeScope = mergeProxies([scope2, ...dataStack]);
      if (typeof func === "function") {
        let promise = func(func, completeScope).catch((error2) => handleError(error2, el, expression));
        if (func.finished) {
          runIfTypeOfFunction(receiver, func.result, completeScope, params, el);
          func.result = void 0;
        } else {
          promise.then((result) => {
            runIfTypeOfFunction(receiver, result, completeScope, params, el);
          }).catch((error2) => handleError(error2, el, expression)).finally(() => func.result = void 0);
        }
      }
    };
  }
  function runIfTypeOfFunction(receiver, value, scope2, params, el) {
    if (shouldAutoEvaluateFunctions && typeof value === "function") {
      let result = value.apply(scope2, params);
      if (result instanceof Promise) {
        result.then((i) => runIfTypeOfFunction(receiver, i, scope2, params)).catch((error2) => handleError(error2, el, value));
      } else {
        receiver(result);
      }
    } else if (typeof value === "object" && value instanceof Promise) {
      value.then((i) => receiver(i));
    } else {
      receiver(value);
    }
  }
  var prefixAsString = "x-";
  function prefix(subject = "") {
    return prefixAsString + subject;
  }
  function setPrefix(newPrefix) {
    prefixAsString = newPrefix;
  }
  var directiveHandlers = {};
  function directive(name, callback) {
    directiveHandlers[name] = callback;
    return {
      before(directive2) {
        if (!directiveHandlers[directive2]) {
          console.warn(
            "Cannot find directive `${directive}`. `${name}` will use the default order of execution"
          );
          return;
        }
        const pos = directiveOrder.indexOf(directive2);
        directiveOrder.splice(pos >= 0 ? pos : directiveOrder.indexOf("DEFAULT"), 0, name);
      }
    };
  }
  function directives(el, attributes, originalAttributeOverride) {
    attributes = Array.from(attributes);
    if (el._x_virtualDirectives) {
      let vAttributes = Object.entries(el._x_virtualDirectives).map(([name, value]) => ({ name, value }));
      let staticAttributes = attributesOnly(vAttributes);
      vAttributes = vAttributes.map((attribute) => {
        if (staticAttributes.find((attr) => attr.name === attribute.name)) {
          return {
            name: `x-bind:${attribute.name}`,
            value: `"${attribute.value}"`
          };
        }
        return attribute;
      });
      attributes = attributes.concat(vAttributes);
    }
    let transformedAttributeMap = {};
    let directives2 = attributes.map(toTransformedAttributes((newName, oldName) => transformedAttributeMap[newName] = oldName)).filter(outNonAlpineAttributes).map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride)).sort(byPriority);
    return directives2.map((directive2) => {
      return getDirectiveHandler(el, directive2);
    });
  }
  function attributesOnly(attributes) {
    return Array.from(attributes).map(toTransformedAttributes()).filter((attr) => !outNonAlpineAttributes(attr));
  }
  var isDeferringHandlers = false;
  var directiveHandlerStacks = /* @__PURE__ */ new Map();
  var currentHandlerStackKey = Symbol();
  function deferHandlingDirectives(callback) {
    isDeferringHandlers = true;
    let key = Symbol();
    currentHandlerStackKey = key;
    directiveHandlerStacks.set(key, []);
    let flushHandlers = () => {
      while (directiveHandlerStacks.get(key).length)
        directiveHandlerStacks.get(key).shift()();
      directiveHandlerStacks.delete(key);
    };
    let stopDeferring = () => {
      isDeferringHandlers = false;
      flushHandlers();
    };
    callback(flushHandlers);
    stopDeferring();
  }
  function getElementBoundUtilities(el) {
    let cleanups = [];
    let cleanup2 = (callback) => cleanups.push(callback);
    let [effect3, cleanupEffect] = elementBoundEffect(el);
    cleanups.push(cleanupEffect);
    let utilities = {
      Alpine: alpine_default,
      effect: effect3,
      cleanup: cleanup2,
      evaluateLater: evaluateLater.bind(evaluateLater, el),
      evaluate: evaluate.bind(evaluate, el)
    };
    let doCleanup = () => cleanups.forEach((i) => i());
    return [utilities, doCleanup];
  }
  function getDirectiveHandler(el, directive2) {
    let noop = () => {
    };
    let handler4 = directiveHandlers[directive2.type] || noop;
    let [utilities, cleanup2] = getElementBoundUtilities(el);
    onAttributeRemoved(el, directive2.original, cleanup2);
    let fullHandler = () => {
      if (el._x_ignore || el._x_ignoreSelf)
        return;
      handler4.inline && handler4.inline(el, directive2, utilities);
      handler4 = handler4.bind(handler4, el, directive2, utilities);
      isDeferringHandlers ? directiveHandlerStacks.get(currentHandlerStackKey).push(handler4) : handler4();
    };
    fullHandler.runCleanups = cleanup2;
    return fullHandler;
  }
  var startingWith = (subject, replacement) => ({ name, value }) => {
    if (name.startsWith(subject))
      name = name.replace(subject, replacement);
    return { name, value };
  };
  var into = (i) => i;
  function toTransformedAttributes(callback = () => {
  }) {
    return ({ name, value }) => {
      let { name: newName, value: newValue } = attributeTransformers.reduce((carry, transform) => {
        return transform(carry);
      }, { name, value });
      if (newName !== name)
        callback(newName, name);
      return { name: newName, value: newValue };
    };
  }
  var attributeTransformers = [];
  function mapAttributes(callback) {
    attributeTransformers.push(callback);
  }
  function outNonAlpineAttributes({ name }) {
    return alpineAttributeRegex().test(name);
  }
  var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
  function toParsedDirectives(transformedAttributeMap, originalAttributeOverride) {
    return ({ name, value }) => {
      let typeMatch = name.match(alpineAttributeRegex());
      let valueMatch = name.match(/:([a-zA-Z0-9\-_:]+)/);
      let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
      let original = originalAttributeOverride || transformedAttributeMap[name] || name;
      return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map((i) => i.replace(".", "")),
        expression: value,
        original
      };
    };
  }
  var DEFAULT = "DEFAULT";
  var directiveOrder = [
    "ignore",
    "ref",
    "data",
    "id",
    "anchor",
    "bind",
    "init",
    "for",
    "model",
    "modelable",
    "transition",
    "show",
    "if",
    DEFAULT,
    "teleport"
  ];
  function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
    let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
  }
  var tickStack = [];
  var isHolding = false;
  function nextTick(callback = () => {
  }) {
    queueMicrotask(() => {
      isHolding || setTimeout(() => {
        releaseNextTicks();
      });
    });
    return new Promise((res) => {
      tickStack.push(() => {
        callback();
        res();
      });
    });
  }
  function releaseNextTicks() {
    isHolding = false;
    while (tickStack.length)
      tickStack.shift()();
  }
  function holdNextTicks() {
    isHolding = true;
  }
  function setClasses(el, value) {
    if (Array.isArray(value)) {
      return setClassesFromString(el, value.join(" "));
    } else if (typeof value === "object" && value !== null) {
      return setClassesFromObject(el, value);
    } else if (typeof value === "function") {
      return setClasses(el, value());
    }
    return setClassesFromString(el, value);
  }
  function setClassesFromString(el, classString) {
    let split = (classString2) => classString2.split(" ").filter(Boolean);
    let missingClasses = (classString2) => classString2.split(" ").filter((i) => !el.classList.contains(i)).filter(Boolean);
    let addClassesAndReturnUndo = (classes) => {
      el.classList.add(...classes);
      return () => {
        el.classList.remove(...classes);
      };
    };
    classString = classString === true ? classString = "" : classString || "";
    return addClassesAndReturnUndo(missingClasses(classString));
  }
  function setClassesFromObject(el, classObject) {
    let split = (classString) => classString.split(" ").filter(Boolean);
    let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
    let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
    let added = [];
    let removed = [];
    forRemove.forEach((i) => {
      if (el.classList.contains(i)) {
        el.classList.remove(i);
        removed.push(i);
      }
    });
    forAdd.forEach((i) => {
      if (!el.classList.contains(i)) {
        el.classList.add(i);
        added.push(i);
      }
    });
    return () => {
      removed.forEach((i) => el.classList.add(i));
      added.forEach((i) => el.classList.remove(i));
    };
  }
  function setStyles(el, value) {
    if (typeof value === "object" && value !== null) {
      return setStylesFromObject(el, value);
    }
    return setStylesFromString(el, value);
  }
  function setStylesFromObject(el, value) {
    let previousStyles = {};
    Object.entries(value).forEach(([key, value2]) => {
      previousStyles[key] = el.style[key];
      if (!key.startsWith("--")) {
        key = kebabCase(key);
      }
      el.style.setProperty(key, value2);
    });
    setTimeout(() => {
      if (el.style.length === 0) {
        el.removeAttribute("style");
      }
    });
    return () => {
      setStyles(el, previousStyles);
    };
  }
  function setStylesFromString(el, value) {
    let cache = el.getAttribute("style", value);
    el.setAttribute("style", value);
    return () => {
      el.setAttribute("style", cache || "");
    };
  }
  function kebabCase(subject) {
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  function once(callback, fallback = () => {
  }) {
    let called = false;
    return function() {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      } else {
        fallback.apply(this, arguments);
      }
    };
  }
  directive("transition", (el, { value, modifiers, expression }, { evaluate: evaluate2 }) => {
    if (typeof expression === "function")
      expression = evaluate2(expression);
    if (expression === false)
      return;
    if (!expression || typeof expression === "boolean") {
      registerTransitionsFromHelper(el, modifiers, value);
    } else {
      registerTransitionsFromClassString(el, expression, value);
    }
  });
  function registerTransitionsFromClassString(el, classString, stage) {
    registerTransitionObject(el, setClasses, "");
    let directiveStorageMap = {
      "enter": (classes) => {
        el._x_transition.enter.during = classes;
      },
      "enter-start": (classes) => {
        el._x_transition.enter.start = classes;
      },
      "enter-end": (classes) => {
        el._x_transition.enter.end = classes;
      },
      "leave": (classes) => {
        el._x_transition.leave.during = classes;
      },
      "leave-start": (classes) => {
        el._x_transition.leave.start = classes;
      },
      "leave-end": (classes) => {
        el._x_transition.leave.end = classes;
      }
    };
    directiveStorageMap[stage](classString);
  }
  function registerTransitionsFromHelper(el, modifiers, stage) {
    registerTransitionObject(el, setStyles);
    let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
    let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
    let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
    if (modifiers.includes("in") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
    }
    let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
    let wantsOpacity = wantsAll || modifiers.includes("opacity");
    let wantsScale = wantsAll || modifiers.includes("scale");
    let opacityValue = wantsOpacity ? 0 : 1;
    let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
    let delay = modifierValue(modifiers, "delay", 0) / 1e3;
    let origin = modifierValue(modifiers, "origin", "center");
    let property = "opacity, transform";
    let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
    let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
    let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
    if (transitioningIn) {
      el._x_transition.enter.during = {
        transformOrigin: origin,
        transitionDelay: `${delay}s`,
        transitionProperty: property,
        transitionDuration: `${durationIn}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.enter.start = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
      el._x_transition.enter.end = {
        opacity: 1,
        transform: `scale(1)`
      };
    }
    if (transitioningOut) {
      el._x_transition.leave.during = {
        transformOrigin: origin,
        transitionDelay: `${delay}s`,
        transitionProperty: property,
        transitionDuration: `${durationOut}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.leave.start = {
        opacity: 1,
        transform: `scale(1)`
      };
      el._x_transition.leave.end = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
    }
  }
  function registerTransitionObject(el, setFunction, defaultValue = {}) {
    if (!el._x_transition)
      el._x_transition = {
        enter: { during: defaultValue, start: defaultValue, end: defaultValue },
        leave: { during: defaultValue, start: defaultValue, end: defaultValue },
        in(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },
        out(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }
      };
  }
  window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide) {
    const nextTick2 = document.visibilityState === "visible" ? requestAnimationFrame : setTimeout;
    let clickAwayCompatibleShow = () => nextTick2(show);
    if (value) {
      if (el._x_transition && (el._x_transition.enter || el._x_transition.leave)) {
        el._x_transition.enter && (Object.entries(el._x_transition.enter.during).length || Object.entries(el._x_transition.enter.start).length || Object.entries(el._x_transition.enter.end).length) ? el._x_transition.in(show) : clickAwayCompatibleShow();
      } else {
        el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
      }
      return;
    }
    el._x_hidePromise = el._x_transition ? new Promise((resolve, reject) => {
      el._x_transition.out(() => {
      }, () => resolve(hide));
      el._x_transitioning && el._x_transitioning.beforeCancel(() => reject({ isFromCancelledTransition: true }));
    }) : Promise.resolve(hide);
    queueMicrotask(() => {
      let closest = closestHide(el);
      if (closest) {
        if (!closest._x_hideChildren)
          closest._x_hideChildren = [];
        closest._x_hideChildren.push(el);
      } else {
        nextTick2(() => {
          let hideAfterChildren = (el2) => {
            let carry = Promise.all([
              el2._x_hidePromise,
              ...(el2._x_hideChildren || []).map(hideAfterChildren)
            ]).then(([i]) => i());
            delete el2._x_hidePromise;
            delete el2._x_hideChildren;
            return carry;
          };
          hideAfterChildren(el).catch((e) => {
            if (!e.isFromCancelledTransition)
              throw e;
          });
        });
      }
    });
  };
  function closestHide(el) {
    let parent = el.parentNode;
    if (!parent)
      return;
    return parent._x_hidePromise ? parent : closestHide(parent);
  }
  function transition(el, setFunction, { during, start: start2, end } = {}, before = () => {
  }, after = () => {
  }) {
    if (el._x_transitioning)
      el._x_transitioning.cancel();
    if (Object.keys(during).length === 0 && Object.keys(start2).length === 0 && Object.keys(end).length === 0) {
      before();
      after();
      return;
    }
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setFunction(el, start2);
      },
      during() {
        undoDuring = setFunction(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setFunction(el, end);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      }
    });
  }
  function performTransition(el, stages) {
    let interrupted, reachedBefore, reachedEnd;
    let finish = once(() => {
      mutateDom(() => {
        interrupted = true;
        if (!reachedBefore)
          stages.before();
        if (!reachedEnd) {
          stages.end();
          releaseNextTicks();
        }
        stages.after();
        if (el.isConnected)
          stages.cleanup();
        delete el._x_transitioning;
      });
    });
    el._x_transitioning = {
      beforeCancels: [],
      beforeCancel(callback) {
        this.beforeCancels.push(callback);
      },
      cancel: once(function() {
        while (this.beforeCancels.length) {
          this.beforeCancels.shift()();
        }
        ;
        finish();
      }),
      finish
    };
    mutateDom(() => {
      stages.start();
      stages.during();
    });
    holdNextTicks();
    requestAnimationFrame(() => {
      if (interrupted)
        return;
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
      let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
      if (duration === 0)
        duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
      mutateDom(() => {
        stages.before();
      });
      reachedBefore = true;
      requestAnimationFrame(() => {
        if (interrupted)
          return;
        mutateDom(() => {
          stages.end();
        });
        releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration + delay);
        reachedEnd = true;
      });
    });
  }
  function modifierValue(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue)
      return fallback;
    if (key === "scale") {
      if (isNaN(rawValue))
        return fallback;
    }
    if (key === "duration" || key === "delay") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match)
        return match[1];
    }
    if (key === "origin") {
      if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
        return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
      }
    }
    return rawValue;
  }
  var isCloning = false;
  function skipDuringClone(callback, fallback = () => {
  }) {
    return (...args) => isCloning ? fallback(...args) : callback(...args);
  }
  function onlyDuringClone(callback) {
    return (...args) => isCloning && callback(...args);
  }
  var interceptors = [];
  function interceptClone(callback) {
    interceptors.push(callback);
  }
  function cloneNode(from, to) {
    interceptors.forEach((i) => i(from, to));
    isCloning = true;
    dontRegisterReactiveSideEffects(() => {
      initTree(to, (el, callback) => {
        callback(el, () => {
        });
      });
    });
    isCloning = false;
  }
  var isCloningLegacy = false;
  function clone(oldEl, newEl) {
    if (!newEl._x_dataStack)
      newEl._x_dataStack = oldEl._x_dataStack;
    isCloning = true;
    isCloningLegacy = true;
    dontRegisterReactiveSideEffects(() => {
      cloneTree(newEl);
    });
    isCloning = false;
    isCloningLegacy = false;
  }
  function cloneTree(el) {
    let hasRunThroughFirstEl = false;
    let shallowWalker = (el2, callback) => {
      walk(el2, (el3, skip) => {
        if (hasRunThroughFirstEl && isRoot(el3))
          return skip();
        hasRunThroughFirstEl = true;
        callback(el3, skip);
      });
    };
    initTree(el, shallowWalker);
  }
  function dontRegisterReactiveSideEffects(callback) {
    let cache = effect;
    overrideEffect((callback2, el) => {
      let storedEffect = cache(callback2);
      release(storedEffect);
      return () => {
      };
    });
    callback();
    overrideEffect(cache);
  }
  function bind(el, name, value, modifiers = []) {
    if (!el._x_bindings)
      el._x_bindings = reactive({});
    el._x_bindings[name] = value;
    name = modifiers.includes("camel") ? camelCase(name) : name;
    switch (name) {
      case "value":
        bindInputValue(el, value);
        break;
      case "style":
        bindStyles(el, value);
        break;
      case "class":
        bindClasses(el, value);
        break;
      case "selected":
      case "checked":
        bindAttributeAndProperty(el, name, value);
        break;
      default:
        bindAttribute(el, name, value);
        break;
    }
  }
  function bindInputValue(el, value) {
    if (el.type === "radio") {
      if (el.attributes.value === void 0) {
        el.value = value;
      }
      if (window.fromModel) {
        if (typeof value === "boolean") {
          el.checked = safeParseBoolean(el.value) === value;
        } else {
          el.checked = checkedAttrLooseCompare(el.value, value);
        }
      }
    } else if (el.type === "checkbox") {
      if (Number.isInteger(value)) {
        el.value = value;
      } else if (!Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
        el.value = String(value);
      } else {
        if (Array.isArray(value)) {
          el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
        } else {
          el.checked = !!value;
        }
      }
    } else if (el.tagName === "SELECT") {
      updateSelect(el, value);
    } else {
      if (el.value === value)
        return;
      el.value = value === void 0 ? "" : value;
    }
  }
  function bindClasses(el, value) {
    if (el._x_undoAddedClasses)
      el._x_undoAddedClasses();
    el._x_undoAddedClasses = setClasses(el, value);
  }
  function bindStyles(el, value) {
    if (el._x_undoAddedStyles)
      el._x_undoAddedStyles();
    el._x_undoAddedStyles = setStyles(el, value);
  }
  function bindAttributeAndProperty(el, name, value) {
    bindAttribute(el, name, value);
    setPropertyIfChanged(el, name, value);
  }
  function bindAttribute(el, name, value) {
    if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
      el.removeAttribute(name);
    } else {
      if (isBooleanAttr(name))
        value = name;
      setIfChanged(el, name, value);
    }
  }
  function setIfChanged(el, attrName, value) {
    if (el.getAttribute(attrName) != value) {
      el.setAttribute(attrName, value);
    }
  }
  function setPropertyIfChanged(el, propName, value) {
    if (el[propName] !== value) {
      el[propName] = value;
    }
  }
  function updateSelect(el, value) {
    const arrayWrappedValue = [].concat(value).map((value2) => {
      return value2 + "";
    });
    Array.from(el.options).forEach((option) => {
      option.selected = arrayWrappedValue.includes(option.value);
    });
  }
  function camelCase(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB;
  }
  function safeParseBoolean(rawValue) {
    if ([1, "1", "true", "on", "yes", true].includes(rawValue)) {
      return true;
    }
    if ([0, "0", "false", "off", "no", false].includes(rawValue)) {
      return false;
    }
    return rawValue ? Boolean(rawValue) : null;
  }
  function isBooleanAttr(attrName) {
    const booleanAttributes = [
      "disabled",
      "checked",
      "required",
      "readonly",
      "hidden",
      "open",
      "selected",
      "autofocus",
      "itemscope",
      "multiple",
      "novalidate",
      "allowfullscreen",
      "allowpaymentrequest",
      "formnovalidate",
      "autoplay",
      "controls",
      "loop",
      "muted",
      "playsinline",
      "default",
      "ismap",
      "reversed",
      "async",
      "defer",
      "nomodule"
    ];
    return booleanAttributes.includes(attrName);
  }
  function attributeShouldntBePreservedIfFalsy(name) {
    return !["aria-pressed", "aria-checked", "aria-expanded", "aria-selected"].includes(name);
  }
  function getBinding(el, name, fallback) {
    if (el._x_bindings && el._x_bindings[name] !== void 0)
      return el._x_bindings[name];
    return getAttributeBinding(el, name, fallback);
  }
  function extractProp(el, name, fallback, extract = true) {
    if (el._x_bindings && el._x_bindings[name] !== void 0)
      return el._x_bindings[name];
    if (el._x_inlineBindings && el._x_inlineBindings[name] !== void 0) {
      let binding = el._x_inlineBindings[name];
      binding.extract = extract;
      return dontAutoEvaluateFunctions(() => {
        return evaluate(el, binding.expression);
      });
    }
    return getAttributeBinding(el, name, fallback);
  }
  function getAttributeBinding(el, name, fallback) {
    let attr = el.getAttribute(name);
    if (attr === null)
      return typeof fallback === "function" ? fallback() : fallback;
    if (attr === "")
      return true;
    if (isBooleanAttr(name)) {
      return !![name, "true"].includes(attr);
    }
    return attr;
  }
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      let context = this, args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  function entangle({ get: outerGet, set: outerSet }, { get: innerGet, set: innerSet }) {
    let firstRun = true;
    let outerHash;
    let reference = effect(() => {
      const outer = outerGet();
      const inner = innerGet();
      if (firstRun) {
        innerSet(cloneIfObject(outer));
        firstRun = false;
        outerHash = JSON.stringify(outer);
      } else {
        const outerHashLatest = JSON.stringify(outer);
        if (outerHashLatest !== outerHash) {
          innerSet(cloneIfObject(outer));
          outerHash = outerHashLatest;
        } else {
          outerSet(cloneIfObject(inner));
          outerHash = JSON.stringify(inner);
        }
      }
      JSON.stringify(innerGet());
      JSON.stringify(outerGet());
    });
    return () => {
      release(reference);
    };
  }
  function cloneIfObject(value) {
    return typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }
  function plugin(callback) {
    let callbacks = Array.isArray(callback) ? callback : [callback];
    callbacks.forEach((i) => i(alpine_default));
  }
  var stores = {};
  var isReactive = false;
  function store(name, value) {
    if (!isReactive) {
      stores = reactive(stores);
      isReactive = true;
    }
    if (value === void 0) {
      return stores[name];
    }
    stores[name] = value;
    if (typeof value === "object" && value !== null && value.hasOwnProperty("init") && typeof value.init === "function") {
      stores[name].init();
    }
    initInterceptors2(stores[name]);
  }
  function getStores() {
    return stores;
  }
  var binds = {};
  function bind2(name, bindings) {
    let getBindings = typeof bindings !== "function" ? () => bindings : bindings;
    if (name instanceof Element) {
      return applyBindingsObject(name, getBindings());
    } else {
      binds[name] = getBindings;
    }
    return () => {
    };
  }
  function injectBindingProviders(obj) {
    Object.entries(binds).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback(...args);
          };
        }
      });
    });
    return obj;
  }
  function applyBindingsObject(el, obj, original) {
    let cleanupRunners = [];
    while (cleanupRunners.length)
      cleanupRunners.pop()();
    let attributes = Object.entries(obj).map(([name, value]) => ({ name, value }));
    let staticAttributes = attributesOnly(attributes);
    attributes = attributes.map((attribute) => {
      if (staticAttributes.find((attr) => attr.name === attribute.name)) {
        return {
          name: `x-bind:${attribute.name}`,
          value: `"${attribute.value}"`
        };
      }
      return attribute;
    });
    directives(el, attributes, original).map((handle) => {
      cleanupRunners.push(handle.runCleanups);
      handle();
    });
    return () => {
      while (cleanupRunners.length)
        cleanupRunners.pop()();
    };
  }
  var datas = {};
  function data(name, callback) {
    datas[name] = callback;
  }
  function injectDataProviders(obj, context) {
    Object.entries(datas).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback.bind(context)(...args);
          };
        },
        enumerable: false
      });
    });
    return obj;
  }
  var Alpine = {
    get reactive() {
      return reactive;
    },
    get release() {
      return release;
    },
    get effect() {
      return effect;
    },
    get raw() {
      return raw;
    },
    version: "3.13.3",
    flushAndStopDeferringMutations,
    dontAutoEvaluateFunctions,
    disableEffectScheduling,
    startObservingMutations,
    stopObservingMutations,
    setReactivityEngine,
    onAttributeRemoved,
    onAttributesAdded,
    closestDataStack,
    skipDuringClone,
    onlyDuringClone,
    addRootSelector,
    addInitSelector,
    interceptClone,
    addScopeToNode,
    deferMutations,
    mapAttributes,
    evaluateLater,
    interceptInit,
    setEvaluator,
    mergeProxies,
    extractProp,
    findClosest,
    onElRemoved,
    closestRoot,
    destroyTree,
    interceptor,
    // INTERNAL: not public API and is subject to change without major release.
    transition,
    // INTERNAL
    setStyles,
    // INTERNAL
    mutateDom,
    directive,
    entangle,
    throttle,
    debounce,
    evaluate,
    initTree,
    nextTick,
    prefixed: prefix,
    prefix: setPrefix,
    plugin,
    magic,
    store,
    start,
    clone,
    // INTERNAL
    cloneNode,
    // INTERNAL
    bound: getBinding,
    $data: scope,
    walk,
    data,
    bind: bind2
  };
  var alpine_default = Alpine;
  function makeMap(str, expectsLowerCase) {
    const map = /* @__PURE__ */ Object.create(null);
    const list = str.split(",");
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
  }
  var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
  var isBooleanAttr2 = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
  var EMPTY_OBJ = true ? Object.freeze({}) : {};
  var EMPTY_ARR = true ? Object.freeze([]) : [];
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var isArray = Array.isArray;
  var isMap = (val) => toTypeString(val) === "[object Map]";
  var isString = (val) => typeof val === "string";
  var isSymbol = (val) => typeof val === "symbol";
  var isObject = (val) => val !== null && typeof val === "object";
  var objectToString = Object.prototype.toString;
  var toTypeString = (value) => objectToString.call(value);
  var toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var cacheStringFunction = (fn) => {
    const cache = /* @__PURE__ */ Object.create(null);
    return (str) => {
      const hit = cache[str];
      return hit || (cache[str] = fn(str));
    };
  };
  var camelizeRE = /-(\w)/g;
  var camelize = cacheStringFunction((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
  });
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
  var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
  var toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
  var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
  var targetMap = /* @__PURE__ */ new WeakMap();
  var effectStack = [];
  var activeEffect;
  var ITERATE_KEY = Symbol(true ? "iterate" : "");
  var MAP_KEY_ITERATE_KEY = Symbol(true ? "Map key iterate" : "");
  function isEffect(fn) {
    return fn && fn._isEffect === true;
  }
  function effect2(fn, options = EMPTY_OBJ) {
    if (isEffect(fn)) {
      fn = fn.raw;
    }
    const effect3 = createReactiveEffect(fn, options);
    if (!options.lazy) {
      effect3();
    }
    return effect3;
  }
  function stop(effect3) {
    if (effect3.active) {
      cleanup(effect3);
      if (effect3.options.onStop) {
        effect3.options.onStop();
      }
      effect3.active = false;
    }
  }
  var uid = 0;
  function createReactiveEffect(fn, options) {
    const effect3 = function reactiveEffect() {
      if (!effect3.active) {
        return fn();
      }
      if (!effectStack.includes(effect3)) {
        cleanup(effect3);
        try {
          enableTracking();
          effectStack.push(effect3);
          activeEffect = effect3;
          return fn();
        } finally {
          effectStack.pop();
          resetTracking();
          activeEffect = effectStack[effectStack.length - 1];
        }
      }
    };
    effect3.id = uid++;
    effect3.allowRecurse = !!options.allowRecurse;
    effect3._isEffect = true;
    effect3.active = true;
    effect3.raw = fn;
    effect3.deps = [];
    effect3.options = options;
    return effect3;
  }
  function cleanup(effect3) {
    const { deps } = effect3;
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect3);
      }
      deps.length = 0;
    }
  }
  var shouldTrack = true;
  var trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function track(target, type, key) {
    if (!shouldTrack || activeEffect === void 0) {
      return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
      if (activeEffect.options.onTrack) {
        activeEffect.options.onTrack({
          effect: activeEffect,
          target,
          type,
          key
        });
      }
    }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    const effects = /* @__PURE__ */ new Set();
    const add2 = (effectsToAdd) => {
      if (effectsToAdd) {
        effectsToAdd.forEach((effect3) => {
          if (effect3 !== activeEffect || effect3.allowRecurse) {
            effects.add(effect3);
          }
        });
      }
    };
    if (type === "clear") {
      depsMap.forEach(add2);
    } else if (key === "length" && isArray(target)) {
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 >= newValue) {
          add2(dep);
        }
      });
    } else {
      if (key !== void 0) {
        add2(depsMap.get(key));
      }
      switch (type) {
        case "add":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isIntegerKey(key)) {
            add2(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            add2(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
    const run = (effect3) => {
      if (effect3.options.onTrigger) {
        effect3.options.onTrigger({
          effect: effect3,
          target,
          key,
          type,
          newValue,
          oldValue,
          oldTarget
        });
      }
      if (effect3.options.scheduler) {
        effect3.options.scheduler(effect3);
      } else {
        effect3();
      }
    };
    effects.forEach(run);
  }
  var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
  var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key) => Symbol[key]).filter(isSymbol));
  var get2 = /* @__PURE__ */ createGetter();
  var readonlyGet = /* @__PURE__ */ createGetter(true);
  var arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
  function createArrayInstrumentations() {
    const instrumentations = {};
    ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
      instrumentations[key] = function(...args) {
        const arr = toRaw(this);
        for (let i = 0, l = this.length; i < l; i++) {
          track(arr, "get", i + "");
        }
        const res = arr[key](...args);
        if (res === -1 || res === false) {
          return arr[key](...args.map(toRaw));
        } else {
          return res;
        }
      };
    });
    ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
      instrumentations[key] = function(...args) {
        pauseTracking();
        const res = toRaw(this)[key].apply(this, args);
        resetTracking();
        return res;
      };
    });
    return instrumentations;
  }
  function createGetter(isReadonly = false, shallow = false) {
    return function get3(target, key, receiver) {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw" && receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
        return target;
      }
      const targetIsArray = isArray(target);
      if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const res = Reflect.get(target, key, receiver);
      if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res;
      }
      if (!isReadonly) {
        track(target, "get", key);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
        return shouldUnwrap ? res.value : res;
      }
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive2(res);
      }
      return res;
    };
  }
  var set2 = /* @__PURE__ */ createSetter();
  function createSetter(shallow = false) {
    return function set3(target, key, value, receiver) {
      let oldValue = target[key];
      if (!shallow) {
        value = toRaw(value);
        oldValue = toRaw(oldValue);
        if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        }
      }
      const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value, oldValue);
        }
      }
      return result;
    };
  }
  function deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  function ownKeys(target) {
    track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
  var mutableHandlers = {
    get: get2,
    set: set2,
    deleteProperty,
    has,
    ownKeys
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      if (true) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    },
    deleteProperty(target, key) {
      if (true) {
        console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    }
  };
  var toReactive = (value) => isObject(value) ? reactive2(value) : value;
  var toReadonly = (value) => isObject(value) ? readonly(value) : value;
  var toShallow = (value) => value;
  var getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key, isReadonly = false, isShallow = false) {
    target = target[
      "__v_raw"
      /* RAW */
    ];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "get", key);
    }
    !isReadonly && track(rawTarget, "get", rawKey);
    const { has: has2 } = getProto(rawTarget);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    } else if (target !== rawTarget) {
      target.get(key);
    }
  }
  function has$1(key, isReadonly = false) {
    const target = this[
      "__v_raw"
      /* RAW */
    ];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "has", key);
    }
    !isReadonly && track(rawTarget, "has", rawKey);
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
    target = target[
      "__v_raw"
      /* RAW */
    ];
    !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
      target.add(value);
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const { has: has2, get: get3 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else if (true) {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3.call(target, key);
    target.set(key, value);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, "set", key, value, oldValue);
    }
    return this;
  }
  function deleteEntry(key) {
    const target = toRaw(this);
    const { has: has2, get: get3 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else if (true) {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3 ? get3.call(target, key) : void 0;
    const result = target.delete(key);
    if (hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget = true ? isMap(target) ? new Map(target) : new Set(target) : void 0;
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0, oldTarget);
    }
    return result;
  }
  function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed[
        "__v_raw"
        /* RAW */
      ];
      const rawTarget = toRaw(target);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
    return function(...args) {
      const target = this[
        "__v_raw"
        /* RAW */
      ];
      const rawTarget = toRaw(target);
      const targetIsMap = isMap(rawTarget);
      const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
      return {
        // iterator protocol
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        },
        // iterable protocol
        [Symbol.iterator]() {
          return this;
        }
      };
    };
  }
  function createReadonlyMethod(type) {
    return function(...args) {
      if (true) {
        const key = args[0] ? `on key "${args[0]}" ` : ``;
        console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
      }
      return type === "delete" ? false : this;
    };
  }
  function createInstrumentations() {
    const mutableInstrumentations2 = {
      get(key) {
        return get$1(this, key);
      },
      get size() {
        return size(this);
      },
      has: has$1,
      add,
      set: set$1,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, false)
    };
    const shallowInstrumentations2 = {
      get(key) {
        return get$1(this, key, false, true);
      },
      get size() {
        return size(this);
      },
      has: has$1,
      add,
      set: set$1,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, true)
    };
    const readonlyInstrumentations2 = {
      get(key) {
        return get$1(this, key, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has$1.call(this, key, true);
      },
      add: createReadonlyMethod(
        "add"
        /* ADD */
      ),
      set: createReadonlyMethod(
        "set"
        /* SET */
      ),
      delete: createReadonlyMethod(
        "delete"
        /* DELETE */
      ),
      clear: createReadonlyMethod(
        "clear"
        /* CLEAR */
      ),
      forEach: createForEach(true, false)
    };
    const shallowReadonlyInstrumentations2 = {
      get(key) {
        return get$1(this, key, true, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has$1.call(this, key, true);
      },
      add: createReadonlyMethod(
        "add"
        /* ADD */
      ),
      set: createReadonlyMethod(
        "set"
        /* SET */
      ),
      delete: createReadonlyMethod(
        "delete"
        /* DELETE */
      ),
      clear: createReadonlyMethod(
        "clear"
        /* CLEAR */
      ),
      forEach: createForEach(true, true)
    };
    const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
    iteratorMethods.forEach((method) => {
      mutableInstrumentations2[method] = createIterableMethod(method, false, false);
      readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
      shallowInstrumentations2[method] = createIterableMethod(method, false, true);
      shallowReadonlyInstrumentations2[method] = createIterableMethod(method, true, true);
    });
    return [
      mutableInstrumentations2,
      readonlyInstrumentations2,
      shallowInstrumentations2,
      shallowReadonlyInstrumentations2
    ];
  }
  var [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* @__PURE__ */ createInstrumentations();
  function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key, receiver) => {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw") {
        return target;
      }
      return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
    };
  }
  var mutableCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(false, false)
  };
  var readonlyCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(true, false)
  };
  function checkIdentityKeys(target, has2, key) {
    const rawKey = toRaw(key);
    if (rawKey !== key && has2.call(target, rawKey)) {
      const type = toRawType(target);
      console.warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
    }
  }
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
  var readonlyMap = /* @__PURE__ */ new WeakMap();
  var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function getTargetType(value) {
    return value[
      "__v_skip"
      /* SKIP */
    ] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
  }
  function reactive2(target) {
    if (target && target[
      "__v_isReadonly"
      /* IS_READONLY */
    ]) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject(target)) {
      if (true) {
        console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
    }
    if (target[
      "__v_raw"
      /* RAW */
    ] && !(isReadonly && target[
      "__v_isReactive"
      /* IS_REACTIVE */
    ])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function toRaw(observed) {
    return observed && toRaw(observed[
      "__v_raw"
      /* RAW */
    ]) || observed;
  }
  function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
  }
  magic("nextTick", () => nextTick);
  magic("dispatch", (el) => dispatch.bind(dispatch, el));
  magic("watch", (el, { evaluateLater: evaluateLater2, effect: effect3 }) => (key, callback) => {
    let evaluate2 = evaluateLater2(key);
    let firstTime = true;
    let oldValue;
    let effectReference = effect3(() => evaluate2((value) => {
      JSON.stringify(value);
      if (!firstTime) {
        queueMicrotask(() => {
          callback(value, oldValue);
          oldValue = value;
        });
      } else {
        oldValue = value;
      }
      firstTime = false;
    }));
    el._x_effects.delete(effectReference);
  });
  magic("store", getStores);
  magic("data", (el) => scope(el));
  magic("root", (el) => closestRoot(el));
  magic("refs", (el) => {
    if (el._x_refs_proxy)
      return el._x_refs_proxy;
    el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));
    return el._x_refs_proxy;
  });
  function getArrayOfRefObject(el) {
    let refObjects = [];
    let currentEl = el;
    while (currentEl) {
      if (currentEl._x_refs)
        refObjects.push(currentEl._x_refs);
      currentEl = currentEl.parentNode;
    }
    return refObjects;
  }
  var globalIdMemo = {};
  function findAndIncrementId(name) {
    if (!globalIdMemo[name])
      globalIdMemo[name] = 0;
    return ++globalIdMemo[name];
  }
  function closestIdRoot(el, name) {
    return findClosest(el, (element) => {
      if (element._x_ids && element._x_ids[name])
        return true;
    });
  }
  function setIdRoot(el, name) {
    if (!el._x_ids)
      el._x_ids = {};
    if (!el._x_ids[name])
      el._x_ids[name] = findAndIncrementId(name);
  }
  magic("id", (el) => (name, key = null) => {
    let root = closestIdRoot(el, name);
    let id = root ? root._x_ids[name] : findAndIncrementId(name);
    return key ? `${name}-${id}-${key}` : `${name}-${id}`;
  });
  magic("el", (el) => el);
  warnMissingPluginMagic("Focus", "focus", "focus");
  warnMissingPluginMagic("Persist", "persist", "persist");
  function warnMissingPluginMagic(name, magicName, slug) {
    magic(magicName, (el) => warn(`You can't use [$${magicName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }
  directive("modelable", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2, cleanup: cleanup2 }) => {
    let func = evaluateLater2(expression);
    let innerGet = () => {
      let result;
      func((i) => result = i);
      return result;
    };
    let evaluateInnerSet = evaluateLater2(`${expression} = __placeholder`);
    let innerSet = (val) => evaluateInnerSet(() => {
    }, { scope: { "__placeholder": val } });
    let initialValue = innerGet();
    innerSet(initialValue);
    queueMicrotask(() => {
      if (!el._x_model)
        return;
      el._x_removeModelListeners["default"]();
      let outerGet = el._x_model.get;
      let outerSet = el._x_model.set;
      let releaseEntanglement = entangle(
        {
          get() {
            return outerGet();
          },
          set(value) {
            outerSet(value);
          }
        },
        {
          get() {
            return innerGet();
          },
          set(value) {
            innerSet(value);
          }
        }
      );
      cleanup2(releaseEntanglement);
    });
  });
  directive("teleport", (el, { modifiers, expression }, { cleanup: cleanup2 }) => {
    if (el.tagName.toLowerCase() !== "template")
      warn("x-teleport can only be used on a <template> tag", el);
    let target = getTarget(expression);
    let clone2 = el.content.cloneNode(true).firstElementChild;
    el._x_teleport = clone2;
    clone2._x_teleportBack = el;
    el.setAttribute("data-teleport-template", true);
    clone2.setAttribute("data-teleport-target", true);
    if (el._x_forwardEvents) {
      el._x_forwardEvents.forEach((eventName) => {
        clone2.addEventListener(eventName, (e) => {
          e.stopPropagation();
          el.dispatchEvent(new e.constructor(e.type, e));
        });
      });
    }
    addScopeToNode(clone2, {}, el);
    let placeInDom = (clone3, target2, modifiers2) => {
      if (modifiers2.includes("prepend")) {
        target2.parentNode.insertBefore(clone3, target2);
      } else if (modifiers2.includes("append")) {
        target2.parentNode.insertBefore(clone3, target2.nextSibling);
      } else {
        target2.appendChild(clone3);
      }
    };
    mutateDom(() => {
      placeInDom(clone2, target, modifiers);
      initTree(clone2);
      clone2._x_ignore = true;
    });
    el._x_teleportPutBack = () => {
      let target2 = getTarget(expression);
      mutateDom(() => {
        placeInDom(el._x_teleport, target2, modifiers);
      });
    };
    cleanup2(() => clone2.remove());
  });
  var teleportContainerDuringClone = document.createElement("div");
  function getTarget(expression) {
    let target = skipDuringClone(() => {
      return document.querySelector(expression);
    }, () => {
      return teleportContainerDuringClone;
    })();
    if (!target)
      warn(`Cannot find x-teleport element for selector: "${expression}"`);
    return target;
  }
  var handler = () => {
  };
  handler.inline = (el, { modifiers }, { cleanup: cleanup2 }) => {
    modifiers.includes("self") ? el._x_ignoreSelf = true : el._x_ignore = true;
    cleanup2(() => {
      modifiers.includes("self") ? delete el._x_ignoreSelf : delete el._x_ignore;
    });
  };
  directive("ignore", handler);
  directive("effect", skipDuringClone((el, { expression }, { effect: effect3 }) => {
    effect3(evaluateLater(el, expression));
  }));
  function on(el, event, modifiers, callback) {
    let listenerTarget = el;
    let handler4 = (e) => callback(e);
    let options = {};
    let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
    if (modifiers.includes("dot"))
      event = dotSyntax(event);
    if (modifiers.includes("camel"))
      event = camelCase2(event);
    if (modifiers.includes("passive"))
      options.passive = true;
    if (modifiers.includes("capture"))
      options.capture = true;
    if (modifiers.includes("window"))
      listenerTarget = window;
    if (modifiers.includes("document"))
      listenerTarget = document;
    if (modifiers.includes("debounce")) {
      let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler4 = debounce(handler4, wait);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler4 = throttle(handler4, wait);
    }
    if (modifiers.includes("prevent"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.preventDefault();
        next(e);
      });
    if (modifiers.includes("stop"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.stopPropagation();
        next(e);
      });
    if (modifiers.includes("self"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.target === el && next(e);
      });
    if (modifiers.includes("away") || modifiers.includes("outside")) {
      listenerTarget = document;
      handler4 = wrapHandler(handler4, (next, e) => {
        if (el.contains(e.target))
          return;
        if (e.target.isConnected === false)
          return;
        if (el.offsetWidth < 1 && el.offsetHeight < 1)
          return;
        if (el._x_isShown === false)
          return;
        next(e);
      });
    }
    if (modifiers.includes("once")) {
      handler4 = wrapHandler(handler4, (next, e) => {
        next(e);
        listenerTarget.removeEventListener(event, handler4, options);
      });
    }
    handler4 = wrapHandler(handler4, (next, e) => {
      if (isKeyEvent(event)) {
        if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
          return;
        }
      }
      next(e);
    });
    listenerTarget.addEventListener(event, handler4, options);
    return () => {
      listenerTarget.removeEventListener(event, handler4, options);
    };
  }
  function dotSyntax(subject) {
    return subject.replace(/-/g, ".");
  }
  function camelCase2(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function isNumeric(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function kebabCase2(subject) {
    if ([" ", "_"].includes(
      subject
    ))
      return subject;
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\s]/, "-").toLowerCase();
  }
  function isKeyEvent(event) {
    return ["keydown", "keyup"].includes(event);
  }
  function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
    let keyModifiers = modifiers.filter((i) => {
      return !["window", "document", "prevent", "stop", "once", "capture"].includes(i);
    });
    if (keyModifiers.includes("debounce")) {
      let debounceIndex = keyModifiers.indexOf("debounce");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.includes("throttle")) {
      let debounceIndex = keyModifiers.indexOf("throttle");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.length === 0)
      return false;
    if (keyModifiers.length === 1 && keyToModifiers(e.key).includes(keyModifiers[0]))
      return false;
    const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
    const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
    keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
    if (selectedSystemKeyModifiers.length > 0) {
      const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
        if (modifier === "cmd" || modifier === "super")
          modifier = "meta";
        return e[`${modifier}Key`];
      });
      if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
        if (keyToModifiers(e.key).includes(keyModifiers[0]))
          return false;
      }
    }
    return true;
  }
  function keyToModifiers(key) {
    if (!key)
      return [];
    key = kebabCase2(key);
    let modifierToKeyMap = {
      "ctrl": "control",
      "slash": "/",
      "space": " ",
      "spacebar": " ",
      "cmd": "meta",
      "esc": "escape",
      "up": "arrow-up",
      "down": "arrow-down",
      "left": "arrow-left",
      "right": "arrow-right",
      "period": ".",
      "equal": "=",
      "minus": "-",
      "underscore": "_"
    };
    modifierToKeyMap[key] = key;
    return Object.keys(modifierToKeyMap).map((modifier) => {
      if (modifierToKeyMap[modifier] === key)
        return modifier;
    }).filter((modifier) => modifier);
  }
  directive("model", (el, { modifiers, expression }, { effect: effect3, cleanup: cleanup2 }) => {
    let scopeTarget = el;
    if (modifiers.includes("parent")) {
      scopeTarget = el.parentNode;
    }
    let evaluateGet = evaluateLater(scopeTarget, expression);
    let evaluateSet;
    if (typeof expression === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression} = __placeholder`);
    } else if (typeof expression === "function" && typeof expression() === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression()} = __placeholder`);
    } else {
      evaluateSet = () => {
      };
    }
    let getValue = () => {
      let result;
      evaluateGet((value) => result = value);
      return isGetterSetter(result) ? result.get() : result;
    };
    let setValue = (value) => {
      let result;
      evaluateGet((value2) => result = value2);
      if (isGetterSetter(result)) {
        result.set(value);
      } else {
        evaluateSet(() => {
        }, {
          scope: { "__placeholder": value }
        });
      }
    };
    if (typeof expression === "string" && el.type === "radio") {
      mutateDom(() => {
        if (!el.hasAttribute("name"))
          el.setAttribute("name", expression);
      });
    }
    var event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy") ? "change" : "input";
    let removeListener = isCloning ? () => {
    } : on(el, event, modifiers, (e) => {
      setValue(getInputValue(el, modifiers, e, getValue()));
    });
    if (modifiers.includes("fill")) {
      if ([null, ""].includes(getValue()) || el.type === "checkbox" && Array.isArray(getValue())) {
        el.dispatchEvent(new Event(event, {}));
      }
    }
    if (!el._x_removeModelListeners)
      el._x_removeModelListeners = {};
    el._x_removeModelListeners["default"] = removeListener;
    cleanup2(() => el._x_removeModelListeners["default"]());
    if (el.form) {
      let removeResetListener = on(el.form, "reset", [], (e) => {
        nextTick(() => el._x_model && el._x_model.set(el.value));
      });
      cleanup2(() => removeResetListener());
    }
    el._x_model = {
      get() {
        return getValue();
      },
      set(value) {
        setValue(value);
      }
    };
    el._x_forceModelUpdate = (value) => {
      if (value === void 0 && typeof expression === "string" && expression.match(/\./))
        value = "";
      window.fromModel = true;
      mutateDom(() => bind(el, "value", value));
      delete window.fromModel;
    };
    effect3(() => {
      let value = getValue();
      if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el))
        return;
      el._x_forceModelUpdate(value);
    });
  });
  function getInputValue(el, modifiers, event, currentValue) {
    return mutateDom(() => {
      if (event instanceof CustomEvent && event.detail !== void 0)
        return event.detail !== null && event.detail !== void 0 ? event.detail : event.target.value;
      else if (el.type === "checkbox") {
        if (Array.isArray(currentValue)) {
          let newValue = null;
          if (modifiers.includes("number")) {
            newValue = safeParseNumber(event.target.value);
          } else if (modifiers.includes("boolean")) {
            newValue = safeParseBoolean(event.target.value);
          } else {
            newValue = event.target.value;
          }
          return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
        } else {
          return event.target.checked;
        }
      } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
        if (modifiers.includes("number")) {
          return Array.from(event.target.selectedOptions).map((option) => {
            let rawValue = option.value || option.text;
            return safeParseNumber(rawValue);
          });
        } else if (modifiers.includes("boolean")) {
          return Array.from(event.target.selectedOptions).map((option) => {
            let rawValue = option.value || option.text;
            return safeParseBoolean(rawValue);
          });
        }
        return Array.from(event.target.selectedOptions).map((option) => {
          return option.value || option.text;
        });
      } else {
        if (modifiers.includes("number")) {
          return safeParseNumber(event.target.value);
        } else if (modifiers.includes("boolean")) {
          return safeParseBoolean(event.target.value);
        }
        return modifiers.includes("trim") ? event.target.value.trim() : event.target.value;
      }
    });
  }
  function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null;
    return isNumeric2(number) ? number : rawValue;
  }
  function checkedAttrLooseCompare2(valueA, valueB) {
    return valueA == valueB;
  }
  function isNumeric2(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function isGetterSetter(value) {
    return value !== null && typeof value === "object" && typeof value.get === "function" && typeof value.set === "function";
  }
  directive("cloak", (el) => queueMicrotask(() => mutateDom(() => el.removeAttribute(prefix("cloak")))));
  addInitSelector(() => `[${prefix("init")}]`);
  directive("init", skipDuringClone((el, { expression }, { evaluate: evaluate2 }) => {
    if (typeof expression === "string") {
      return !!expression.trim() && evaluate2(expression, {}, false);
    }
    return evaluate2(expression, {}, false);
  }));
  directive("text", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.textContent = value;
        });
      });
    });
  });
  directive("html", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.innerHTML = value;
          el._x_ignoreSelf = true;
          initTree(el);
          delete el._x_ignoreSelf;
        });
      });
    });
  });
  mapAttributes(startingWith(":", into(prefix("bind:"))));
  var handler2 = (el, { value, modifiers, expression, original }, { effect: effect3 }) => {
    if (!value) {
      let bindingProviders = {};
      injectBindingProviders(bindingProviders);
      let getBindings = evaluateLater(el, expression);
      getBindings((bindings) => {
        applyBindingsObject(el, bindings, original);
      }, { scope: bindingProviders });
      return;
    }
    if (value === "key")
      return storeKeyForXFor(el, expression);
    if (el._x_inlineBindings && el._x_inlineBindings[value] && el._x_inlineBindings[value].extract) {
      return;
    }
    let evaluate2 = evaluateLater(el, expression);
    effect3(() => evaluate2((result) => {
      if (result === void 0 && typeof expression === "string" && expression.match(/\./)) {
        result = "";
      }
      mutateDom(() => bind(el, value, result, modifiers));
    }));
  };
  handler2.inline = (el, { value, modifiers, expression }) => {
    if (!value)
      return;
    if (!el._x_inlineBindings)
      el._x_inlineBindings = {};
    el._x_inlineBindings[value] = { expression, extract: false };
  };
  directive("bind", handler2);
  function storeKeyForXFor(el, expression) {
    el._x_keyExpression = expression;
  }
  addRootSelector(() => `[${prefix("data")}]`);
  directive("data", (el, { expression }, { cleanup: cleanup2 }) => {
    if (shouldSkipRegisteringDataDuringClone(el))
      return;
    expression = expression === "" ? "{}" : expression;
    let magicContext = {};
    injectMagics(magicContext, el);
    let dataProviderContext = {};
    injectDataProviders(dataProviderContext, magicContext);
    let data2 = evaluate(el, expression, { scope: dataProviderContext });
    if (data2 === void 0 || data2 === true)
      data2 = {};
    injectMagics(data2, el);
    let reactiveData = reactive(data2);
    initInterceptors2(reactiveData);
    let undo = addScopeToNode(el, reactiveData);
    reactiveData["init"] && evaluate(el, reactiveData["init"]);
    cleanup2(() => {
      reactiveData["destroy"] && evaluate(el, reactiveData["destroy"]);
      undo();
    });
  });
  interceptClone((from, to) => {
    if (from._x_dataStack) {
      to._x_dataStack = from._x_dataStack;
      to.setAttribute("data-has-alpine-state", true);
    }
  });
  function shouldSkipRegisteringDataDuringClone(el) {
    if (!isCloning)
      return false;
    if (isCloningLegacy)
      return true;
    return el.hasAttribute("data-has-alpine-state");
  }
  directive("show", (el, { modifiers, expression }, { effect: effect3 }) => {
    let evaluate2 = evaluateLater(el, expression);
    if (!el._x_doHide)
      el._x_doHide = () => {
        mutateDom(() => {
          el.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
        });
      };
    if (!el._x_doShow)
      el._x_doShow = () => {
        mutateDom(() => {
          if (el.style.length === 1 && el.style.display === "none") {
            el.removeAttribute("style");
          } else {
            el.style.removeProperty("display");
          }
        });
      };
    let hide = () => {
      el._x_doHide();
      el._x_isShown = false;
    };
    let show = () => {
      el._x_doShow();
      el._x_isShown = true;
    };
    let clickAwayCompatibleShow = () => setTimeout(show);
    let toggle = once(
      (value) => value ? show() : hide(),
      (value) => {
        if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
          el._x_toggleAndCascadeWithTransitions(el, value, show, hide);
        } else {
          value ? clickAwayCompatibleShow() : hide();
        }
      }
    );
    let oldValue;
    let firstTime = true;
    effect3(() => evaluate2((value) => {
      if (!firstTime && value === oldValue)
        return;
      if (modifiers.includes("immediate"))
        value ? clickAwayCompatibleShow() : hide();
      toggle(value);
      oldValue = value;
      firstTime = false;
    }));
  });
  directive("for", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluateLater(el, iteratorNames.items);
    let evaluateKey = evaluateLater(
      el,
      // the x-bind:key expression is stored for our use instead of evaluated.
      el._x_keyExpression || "index"
    );
    el._x_prevKeys = [];
    el._x_lookup = {};
    effect3(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
    cleanup2(() => {
      Object.values(el._x_lookup).forEach((el2) => el2.remove());
      delete el._x_prevKeys;
      delete el._x_lookup;
    });
  });
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let isObject2 = (i) => typeof i === "object" && !Array.isArray(i);
    let templateEl = el;
    evaluateItems((items) => {
      if (isNumeric3(items) && items >= 0) {
        items = Array.from(Array(items).keys(), (i) => i + 1);
      }
      if (items === void 0)
        items = [];
      let lookup = el._x_lookup;
      let prevKeys = el._x_prevKeys;
      let scopes = [];
      let keys = [];
      if (isObject2(items)) {
        items = Object.entries(items).map(([key, value]) => {
          let scope2 = getIterationScopeVariables(iteratorNames, value, key, items);
          evaluateKey((value2) => keys.push(value2), { scope: __spreadValues({ index: key }, scope2) });
          scopes.push(scope2);
        });
      } else {
        for (let i = 0; i < items.length; i++) {
          let scope2 = getIterationScopeVariables(iteratorNames, items[i], i, items);
          evaluateKey((value) => keys.push(value), { scope: __spreadValues({ index: i }, scope2) });
          scopes.push(scope2);
        }
      }
      let adds = [];
      let moves = [];
      let removes = [];
      let sames = [];
      for (let i = 0; i < prevKeys.length; i++) {
        let key = prevKeys[i];
        if (keys.indexOf(key) === -1)
          removes.push(key);
      }
      prevKeys = prevKeys.filter((key) => !removes.includes(key));
      let lastKey = "template";
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let prevIndex = prevKeys.indexOf(key);
        if (prevIndex === -1) {
          prevKeys.splice(i, 0, key);
          adds.push([lastKey, i]);
        } else if (prevIndex !== i) {
          let keyInSpot = prevKeys.splice(i, 1)[0];
          let keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];
          prevKeys.splice(i, 0, keyForSpot);
          prevKeys.splice(prevIndex, 0, keyInSpot);
          moves.push([keyInSpot, keyForSpot]);
        } else {
          sames.push(key);
        }
        lastKey = key;
      }
      for (let i = 0; i < removes.length; i++) {
        let key = removes[i];
        if (!!lookup[key]._x_effects) {
          lookup[key]._x_effects.forEach(dequeueJob);
        }
        lookup[key].remove();
        lookup[key] = null;
        delete lookup[key];
      }
      for (let i = 0; i < moves.length; i++) {
        let [keyInSpot, keyForSpot] = moves[i];
        let elInSpot = lookup[keyInSpot];
        let elForSpot = lookup[keyForSpot];
        let marker = document.createElement("div");
        mutateDom(() => {
          if (!elForSpot)
            warn(`x-for ":key" is undefined or invalid`, templateEl);
          elForSpot.after(marker);
          elInSpot.after(elForSpot);
          elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
          marker.before(elInSpot);
          elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
          marker.remove();
        });
        elForSpot._x_refreshXForScope(scopes[keys.indexOf(keyForSpot)]);
      }
      for (let i = 0; i < adds.length; i++) {
        let [lastKey2, index] = adds[i];
        let lastEl = lastKey2 === "template" ? templateEl : lookup[lastKey2];
        if (lastEl._x_currentIfEl)
          lastEl = lastEl._x_currentIfEl;
        let scope2 = scopes[index];
        let key = keys[index];
        let clone2 = document.importNode(templateEl.content, true).firstElementChild;
        let reactiveScope = reactive(scope2);
        addScopeToNode(clone2, reactiveScope, templateEl);
        clone2._x_refreshXForScope = (newScope) => {
          Object.entries(newScope).forEach(([key2, value]) => {
            reactiveScope[key2] = value;
          });
        };
        mutateDom(() => {
          lastEl.after(clone2);
          initTree(clone2);
        });
        if (typeof key === "object") {
          warn("x-for key cannot be an object, it must be a string or an integer", templateEl);
        }
        lookup[key] = clone2;
      }
      for (let i = 0; i < sames.length; i++) {
        lookup[sames[i]]._x_refreshXForScope(scopes[keys.indexOf(sames[i])]);
      }
      templateEl._x_prevKeys = keys;
    });
  }
  function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\s*\(|\)\s*$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = expression.match(forAliasRE);
    if (!inMatch)
      return;
    let res = {};
    res.items = inMatch[2].trim();
    let item = inMatch[1].replace(stripParensRE, "").trim();
    let iteratorMatch = item.match(forIteratorRE);
    if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, "").trim();
      res.index = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.collection = iteratorMatch[2].trim();
      }
    } else {
      res.item = item;
    }
    return res;
  }
  function getIterationScopeVariables(iteratorNames, item, index, items) {
    let scopeVariables = {};
    if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
      let names = iteratorNames.item.replace("[", "").replace("]", "").split(",").map((i) => i.trim());
      names.forEach((name, i) => {
        scopeVariables[name] = item[i];
      });
    } else if (/^\{.*\}$/.test(iteratorNames.item) && !Array.isArray(item) && typeof item === "object") {
      let names = iteratorNames.item.replace("{", "").replace("}", "").split(",").map((i) => i.trim());
      names.forEach((name) => {
        scopeVariables[name] = item[name];
      });
    } else {
      scopeVariables[iteratorNames.item] = item;
    }
    if (iteratorNames.index)
      scopeVariables[iteratorNames.index] = index;
    if (iteratorNames.collection)
      scopeVariables[iteratorNames.collection] = items;
    return scopeVariables;
  }
  function isNumeric3(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function handler3() {
  }
  handler3.inline = (el, { expression }, { cleanup: cleanup2 }) => {
    let root = closestRoot(el);
    if (!root._x_refs)
      root._x_refs = {};
    root._x_refs[expression] = el;
    cleanup2(() => delete root._x_refs[expression]);
  };
  directive("ref", handler3);
  directive("if", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
    if (el.tagName.toLowerCase() !== "template")
      warn("x-if can only be used on a <template> tag", el);
    let evaluate2 = evaluateLater(el, expression);
    let show = () => {
      if (el._x_currentIfEl)
        return el._x_currentIfEl;
      let clone2 = el.content.cloneNode(true).firstElementChild;
      addScopeToNode(clone2, {}, el);
      mutateDom(() => {
        el.after(clone2);
        initTree(clone2);
      });
      el._x_currentIfEl = clone2;
      el._x_undoIf = () => {
        walk(clone2, (node) => {
          if (!!node._x_effects) {
            node._x_effects.forEach(dequeueJob);
          }
        });
        clone2.remove();
        delete el._x_currentIfEl;
      };
      return clone2;
    };
    let hide = () => {
      if (!el._x_undoIf)
        return;
      el._x_undoIf();
      delete el._x_undoIf;
    };
    effect3(() => evaluate2((value) => {
      value ? show() : hide();
    }));
    cleanup2(() => el._x_undoIf && el._x_undoIf());
  });
  directive("id", (el, { expression }, { evaluate: evaluate2 }) => {
    let names = evaluate2(expression);
    names.forEach((name) => setIdRoot(el, name));
  });
  mapAttributes(startingWith("@", into(prefix("on:"))));
  directive("on", skipDuringClone((el, { value, modifiers, expression }, { cleanup: cleanup2 }) => {
    let evaluate2 = expression ? evaluateLater(el, expression) : () => {
    };
    if (el.tagName.toLowerCase() === "template") {
      if (!el._x_forwardEvents)
        el._x_forwardEvents = [];
      if (!el._x_forwardEvents.includes(value))
        el._x_forwardEvents.push(value);
    }
    let removeListener = on(el, value, modifiers, (e) => {
      evaluate2(() => {
      }, { scope: { "$event": e }, params: [e] });
    });
    cleanup2(() => removeListener());
  }));
  warnMissingPluginDirective("Collapse", "collapse", "collapse");
  warnMissingPluginDirective("Intersect", "intersect", "intersect");
  warnMissingPluginDirective("Focus", "trap", "focus");
  warnMissingPluginDirective("Mask", "mask", "mask");
  function warnMissingPluginDirective(name, directiveName, slug) {
    directive(directiveName, (el) => warn(`You can't use [x-${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }
  alpine_default.setEvaluator(normalEvaluator);
  alpine_default.setReactivityEngine({ reactive: reactive2, effect: effect2, release: stop, raw: toRaw });
  var src_default = alpine_default;
  var module_default = src_default;

  // src/cards.js
  var cards_default = () => ({
    init() {
    },
    destroy() {
    },
    db: {
      "icons": [
        "scooter.png",
        "motorcycle.png",
        "car.png",
        "truck.png",
        "sport.png",
        "gun.png",
        "aircraft.png",
        null
      ],
      "Certificati": {
        "Patente CIG": {
          "Conseguimento": "<p>Per il certificato medico di idoneit\xE0 psicofisica finalizzato al conseguimento della patente CIG occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>certificato medico anamnestico rilasciato dal proprio medico di famiglia;</li><li>nr. 3 foto-tessere recenti;</li><li>1 marca da bollo di \u20AC 16,00;</li><li>occhiali o lenti a contatto se necessario;</li></ul><p class='mt-3'><span class='font-bold'>Attenzione!</span> Se l'interessato \xE8 minorenne dovr\xE0 essere accompagnato da un genitore.</p>",
          "Rinnovo": "<p>Per il rilascio del certificato medico utile al rinnovo della patente di guida, occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>una foto-tessera recente;</li><li>occhiali o lenti a contatto se necessario;</li></ul><p>Per l'effettuazione della pratica, non \xE8 pi\xF9 necessiario che l'interessato acquisti la marca da bollo da \u20AC 16,00, in quanto questa \xE8 stata sostituita con un bollettino postale di pari importo. Lo studio medico ha gi\xE0 a disposizione i bollettini pre-pagati di \u20AC 16,00 (+ \u20AC 1,80 di tasse postali) e \u20AC 9,00 \u20AC (+ \u20AC 1,80 di tasse postali).</p><p>Tramite il collegamento in tempo reale con il Portale dell'Automobilista, il sanitario rilascer\xE0 all'interessato la ricevuta dell'avvenuto rinnovo e, dopo pochi giorni, la patente di guida sar\xE0 recapitata per posta assicurata.</p><p class='mt-3'><span class='font-bold'>Attenzione!</span> Se l'interessato \xE8 minorenne dovr\xE0 essere accompagnato da un genitore.</p>",
          "Duplicato documento": "<p>Nel caso che l'interessato necessiti di effettuare un duplicato della propria patente di guida (o per smarrimento o per deterioramento) potr\xE0 effettuare presso il nostro studio la visita per il rilascio del certificato medico utile alla pratica. L'interessato dovr\xE0 venire munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>una marca da bollo di \u20AC 16.00;</li><li>nr. 3 foto-tessere recenti;</li><li>occhiali o lenti a contatto se necessario;</li></ul><p class='mt-3'><span class='font-bold'>Attenzione!</span> Se l'interessato \xE8 minorenne dovr\xE0 essere accompagnato da un genitore.</p>"
        },
        "Patente A": {
          "Conseguimento": "<p>Per il certificato medico di idoneit\xE0 psicofisica al conseguimento della patente A occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li> certificato medico anamnestico rilasciato dal proprio medico di famiglia;</li><li>nr. 3 foto-tessere recenti;</li><li>una marca da bollo di \u20AC 16,00;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          "Rinnovo": "<p>Per il rilascio del certificato medico utile al rinnovo della patente di guida, occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>una foto-tessera recente;</li><li>occhiali o lenti a contatto se necessario.</li></ul><p>Per l'effettuazione della pratica, non necessita pi\xF9 che l'interessato acquisti la marca da bollo da \u20AC 16,00, in quanto questa \xE8 stata sostituita dalla normativa con un bollettino postale di pari importo. Lo studio medico ha gi\xE0 a disposizione i bollettini pre-pagati di \u20AC 16,00 (+ \u20AC 1,80 di tasse postali) e \u20AC 9,00 \u20AC (+ \u20AC 1,80 di tasse postali). Tramite il collegamento in tempo reale con il Portale dell'Automobilista, il sanitario rilascer\xE0 all'interessato la ricevuta dell'avvenuto rinnovo e, dopo pochi giorni, la patente di guida sar\xE0 recapitata per posta assicurata.</p><p>Con il solo pagamento del certificato medico (senza spese aggiuntive) la pratica per il rinnovo della patente \xE8 da considerarsi conclusa, senza che l'interessato debba recarsi presso agenzie e/o autoscuole.</p>",
          "duplicato": "<p>Nel caso che l'interessato necessiti di effettuare un duplicato della propria patente di guida (o per smarrimento o per deterioramento) potr\xE0 effettuare presso il nostro studio la visita per il rilascio del certificato medico utile alla pratica. L'interessato dovr\xE0 venire munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>una marca da bollo di \u20AC 16.00;</li><li>nr. 3 foto-tessere recenti;</li><li>occhiali o lenti a contatto se necessario.</li></ul>"
        },
        "Patente B": {
          "Conseguimento": "<p>Per il certificato medico di idoneit\xE0 psicofisica al conseguimento della patente B occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>certificato medico anamnestico rilasciato dal proprio medico di famiglia;</li><li>nr. 3 foto-tessere recenti; una marca da bollo di \u20AC 16,00;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          "Rinnovo": "<p>Per il rilascio del certificato medico utile al rinnovo della patente di guida, occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>una foto-tessera recente;</li><li>occhiali o lenti a contatto se necessario.</li></ul><p>Per l'effettuazione della pratica, non necessita pi\xF9 che l'interessato acquisti la marca da bollo da \u20AC 16,00, in quanto questa \xE8 stata sostituita dalla normativa con un bollettino postale di pari importo. Lo studio medico ha gi\xE0 a disposizione i bollettini pre-pagati di \u20AC 16,00 (+ \u20AC 1,80 di tasse postali) e \u20AC 9,00 \u20AC (+ \u20AC 1,80 di tasse postali). Tramite il collegamento in tempo reale con il Portale dell'Automobilista, il sanitario rilascer\xE0 all'interessato la ricevuta dell'avvenuto rinnovo e, dopo pochi giorni, la patente di guida sar\xE0 recapitata per posta assicurata.</p><p>Con il solo pagamento del certificato medico (senza spese aggiuntive) la pratica per il rinnovo della patente \xE8 da considerarsi conclusa, senza che l'interessato debba recarsi presso agenzie e/o autoscuole.</p>",
          "duplicato": "<p>Nel caso che l'interessato necessiti di effettuare un duplicato della propria patente di guida (o per smarrimento o per deterioramento) potr\xE0 effettuare presso il nostro studio la visita per il rilascio del certificato medico utile alla pratica. L'interessato dovr\xE0 venire munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>una marca da bollo di \u20AC 16.00;</li><li>nr. 3 foto-tessere recenti;</li><li>occhiali o lenti a contatto se necessario.</li></ul>"
        },
        "Altre Patenti": {
          "Conseguimento": "<p>Per il certificato medico di idoneit\xE0 psicofisica al conseguimento della patente di guida occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>certificato medico anamnestico rilasciato dal proprio medico di famiglia;</li><li>nr. 3 foto-tessere recenti;</li><li>una marca da bollo di \u20AC 16,00;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          "Rinnovo": "<p>Per il rilascio del certificato medico utile al rinnovo della patente di guida, occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>una foto-tessera recente;</li><li>occhiali o lenti a contatto se necessario.</li></ul><p>Per l'effettuazione della pratica, non necessita pi\xF9 che l'interessato acquisti la marca da bollo da \u20AC 16,00, in quanto questa \xE8 stata sostituita dalla normativa con un bollettino postale di pari importo. Lo studio medico ha gi\xE0 a disposizione i bollettini pre-pagati di \u20AC 16,00 (+ \u20AC 1,80 di tasse postali) e \u20AC 9,00 \u20AC (+ \u20AC 1,80 di tasse postali).</p><p>Tramite il collegamento in tempo reale con il Portale dell'Automobilista, il sanitario rilascer\xE0 subito all'interessato la ricevuta dell'avvenuto rinnovo e, dopo pochi giorni, ricever\xE0 il duplicato della patente di guida per posta assicurata.</p>",
          "duplicato": "<p>Nel caso che l'interessato necessiti di effettuare un duplicato della propria patente di guida (o per smarrimento o per deterioramento) potr\xE0 effettuare presso il nostro studio la visita per il rilascio del certificato medico utile alla pratica. L'interessato dovr\xE0 venire munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identit\xE0 in corso di validit\xE0;</li><li>una marca da bollo di \u20AC 16.00;</li><li>nr. 3 foto-tessere recenti;</li><li>occhiali o lenti a contatto se necessario.</li></ul>"
        },
        "Certificato SPORT": "I sanitari dello Studio Medico Izzo-Arduino sono autorizzati alle visite mediche e al rilascio del certificato medico per l'idoneit\xE0 all'attivit\xE0 sportiva non agonistica.",
        "Certificato ARMI": "I sanitari dello Studio Medico Izzo-Arduino sono autorizzati al rilascio/rinnovo del Porto d'Armi, sia per uso sportivo e caccia (art. 1) che difesa personale (art. 2), e la detenzione.",
        "Certificato VOLO": "<p>I sanitari dello Studio Medico Izzo-Arduino sono autorizzati alle visite mediche finalizzate al rilascio dei seguenti certificati:</p><ul class='my-6 list-disc list-inside'><li>certificazioni ENAC di II Classe (pilota privato di aeromobili - PPL);</li><li>certificazioni per volo da diporto sportivo (ultraleggeri);</li><li>certificazioni per paracadutismo sportivo;</li><li>certificazioni per cabin crew o assistente di volo;</li><li>certificazioni per piloti di velivoli a pilotaggio remoto (DRONI).</li></ul>",
        "ALTRO": "<p>I sanitari dello Studio Medico Izzo-Arduino sono autorizzati alle visite mediche ed al rilascio dei seguenti certificati medici:</p><ul class='my-6 list-disc list-inside'><li>certificato medico di idoneit\xE0 specifica (sana e robusta costituzione fisica) a una determinata attivit\xE0 lavorativa, che di solito viene richiesto all'interessato dal datore di lavoro all'atto di assunzione (Pubblica Amministrazione, Scuola, Camera Commercio, ecc.);</li><li>certificato medico attestante uno stato di buona salute (sana e robusta costituzione fisica) e un giudizio sanitario favorevole al rilascio di prestiti erogati ai dipendenti da Enti pubblici (INPDAP) o societ\xE0 private.</li></ul>"
      }
    },
    crumbs: ["Certificati"],
    filteredDb: null,
    currentCardIndex: 0,
    get currentDb() {
      return this.filteredDb || this.db["Certificati"];
    },
    get cards() {
      return typeof this.currentDb === "string" ? this.currentDb : Object.keys(this.currentDb);
    },
    start: {
      ["@click.prevent"]() {
        this.filteredDb = null;
        this.crumbs = ["Certificati"];
        this.currentCardIndex = 0;
      }
    },
    selectCard(card) {
      this.crumbs.push(card);
      this.filteredDb = this.currentDb[card];
      this.currentCardIndex = 0;
    },
    selectCrumb(crumb) {
      if (this.crumbs.findIndex((e) => e == crumb) == this.crumbs.length - 1)
        return;
      const truncatedCrumbs = this.crumbs.slice(0, this.crumbs.findIndex((e) => e == crumb) + 1);
      this.filteredDb = null;
      this.crumbs = truncatedCrumbs.slice(0, -1).length ? truncatedCrumbs.slice(0, -1) : ["Certificati"];
      this.currentCardIndex = 0;
      truncatedCrumbs.slice(1).forEach((crumb2) => this.selectCard(crumb2));
    }
  });

  // src/main.js
  window.Alpine = module_default;
  module_default.data("cards", cards_default);
  module_default.start();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzL2FscGluZWpzL2Rpc3QvbW9kdWxlLmVzbS5qcyIsICJzcmMvY2FyZHMuanMiLCAic3JjL21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9zY2hlZHVsZXIuanNcbnZhciBmbHVzaFBlbmRpbmcgPSBmYWxzZTtcbnZhciBmbHVzaGluZyA9IGZhbHNlO1xudmFyIHF1ZXVlID0gW107XG52YXIgbGFzdEZsdXNoZWRJbmRleCA9IC0xO1xuZnVuY3Rpb24gc2NoZWR1bGVyKGNhbGxiYWNrKSB7XG4gIHF1ZXVlSm9iKGNhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIHF1ZXVlSm9iKGpvYikge1xuICBpZiAoIXF1ZXVlLmluY2x1ZGVzKGpvYikpXG4gICAgcXVldWUucHVzaChqb2IpO1xuICBxdWV1ZUZsdXNoKCk7XG59XG5mdW5jdGlvbiBkZXF1ZXVlSm9iKGpvYikge1xuICBsZXQgaW5kZXggPSBxdWV1ZS5pbmRleE9mKGpvYik7XG4gIGlmIChpbmRleCAhPT0gLTEgJiYgaW5kZXggPiBsYXN0Rmx1c2hlZEluZGV4KVxuICAgIHF1ZXVlLnNwbGljZShpbmRleCwgMSk7XG59XG5mdW5jdGlvbiBxdWV1ZUZsdXNoKCkge1xuICBpZiAoIWZsdXNoaW5nICYmICFmbHVzaFBlbmRpbmcpIHtcbiAgICBmbHVzaFBlbmRpbmcgPSB0cnVlO1xuICAgIHF1ZXVlTWljcm90YXNrKGZsdXNoSm9icyk7XG4gIH1cbn1cbmZ1bmN0aW9uIGZsdXNoSm9icygpIHtcbiAgZmx1c2hQZW5kaW5nID0gZmFsc2U7XG4gIGZsdXNoaW5nID0gdHJ1ZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgIHF1ZXVlW2ldKCk7XG4gICAgbGFzdEZsdXNoZWRJbmRleCA9IGk7XG4gIH1cbiAgcXVldWUubGVuZ3RoID0gMDtcbiAgbGFzdEZsdXNoZWRJbmRleCA9IC0xO1xuICBmbHVzaGluZyA9IGZhbHNlO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvcmVhY3Rpdml0eS5qc1xudmFyIHJlYWN0aXZlO1xudmFyIGVmZmVjdDtcbnZhciByZWxlYXNlO1xudmFyIHJhdztcbnZhciBzaG91bGRTY2hlZHVsZSA9IHRydWU7XG5mdW5jdGlvbiBkaXNhYmxlRWZmZWN0U2NoZWR1bGluZyhjYWxsYmFjaykge1xuICBzaG91bGRTY2hlZHVsZSA9IGZhbHNlO1xuICBjYWxsYmFjaygpO1xuICBzaG91bGRTY2hlZHVsZSA9IHRydWU7XG59XG5mdW5jdGlvbiBzZXRSZWFjdGl2aXR5RW5naW5lKGVuZ2luZSkge1xuICByZWFjdGl2ZSA9IGVuZ2luZS5yZWFjdGl2ZTtcbiAgcmVsZWFzZSA9IGVuZ2luZS5yZWxlYXNlO1xuICBlZmZlY3QgPSAoY2FsbGJhY2spID0+IGVuZ2luZS5lZmZlY3QoY2FsbGJhY2ssIHsgc2NoZWR1bGVyOiAodGFzaykgPT4ge1xuICAgIGlmIChzaG91bGRTY2hlZHVsZSkge1xuICAgICAgc2NoZWR1bGVyKHRhc2spO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YXNrKCk7XG4gICAgfVxuICB9IH0pO1xuICByYXcgPSBlbmdpbmUucmF3O1xufVxuZnVuY3Rpb24gb3ZlcnJpZGVFZmZlY3Qob3ZlcnJpZGUpIHtcbiAgZWZmZWN0ID0gb3ZlcnJpZGU7XG59XG5mdW5jdGlvbiBlbGVtZW50Qm91bmRFZmZlY3QoZWwpIHtcbiAgbGV0IGNsZWFudXAyID0gKCkgPT4ge1xuICB9O1xuICBsZXQgd3JhcHBlZEVmZmVjdCA9IChjYWxsYmFjaykgPT4ge1xuICAgIGxldCBlZmZlY3RSZWZlcmVuY2UgPSBlZmZlY3QoY2FsbGJhY2spO1xuICAgIGlmICghZWwuX3hfZWZmZWN0cykge1xuICAgICAgZWwuX3hfZWZmZWN0cyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gICAgICBlbC5feF9ydW5FZmZlY3RzID0gKCkgPT4ge1xuICAgICAgICBlbC5feF9lZmZlY3RzLmZvckVhY2goKGkpID0+IGkoKSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBlbC5feF9lZmZlY3RzLmFkZChlZmZlY3RSZWZlcmVuY2UpO1xuICAgIGNsZWFudXAyID0gKCkgPT4ge1xuICAgICAgaWYgKGVmZmVjdFJlZmVyZW5jZSA9PT0gdm9pZCAwKVxuICAgICAgICByZXR1cm47XG4gICAgICBlbC5feF9lZmZlY3RzLmRlbGV0ZShlZmZlY3RSZWZlcmVuY2UpO1xuICAgICAgcmVsZWFzZShlZmZlY3RSZWZlcmVuY2UpO1xuICAgIH07XG4gICAgcmV0dXJuIGVmZmVjdFJlZmVyZW5jZTtcbiAgfTtcbiAgcmV0dXJuIFt3cmFwcGVkRWZmZWN0LCAoKSA9PiB7XG4gICAgY2xlYW51cDIoKTtcbiAgfV07XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy91dGlscy9kaXNwYXRjaC5qc1xuZnVuY3Rpb24gZGlzcGF0Y2goZWwsIG5hbWUsIGRldGFpbCA9IHt9KSB7XG4gIGVsLmRpc3BhdGNoRXZlbnQoXG4gICAgbmV3IEN1c3RvbUV2ZW50KG5hbWUsIHtcbiAgICAgIGRldGFpbCxcbiAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICAvLyBBbGxvd3MgZXZlbnRzIHRvIHBhc3MgdGhlIHNoYWRvdyBET00gYmFycmllci5cbiAgICAgIGNvbXBvc2VkOiB0cnVlLFxuICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxuICAgIH0pXG4gICk7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy91dGlscy93YWxrLmpzXG5mdW5jdGlvbiB3YWxrKGVsLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIFNoYWRvd1Jvb3QgPT09IFwiZnVuY3Rpb25cIiAmJiBlbCBpbnN0YW5jZW9mIFNoYWRvd1Jvb3QpIHtcbiAgICBBcnJheS5mcm9tKGVsLmNoaWxkcmVuKS5mb3JFYWNoKChlbDIpID0+IHdhbGsoZWwyLCBjYWxsYmFjaykpO1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgc2tpcCA9IGZhbHNlO1xuICBjYWxsYmFjayhlbCwgKCkgPT4gc2tpcCA9IHRydWUpO1xuICBpZiAoc2tpcClcbiAgICByZXR1cm47XG4gIGxldCBub2RlID0gZWwuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgd2Fsayhub2RlLCBjYWxsYmFjaywgZmFsc2UpO1xuICAgIG5vZGUgPSBub2RlLm5leHRFbGVtZW50U2libGluZztcbiAgfVxufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvdXRpbHMvd2Fybi5qc1xuZnVuY3Rpb24gd2FybihtZXNzYWdlLCAuLi5hcmdzKSB7XG4gIGNvbnNvbGUud2FybihgQWxwaW5lIFdhcm5pbmc6ICR7bWVzc2FnZX1gLCAuLi5hcmdzKTtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2xpZmVjeWNsZS5qc1xudmFyIHN0YXJ0ZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIHN0YXJ0KCkge1xuICBpZiAoc3RhcnRlZClcbiAgICB3YXJuKFwiQWxwaW5lIGhhcyBhbHJlYWR5IGJlZW4gaW5pdGlhbGl6ZWQgb24gdGhpcyBwYWdlLiBDYWxsaW5nIEFscGluZS5zdGFydCgpIG1vcmUgdGhhbiBvbmNlIGNhbiBjYXVzZSBwcm9ibGVtcy5cIik7XG4gIHN0YXJ0ZWQgPSB0cnVlO1xuICBpZiAoIWRvY3VtZW50LmJvZHkpXG4gICAgd2FybihcIlVuYWJsZSB0byBpbml0aWFsaXplLiBUcnlpbmcgdG8gbG9hZCBBbHBpbmUgYmVmb3JlIGA8Ym9keT5gIGlzIGF2YWlsYWJsZS4gRGlkIHlvdSBmb3JnZXQgdG8gYWRkIGBkZWZlcmAgaW4gQWxwaW5lJ3MgYDxzY3JpcHQ+YCB0YWc/XCIpO1xuICBkaXNwYXRjaChkb2N1bWVudCwgXCJhbHBpbmU6aW5pdFwiKTtcbiAgZGlzcGF0Y2goZG9jdW1lbnQsIFwiYWxwaW5lOmluaXRpYWxpemluZ1wiKTtcbiAgc3RhcnRPYnNlcnZpbmdNdXRhdGlvbnMoKTtcbiAgb25FbEFkZGVkKChlbCkgPT4gaW5pdFRyZWUoZWwsIHdhbGspKTtcbiAgb25FbFJlbW92ZWQoKGVsKSA9PiBkZXN0cm95VHJlZShlbCkpO1xuICBvbkF0dHJpYnV0ZXNBZGRlZCgoZWwsIGF0dHJzKSA9PiB7XG4gICAgZGlyZWN0aXZlcyhlbCwgYXR0cnMpLmZvckVhY2goKGhhbmRsZSkgPT4gaGFuZGxlKCkpO1xuICB9KTtcbiAgbGV0IG91dE5lc3RlZENvbXBvbmVudHMgPSAoZWwpID0+ICFjbG9zZXN0Um9vdChlbC5wYXJlbnRFbGVtZW50LCB0cnVlKTtcbiAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGFsbFNlbGVjdG9ycygpLmpvaW4oXCIsXCIpKSkuZmlsdGVyKG91dE5lc3RlZENvbXBvbmVudHMpLmZvckVhY2goKGVsKSA9PiB7XG4gICAgaW5pdFRyZWUoZWwpO1xuICB9KTtcbiAgZGlzcGF0Y2goZG9jdW1lbnQsIFwiYWxwaW5lOmluaXRpYWxpemVkXCIpO1xufVxudmFyIHJvb3RTZWxlY3RvckNhbGxiYWNrcyA9IFtdO1xudmFyIGluaXRTZWxlY3RvckNhbGxiYWNrcyA9IFtdO1xuZnVuY3Rpb24gcm9vdFNlbGVjdG9ycygpIHtcbiAgcmV0dXJuIHJvb3RTZWxlY3RvckNhbGxiYWNrcy5tYXAoKGZuKSA9PiBmbigpKTtcbn1cbmZ1bmN0aW9uIGFsbFNlbGVjdG9ycygpIHtcbiAgcmV0dXJuIHJvb3RTZWxlY3RvckNhbGxiYWNrcy5jb25jYXQoaW5pdFNlbGVjdG9yQ2FsbGJhY2tzKS5tYXAoKGZuKSA9PiBmbigpKTtcbn1cbmZ1bmN0aW9uIGFkZFJvb3RTZWxlY3RvcihzZWxlY3RvckNhbGxiYWNrKSB7XG4gIHJvb3RTZWxlY3RvckNhbGxiYWNrcy5wdXNoKHNlbGVjdG9yQ2FsbGJhY2spO1xufVxuZnVuY3Rpb24gYWRkSW5pdFNlbGVjdG9yKHNlbGVjdG9yQ2FsbGJhY2spIHtcbiAgaW5pdFNlbGVjdG9yQ2FsbGJhY2tzLnB1c2goc2VsZWN0b3JDYWxsYmFjayk7XG59XG5mdW5jdGlvbiBjbG9zZXN0Um9vdChlbCwgaW5jbHVkZUluaXRTZWxlY3RvcnMgPSBmYWxzZSkge1xuICByZXR1cm4gZmluZENsb3Nlc3QoZWwsIChlbGVtZW50KSA9PiB7XG4gICAgY29uc3Qgc2VsZWN0b3JzID0gaW5jbHVkZUluaXRTZWxlY3RvcnMgPyBhbGxTZWxlY3RvcnMoKSA6IHJvb3RTZWxlY3RvcnMoKTtcbiAgICBpZiAoc2VsZWN0b3JzLnNvbWUoKHNlbGVjdG9yKSA9PiBlbGVtZW50Lm1hdGNoZXMoc2VsZWN0b3IpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn1cbmZ1bmN0aW9uIGZpbmRDbG9zZXN0KGVsLCBjYWxsYmFjaykge1xuICBpZiAoIWVsKVxuICAgIHJldHVybjtcbiAgaWYgKGNhbGxiYWNrKGVsKSlcbiAgICByZXR1cm4gZWw7XG4gIGlmIChlbC5feF90ZWxlcG9ydEJhY2spXG4gICAgZWwgPSBlbC5feF90ZWxlcG9ydEJhY2s7XG4gIGlmICghZWwucGFyZW50RWxlbWVudClcbiAgICByZXR1cm47XG4gIHJldHVybiBmaW5kQ2xvc2VzdChlbC5wYXJlbnRFbGVtZW50LCBjYWxsYmFjayk7XG59XG5mdW5jdGlvbiBpc1Jvb3QoZWwpIHtcbiAgcmV0dXJuIHJvb3RTZWxlY3RvcnMoKS5zb21lKChzZWxlY3RvcikgPT4gZWwubWF0Y2hlcyhzZWxlY3RvcikpO1xufVxudmFyIGluaXRJbnRlcmNlcHRvcnMgPSBbXTtcbmZ1bmN0aW9uIGludGVyY2VwdEluaXQoY2FsbGJhY2spIHtcbiAgaW5pdEludGVyY2VwdG9ycy5wdXNoKGNhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGluaXRUcmVlKGVsLCB3YWxrZXIgPSB3YWxrLCBpbnRlcmNlcHQgPSAoKSA9PiB7XG59KSB7XG4gIGRlZmVySGFuZGxpbmdEaXJlY3RpdmVzKCgpID0+IHtcbiAgICB3YWxrZXIoZWwsIChlbDIsIHNraXApID0+IHtcbiAgICAgIGludGVyY2VwdChlbDIsIHNraXApO1xuICAgICAgaW5pdEludGVyY2VwdG9ycy5mb3JFYWNoKChpKSA9PiBpKGVsMiwgc2tpcCkpO1xuICAgICAgZGlyZWN0aXZlcyhlbDIsIGVsMi5hdHRyaWJ1dGVzKS5mb3JFYWNoKChoYW5kbGUpID0+IGhhbmRsZSgpKTtcbiAgICAgIGVsMi5feF9pZ25vcmUgJiYgc2tpcCgpO1xuICAgIH0pO1xuICB9KTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lUcmVlKHJvb3QpIHtcbiAgd2Fsayhyb290LCAoZWwpID0+IHtcbiAgICBjbGVhbnVwQXR0cmlidXRlcyhlbCk7XG4gICAgY2xlYW51cEVsZW1lbnQoZWwpO1xuICB9KTtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL211dGF0aW9uLmpzXG52YXIgb25BdHRyaWJ1dGVBZGRlZHMgPSBbXTtcbnZhciBvbkVsUmVtb3ZlZHMgPSBbXTtcbnZhciBvbkVsQWRkZWRzID0gW107XG5mdW5jdGlvbiBvbkVsQWRkZWQoY2FsbGJhY2spIHtcbiAgb25FbEFkZGVkcy5wdXNoKGNhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIG9uRWxSZW1vdmVkKGVsLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBpZiAoIWVsLl94X2NsZWFudXBzKVxuICAgICAgZWwuX3hfY2xlYW51cHMgPSBbXTtcbiAgICBlbC5feF9jbGVhbnVwcy5wdXNoKGNhbGxiYWNrKTtcbiAgfSBlbHNlIHtcbiAgICBjYWxsYmFjayA9IGVsO1xuICAgIG9uRWxSZW1vdmVkcy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuZnVuY3Rpb24gb25BdHRyaWJ1dGVzQWRkZWQoY2FsbGJhY2spIHtcbiAgb25BdHRyaWJ1dGVBZGRlZHMucHVzaChjYWxsYmFjayk7XG59XG5mdW5jdGlvbiBvbkF0dHJpYnV0ZVJlbW92ZWQoZWwsIG5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmICghZWwuX3hfYXR0cmlidXRlQ2xlYW51cHMpXG4gICAgZWwuX3hfYXR0cmlidXRlQ2xlYW51cHMgPSB7fTtcbiAgaWYgKCFlbC5feF9hdHRyaWJ1dGVDbGVhbnVwc1tuYW1lXSlcbiAgICBlbC5feF9hdHRyaWJ1dGVDbGVhbnVwc1tuYW1lXSA9IFtdO1xuICBlbC5feF9hdHRyaWJ1dGVDbGVhbnVwc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGNsZWFudXBBdHRyaWJ1dGVzKGVsLCBuYW1lcykge1xuICBpZiAoIWVsLl94X2F0dHJpYnV0ZUNsZWFudXBzKVxuICAgIHJldHVybjtcbiAgT2JqZWN0LmVudHJpZXMoZWwuX3hfYXR0cmlidXRlQ2xlYW51cHMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICBpZiAobmFtZXMgPT09IHZvaWQgMCB8fCBuYW1lcy5pbmNsdWRlcyhuYW1lKSkge1xuICAgICAgdmFsdWUuZm9yRWFjaCgoaSkgPT4gaSgpKTtcbiAgICAgIGRlbGV0ZSBlbC5feF9hdHRyaWJ1dGVDbGVhbnVwc1tuYW1lXTtcbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gY2xlYW51cEVsZW1lbnQoZWwpIHtcbiAgaWYgKGVsLl94X2NsZWFudXBzKSB7XG4gICAgd2hpbGUgKGVsLl94X2NsZWFudXBzLmxlbmd0aClcbiAgICAgIGVsLl94X2NsZWFudXBzLnBvcCgpKCk7XG4gIH1cbn1cbnZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKG9uTXV0YXRlKTtcbnZhciBjdXJyZW50bHlPYnNlcnZpbmcgPSBmYWxzZTtcbmZ1bmN0aW9uIHN0YXJ0T2JzZXJ2aW5nTXV0YXRpb25zKCkge1xuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LCB7IHN1YnRyZWU6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgYXR0cmlidXRlczogdHJ1ZSwgYXR0cmlidXRlT2xkVmFsdWU6IHRydWUgfSk7XG4gIGN1cnJlbnRseU9ic2VydmluZyA9IHRydWU7XG59XG5mdW5jdGlvbiBzdG9wT2JzZXJ2aW5nTXV0YXRpb25zKCkge1xuICBmbHVzaE9ic2VydmVyKCk7XG4gIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgY3VycmVudGx5T2JzZXJ2aW5nID0gZmFsc2U7XG59XG52YXIgcmVjb3JkUXVldWUgPSBbXTtcbnZhciB3aWxsUHJvY2Vzc1JlY29yZFF1ZXVlID0gZmFsc2U7XG5mdW5jdGlvbiBmbHVzaE9ic2VydmVyKCkge1xuICByZWNvcmRRdWV1ZSA9IHJlY29yZFF1ZXVlLmNvbmNhdChvYnNlcnZlci50YWtlUmVjb3JkcygpKTtcbiAgaWYgKHJlY29yZFF1ZXVlLmxlbmd0aCAmJiAhd2lsbFByb2Nlc3NSZWNvcmRRdWV1ZSkge1xuICAgIHdpbGxQcm9jZXNzUmVjb3JkUXVldWUgPSB0cnVlO1xuICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgIHByb2Nlc3NSZWNvcmRRdWV1ZSgpO1xuICAgICAgd2lsbFByb2Nlc3NSZWNvcmRRdWV1ZSA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG59XG5mdW5jdGlvbiBwcm9jZXNzUmVjb3JkUXVldWUoKSB7XG4gIG9uTXV0YXRlKHJlY29yZFF1ZXVlKTtcbiAgcmVjb3JkUXVldWUubGVuZ3RoID0gMDtcbn1cbmZ1bmN0aW9uIG11dGF0ZURvbShjYWxsYmFjaykge1xuICBpZiAoIWN1cnJlbnRseU9ic2VydmluZylcbiAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgc3RvcE9ic2VydmluZ011dGF0aW9ucygpO1xuICBsZXQgcmVzdWx0ID0gY2FsbGJhY2soKTtcbiAgc3RhcnRPYnNlcnZpbmdNdXRhdGlvbnMoKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cbnZhciBpc0NvbGxlY3RpbmcgPSBmYWxzZTtcbnZhciBkZWZlcnJlZE11dGF0aW9ucyA9IFtdO1xuZnVuY3Rpb24gZGVmZXJNdXRhdGlvbnMoKSB7XG4gIGlzQ29sbGVjdGluZyA9IHRydWU7XG59XG5mdW5jdGlvbiBmbHVzaEFuZFN0b3BEZWZlcnJpbmdNdXRhdGlvbnMoKSB7XG4gIGlzQ29sbGVjdGluZyA9IGZhbHNlO1xuICBvbk11dGF0ZShkZWZlcnJlZE11dGF0aW9ucyk7XG4gIGRlZmVycmVkTXV0YXRpb25zID0gW107XG59XG5mdW5jdGlvbiBvbk11dGF0ZShtdXRhdGlvbnMpIHtcbiAgaWYgKGlzQ29sbGVjdGluZykge1xuICAgIGRlZmVycmVkTXV0YXRpb25zID0gZGVmZXJyZWRNdXRhdGlvbnMuY29uY2F0KG11dGF0aW9ucyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBhZGRlZE5vZGVzID0gW107XG4gIGxldCByZW1vdmVkTm9kZXMgPSBbXTtcbiAgbGV0IGFkZGVkQXR0cmlidXRlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gIGxldCByZW1vdmVkQXR0cmlidXRlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbXV0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKG11dGF0aW9uc1tpXS50YXJnZXQuX3hfaWdub3JlTXV0YXRpb25PYnNlcnZlcilcbiAgICAgIGNvbnRpbnVlO1xuICAgIGlmIChtdXRhdGlvbnNbaV0udHlwZSA9PT0gXCJjaGlsZExpc3RcIikge1xuICAgICAgbXV0YXRpb25zW2ldLmFkZGVkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4gbm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBhZGRlZE5vZGVzLnB1c2gobm9kZSkpO1xuICAgICAgbXV0YXRpb25zW2ldLnJlbW92ZWROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSAxICYmIHJlbW92ZWROb2Rlcy5wdXNoKG5vZGUpKTtcbiAgICB9XG4gICAgaWYgKG11dGF0aW9uc1tpXS50eXBlID09PSBcImF0dHJpYnV0ZXNcIikge1xuICAgICAgbGV0IGVsID0gbXV0YXRpb25zW2ldLnRhcmdldDtcbiAgICAgIGxldCBuYW1lID0gbXV0YXRpb25zW2ldLmF0dHJpYnV0ZU5hbWU7XG4gICAgICBsZXQgb2xkVmFsdWUgPSBtdXRhdGlvbnNbaV0ub2xkVmFsdWU7XG4gICAgICBsZXQgYWRkMiA9ICgpID0+IHtcbiAgICAgICAgaWYgKCFhZGRlZEF0dHJpYnV0ZXMuaGFzKGVsKSlcbiAgICAgICAgICBhZGRlZEF0dHJpYnV0ZXMuc2V0KGVsLCBbXSk7XG4gICAgICAgIGFkZGVkQXR0cmlidXRlcy5nZXQoZWwpLnB1c2goeyBuYW1lLCB2YWx1ZTogZWwuZ2V0QXR0cmlidXRlKG5hbWUpIH0pO1xuICAgICAgfTtcbiAgICAgIGxldCByZW1vdmUgPSAoKSA9PiB7XG4gICAgICAgIGlmICghcmVtb3ZlZEF0dHJpYnV0ZXMuaGFzKGVsKSlcbiAgICAgICAgICByZW1vdmVkQXR0cmlidXRlcy5zZXQoZWwsIFtdKTtcbiAgICAgICAgcmVtb3ZlZEF0dHJpYnV0ZXMuZ2V0KGVsKS5wdXNoKG5hbWUpO1xuICAgICAgfTtcbiAgICAgIGlmIChlbC5oYXNBdHRyaWJ1dGUobmFtZSkgJiYgb2xkVmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgYWRkMigpO1xuICAgICAgfSBlbHNlIGlmIChlbC5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcbiAgICAgICAgcmVtb3ZlKCk7XG4gICAgICAgIGFkZDIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbW92ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZW1vdmVkQXR0cmlidXRlcy5mb3JFYWNoKChhdHRycywgZWwpID0+IHtcbiAgICBjbGVhbnVwQXR0cmlidXRlcyhlbCwgYXR0cnMpO1xuICB9KTtcbiAgYWRkZWRBdHRyaWJ1dGVzLmZvckVhY2goKGF0dHJzLCBlbCkgPT4ge1xuICAgIG9uQXR0cmlidXRlQWRkZWRzLmZvckVhY2goKGkpID0+IGkoZWwsIGF0dHJzKSk7XG4gIH0pO1xuICBmb3IgKGxldCBub2RlIG9mIHJlbW92ZWROb2Rlcykge1xuICAgIGlmIChhZGRlZE5vZGVzLmluY2x1ZGVzKG5vZGUpKVxuICAgICAgY29udGludWU7XG4gICAgb25FbFJlbW92ZWRzLmZvckVhY2goKGkpID0+IGkobm9kZSkpO1xuICAgIGRlc3Ryb3lUcmVlKG5vZGUpO1xuICB9XG4gIGFkZGVkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgIG5vZGUuX3hfaWdub3JlU2VsZiA9IHRydWU7XG4gICAgbm9kZS5feF9pZ25vcmUgPSB0cnVlO1xuICB9KTtcbiAgZm9yIChsZXQgbm9kZSBvZiBhZGRlZE5vZGVzKSB7XG4gICAgaWYgKHJlbW92ZWROb2Rlcy5pbmNsdWRlcyhub2RlKSlcbiAgICAgIGNvbnRpbnVlO1xuICAgIGlmICghbm9kZS5pc0Nvbm5lY3RlZClcbiAgICAgIGNvbnRpbnVlO1xuICAgIGRlbGV0ZSBub2RlLl94X2lnbm9yZVNlbGY7XG4gICAgZGVsZXRlIG5vZGUuX3hfaWdub3JlO1xuICAgIG9uRWxBZGRlZHMuZm9yRWFjaCgoaSkgPT4gaShub2RlKSk7XG4gICAgbm9kZS5feF9pZ25vcmUgPSB0cnVlO1xuICAgIG5vZGUuX3hfaWdub3JlU2VsZiA9IHRydWU7XG4gIH1cbiAgYWRkZWROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgZGVsZXRlIG5vZGUuX3hfaWdub3JlU2VsZjtcbiAgICBkZWxldGUgbm9kZS5feF9pZ25vcmU7XG4gIH0pO1xuICBhZGRlZE5vZGVzID0gbnVsbDtcbiAgcmVtb3ZlZE5vZGVzID0gbnVsbDtcbiAgYWRkZWRBdHRyaWJ1dGVzID0gbnVsbDtcbiAgcmVtb3ZlZEF0dHJpYnV0ZXMgPSBudWxsO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvc2NvcGUuanNcbmZ1bmN0aW9uIHNjb3BlKG5vZGUpIHtcbiAgcmV0dXJuIG1lcmdlUHJveGllcyhjbG9zZXN0RGF0YVN0YWNrKG5vZGUpKTtcbn1cbmZ1bmN0aW9uIGFkZFNjb3BlVG9Ob2RlKG5vZGUsIGRhdGEyLCByZWZlcmVuY2VOb2RlKSB7XG4gIG5vZGUuX3hfZGF0YVN0YWNrID0gW2RhdGEyLCAuLi5jbG9zZXN0RGF0YVN0YWNrKHJlZmVyZW5jZU5vZGUgfHwgbm9kZSldO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIG5vZGUuX3hfZGF0YVN0YWNrID0gbm9kZS5feF9kYXRhU3RhY2suZmlsdGVyKChpKSA9PiBpICE9PSBkYXRhMik7XG4gIH07XG59XG5mdW5jdGlvbiBjbG9zZXN0RGF0YVN0YWNrKG5vZGUpIHtcbiAgaWYgKG5vZGUuX3hfZGF0YVN0YWNrKVxuICAgIHJldHVybiBub2RlLl94X2RhdGFTdGFjaztcbiAgaWYgKHR5cGVvZiBTaGFkb3dSb290ID09PSBcImZ1bmN0aW9uXCIgJiYgbm9kZSBpbnN0YW5jZW9mIFNoYWRvd1Jvb3QpIHtcbiAgICByZXR1cm4gY2xvc2VzdERhdGFTdGFjayhub2RlLmhvc3QpO1xuICB9XG4gIGlmICghbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBjbG9zZXN0RGF0YVN0YWNrKG5vZGUucGFyZW50Tm9kZSk7XG59XG5mdW5jdGlvbiBtZXJnZVByb3hpZXMob2JqZWN0cykge1xuICByZXR1cm4gbmV3IFByb3h5KHsgb2JqZWN0cyB9LCBtZXJnZVByb3h5VHJhcCk7XG59XG52YXIgbWVyZ2VQcm94eVRyYXAgPSB7XG4gIG93bktleXMoeyBvYmplY3RzIH0pIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShcbiAgICAgIG5ldyBTZXQob2JqZWN0cy5mbGF0TWFwKChpKSA9PiBPYmplY3Qua2V5cyhpKSkpXG4gICAgKTtcbiAgfSxcbiAgaGFzKHsgb2JqZWN0cyB9LCBuYW1lKSB7XG4gICAgaWYgKG5hbWUgPT0gU3ltYm9sLnVuc2NvcGFibGVzKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBvYmplY3RzLnNvbWUoXG4gICAgICAob2JqKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBuYW1lKVxuICAgICk7XG4gIH0sXG4gIGdldCh7IG9iamVjdHMgfSwgbmFtZSwgdGhpc1Byb3h5KSB7XG4gICAgaWYgKG5hbWUgPT0gXCJ0b0pTT05cIilcbiAgICAgIHJldHVybiBjb2xsYXBzZVByb3hpZXM7XG4gICAgcmV0dXJuIFJlZmxlY3QuZ2V0KFxuICAgICAgb2JqZWN0cy5maW5kKFxuICAgICAgICAob2JqKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBuYW1lKVxuICAgICAgKSB8fCB7fSxcbiAgICAgIG5hbWUsXG4gICAgICB0aGlzUHJveHlcbiAgICApO1xuICB9LFxuICBzZXQoeyBvYmplY3RzIH0sIG5hbWUsIHZhbHVlLCB0aGlzUHJveHkpIHtcbiAgICBjb25zdCB0YXJnZXQgPSBvYmplY3RzLmZpbmQoXG4gICAgICAob2JqKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBuYW1lKVxuICAgICkgfHwgb2JqZWN0c1tvYmplY3RzLmxlbmd0aCAtIDFdO1xuICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgbmFtZSk7XG4gICAgaWYgKGRlc2NyaXB0b3I/LnNldCAmJiBkZXNjcmlwdG9yPy5nZXQpXG4gICAgICByZXR1cm4gUmVmbGVjdC5zZXQodGFyZ2V0LCBuYW1lLCB2YWx1ZSwgdGhpc1Byb3h5KTtcbiAgICByZXR1cm4gUmVmbGVjdC5zZXQodGFyZ2V0LCBuYW1lLCB2YWx1ZSk7XG4gIH1cbn07XG5mdW5jdGlvbiBjb2xsYXBzZVByb3hpZXMoKSB7XG4gIGxldCBrZXlzID0gUmVmbGVjdC5vd25LZXlzKHRoaXMpO1xuICByZXR1cm4ga2V5cy5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gICAgYWNjW2tleV0gPSBSZWZsZWN0LmdldCh0aGlzLCBrZXkpO1xuICAgIHJldHVybiBhY2M7XG4gIH0sIHt9KTtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2ludGVyY2VwdG9yLmpzXG5mdW5jdGlvbiBpbml0SW50ZXJjZXB0b3JzMihkYXRhMikge1xuICBsZXQgaXNPYmplY3QyID0gKHZhbCkgPT4gdHlwZW9mIHZhbCA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheSh2YWwpICYmIHZhbCAhPT0gbnVsbDtcbiAgbGV0IHJlY3Vyc2UgPSAob2JqLCBiYXNlUGF0aCA9IFwiXCIpID0+IHtcbiAgICBPYmplY3QuZW50cmllcyhPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhvYmopKS5mb3JFYWNoKChba2V5LCB7IHZhbHVlLCBlbnVtZXJhYmxlIH1dKSA9PiB7XG4gICAgICBpZiAoZW51bWVyYWJsZSA9PT0gZmFsc2UgfHwgdmFsdWUgPT09IHZvaWQgMClcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbGV0IHBhdGggPSBiYXNlUGF0aCA9PT0gXCJcIiA/IGtleSA6IGAke2Jhc2VQYXRofS4ke2tleX1gO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZS5feF9pbnRlcmNlcHRvcikge1xuICAgICAgICBvYmpba2V5XSA9IHZhbHVlLmluaXRpYWxpemUoZGF0YTIsIHBhdGgsIGtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNPYmplY3QyKHZhbHVlKSAmJiB2YWx1ZSAhPT0gb2JqICYmICEodmFsdWUgaW5zdGFuY2VvZiBFbGVtZW50KSkge1xuICAgICAgICAgIHJlY3Vyc2UodmFsdWUsIHBhdGgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIHJldHVybiByZWN1cnNlKGRhdGEyKTtcbn1cbmZ1bmN0aW9uIGludGVyY2VwdG9yKGNhbGxiYWNrLCBtdXRhdGVPYmogPSAoKSA9PiB7XG59KSB7XG4gIGxldCBvYmogPSB7XG4gICAgaW5pdGlhbFZhbHVlOiB2b2lkIDAsXG4gICAgX3hfaW50ZXJjZXB0b3I6IHRydWUsXG4gICAgaW5pdGlhbGl6ZShkYXRhMiwgcGF0aCwga2V5KSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5pbml0aWFsVmFsdWUsICgpID0+IGdldChkYXRhMiwgcGF0aCksICh2YWx1ZSkgPT4gc2V0KGRhdGEyLCBwYXRoLCB2YWx1ZSksIHBhdGgsIGtleSk7XG4gICAgfVxuICB9O1xuICBtdXRhdGVPYmoob2JqKTtcbiAgcmV0dXJuIChpbml0aWFsVmFsdWUpID0+IHtcbiAgICBpZiAodHlwZW9mIGluaXRpYWxWYWx1ZSA9PT0gXCJvYmplY3RcIiAmJiBpbml0aWFsVmFsdWUgIT09IG51bGwgJiYgaW5pdGlhbFZhbHVlLl94X2ludGVyY2VwdG9yKSB7XG4gICAgICBsZXQgaW5pdGlhbGl6ZSA9IG9iai5pbml0aWFsaXplLmJpbmQob2JqKTtcbiAgICAgIG9iai5pbml0aWFsaXplID0gKGRhdGEyLCBwYXRoLCBrZXkpID0+IHtcbiAgICAgICAgbGV0IGlubmVyVmFsdWUgPSBpbml0aWFsVmFsdWUuaW5pdGlhbGl6ZShkYXRhMiwgcGF0aCwga2V5KTtcbiAgICAgICAgb2JqLmluaXRpYWxWYWx1ZSA9IGlubmVyVmFsdWU7XG4gICAgICAgIHJldHVybiBpbml0aWFsaXplKGRhdGEyLCBwYXRoLCBrZXkpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqLmluaXRpYWxWYWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcbn1cbmZ1bmN0aW9uIGdldChvYmosIHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguc3BsaXQoXCIuXCIpLnJlZHVjZSgoY2FycnksIHNlZ21lbnQpID0+IGNhcnJ5W3NlZ21lbnRdLCBvYmopO1xufVxuZnVuY3Rpb24gc2V0KG9iaiwgcGF0aCwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBwYXRoID09PSBcInN0cmluZ1wiKVxuICAgIHBhdGggPSBwYXRoLnNwbGl0KFwiLlwiKTtcbiAgaWYgKHBhdGgubGVuZ3RoID09PSAxKVxuICAgIG9ialtwYXRoWzBdXSA9IHZhbHVlO1xuICBlbHNlIGlmIChwYXRoLmxlbmd0aCA9PT0gMClcbiAgICB0aHJvdyBlcnJvcjtcbiAgZWxzZSB7XG4gICAgaWYgKG9ialtwYXRoWzBdXSlcbiAgICAgIHJldHVybiBzZXQob2JqW3BhdGhbMF1dLCBwYXRoLnNsaWNlKDEpLCB2YWx1ZSk7XG4gICAgZWxzZSB7XG4gICAgICBvYmpbcGF0aFswXV0gPSB7fTtcbiAgICAgIHJldHVybiBzZXQob2JqW3BhdGhbMF1dLCBwYXRoLnNsaWNlKDEpLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9tYWdpY3MuanNcbnZhciBtYWdpY3MgPSB7fTtcbmZ1bmN0aW9uIG1hZ2ljKG5hbWUsIGNhbGxiYWNrKSB7XG4gIG1hZ2ljc1tuYW1lXSA9IGNhbGxiYWNrO1xufVxuZnVuY3Rpb24gaW5qZWN0TWFnaWNzKG9iaiwgZWwpIHtcbiAgT2JqZWN0LmVudHJpZXMobWFnaWNzKS5mb3JFYWNoKChbbmFtZSwgY2FsbGJhY2tdKSA9PiB7XG4gICAgbGV0IG1lbW9pemVkVXRpbGl0aWVzID0gbnVsbDtcbiAgICBmdW5jdGlvbiBnZXRVdGlsaXRpZXMoKSB7XG4gICAgICBpZiAobWVtb2l6ZWRVdGlsaXRpZXMpIHtcbiAgICAgICAgcmV0dXJuIG1lbW9pemVkVXRpbGl0aWVzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IFt1dGlsaXRpZXMsIGNsZWFudXAyXSA9IGdldEVsZW1lbnRCb3VuZFV0aWxpdGllcyhlbCk7XG4gICAgICAgIG1lbW9pemVkVXRpbGl0aWVzID0geyBpbnRlcmNlcHRvciwgLi4udXRpbGl0aWVzIH07XG4gICAgICAgIG9uRWxSZW1vdmVkKGVsLCBjbGVhbnVwMik7XG4gICAgICAgIHJldHVybiBtZW1vaXplZFV0aWxpdGllcztcbiAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgYCQke25hbWV9YCwge1xuICAgICAgZ2V0KCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZWwsIGdldFV0aWxpdGllcygpKTtcbiAgICAgIH0sXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL3V0aWxzL2Vycm9yLmpzXG5mdW5jdGlvbiB0cnlDYXRjaChlbCwgZXhwcmVzc2lvbiwgY2FsbGJhY2ssIC4uLmFyZ3MpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gY2FsbGJhY2soLi4uYXJncyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBoYW5kbGVFcnJvcihlLCBlbCwgZXhwcmVzc2lvbik7XG4gIH1cbn1cbmZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9yMiwgZWwsIGV4cHJlc3Npb24gPSB2b2lkIDApIHtcbiAgT2JqZWN0LmFzc2lnbihlcnJvcjIsIHsgZWwsIGV4cHJlc3Npb24gfSk7XG4gIGNvbnNvbGUud2FybihgQWxwaW5lIEV4cHJlc3Npb24gRXJyb3I6ICR7ZXJyb3IyLm1lc3NhZ2V9XG5cbiR7ZXhwcmVzc2lvbiA/ICdFeHByZXNzaW9uOiBcIicgKyBleHByZXNzaW9uICsgJ1wiXFxuXFxuJyA6IFwiXCJ9YCwgZWwpO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0aHJvdyBlcnJvcjI7XG4gIH0sIDApO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvZXZhbHVhdG9yLmpzXG52YXIgc2hvdWxkQXV0b0V2YWx1YXRlRnVuY3Rpb25zID0gdHJ1ZTtcbmZ1bmN0aW9uIGRvbnRBdXRvRXZhbHVhdGVGdW5jdGlvbnMoY2FsbGJhY2spIHtcbiAgbGV0IGNhY2hlID0gc2hvdWxkQXV0b0V2YWx1YXRlRnVuY3Rpb25zO1xuICBzaG91bGRBdXRvRXZhbHVhdGVGdW5jdGlvbnMgPSBmYWxzZTtcbiAgbGV0IHJlc3VsdCA9IGNhbGxiYWNrKCk7XG4gIHNob3VsZEF1dG9FdmFsdWF0ZUZ1bmN0aW9ucyA9IGNhY2hlO1xuICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZXZhbHVhdGUoZWwsIGV4cHJlc3Npb24sIGV4dHJhcyA9IHt9KSB7XG4gIGxldCByZXN1bHQ7XG4gIGV2YWx1YXRlTGF0ZXIoZWwsIGV4cHJlc3Npb24pKCh2YWx1ZSkgPT4gcmVzdWx0ID0gdmFsdWUsIGV4dHJhcyk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBldmFsdWF0ZUxhdGVyKC4uLmFyZ3MpIHtcbiAgcmV0dXJuIHRoZUV2YWx1YXRvckZ1bmN0aW9uKC4uLmFyZ3MpO1xufVxudmFyIHRoZUV2YWx1YXRvckZ1bmN0aW9uID0gbm9ybWFsRXZhbHVhdG9yO1xuZnVuY3Rpb24gc2V0RXZhbHVhdG9yKG5ld0V2YWx1YXRvcikge1xuICB0aGVFdmFsdWF0b3JGdW5jdGlvbiA9IG5ld0V2YWx1YXRvcjtcbn1cbmZ1bmN0aW9uIG5vcm1hbEV2YWx1YXRvcihlbCwgZXhwcmVzc2lvbikge1xuICBsZXQgb3ZlcnJpZGRlbk1hZ2ljcyA9IHt9O1xuICBpbmplY3RNYWdpY3Mob3ZlcnJpZGRlbk1hZ2ljcywgZWwpO1xuICBsZXQgZGF0YVN0YWNrID0gW292ZXJyaWRkZW5NYWdpY3MsIC4uLmNsb3Nlc3REYXRhU3RhY2soZWwpXTtcbiAgbGV0IGV2YWx1YXRvciA9IHR5cGVvZiBleHByZXNzaW9uID09PSBcImZ1bmN0aW9uXCIgPyBnZW5lcmF0ZUV2YWx1YXRvckZyb21GdW5jdGlvbihkYXRhU3RhY2ssIGV4cHJlc3Npb24pIDogZ2VuZXJhdGVFdmFsdWF0b3JGcm9tU3RyaW5nKGRhdGFTdGFjaywgZXhwcmVzc2lvbiwgZWwpO1xuICByZXR1cm4gdHJ5Q2F0Y2guYmluZChudWxsLCBlbCwgZXhwcmVzc2lvbiwgZXZhbHVhdG9yKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlRXZhbHVhdG9yRnJvbUZ1bmN0aW9uKGRhdGFTdGFjaywgZnVuYykge1xuICByZXR1cm4gKHJlY2VpdmVyID0gKCkgPT4ge1xuICB9LCB7IHNjb3BlOiBzY29wZTIgPSB7fSwgcGFyYW1zID0gW10gfSA9IHt9KSA9PiB7XG4gICAgbGV0IHJlc3VsdCA9IGZ1bmMuYXBwbHkobWVyZ2VQcm94aWVzKFtzY29wZTIsIC4uLmRhdGFTdGFja10pLCBwYXJhbXMpO1xuICAgIHJ1bklmVHlwZU9mRnVuY3Rpb24ocmVjZWl2ZXIsIHJlc3VsdCk7XG4gIH07XG59XG52YXIgZXZhbHVhdG9yTWVtbyA9IHt9O1xuZnVuY3Rpb24gZ2VuZXJhdGVGdW5jdGlvbkZyb21TdHJpbmcoZXhwcmVzc2lvbiwgZWwpIHtcbiAgaWYgKGV2YWx1YXRvck1lbW9bZXhwcmVzc2lvbl0pIHtcbiAgICByZXR1cm4gZXZhbHVhdG9yTWVtb1tleHByZXNzaW9uXTtcbiAgfVxuICBsZXQgQXN5bmNGdW5jdGlvbiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihhc3luYyBmdW5jdGlvbigpIHtcbiAgfSkuY29uc3RydWN0b3I7XG4gIGxldCByaWdodFNpZGVTYWZlRXhwcmVzc2lvbiA9IC9eW1xcblxcc10qaWYuKlxcKC4qXFwpLy50ZXN0KGV4cHJlc3Npb24udHJpbSgpKSB8fCAvXihsZXR8Y29uc3QpXFxzLy50ZXN0KGV4cHJlc3Npb24udHJpbSgpKSA/IGAoYXN5bmMoKT0+eyAke2V4cHJlc3Npb259IH0pKClgIDogZXhwcmVzc2lvbjtcbiAgY29uc3Qgc2FmZUFzeW5jRnVuY3Rpb24gPSAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBmdW5jMiA9IG5ldyBBc3luY0Z1bmN0aW9uKFxuICAgICAgICBbXCJfX3NlbGZcIiwgXCJzY29wZVwiXSxcbiAgICAgICAgYHdpdGggKHNjb3BlKSB7IF9fc2VsZi5yZXN1bHQgPSAke3JpZ2h0U2lkZVNhZmVFeHByZXNzaW9ufSB9OyBfX3NlbGYuZmluaXNoZWQgPSB0cnVlOyByZXR1cm4gX19zZWxmLnJlc3VsdDtgXG4gICAgICApO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZ1bmMyLCBcIm5hbWVcIiwge1xuICAgICAgICB2YWx1ZTogYFtBbHBpbmVdICR7ZXhwcmVzc2lvbn1gXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmdW5jMjtcbiAgICB9IGNhdGNoIChlcnJvcjIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGVycm9yMiwgZWwsIGV4cHJlc3Npb24pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgfTtcbiAgbGV0IGZ1bmMgPSBzYWZlQXN5bmNGdW5jdGlvbigpO1xuICBldmFsdWF0b3JNZW1vW2V4cHJlc3Npb25dID0gZnVuYztcbiAgcmV0dXJuIGZ1bmM7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUV2YWx1YXRvckZyb21TdHJpbmcoZGF0YVN0YWNrLCBleHByZXNzaW9uLCBlbCkge1xuICBsZXQgZnVuYyA9IGdlbmVyYXRlRnVuY3Rpb25Gcm9tU3RyaW5nKGV4cHJlc3Npb24sIGVsKTtcbiAgcmV0dXJuIChyZWNlaXZlciA9ICgpID0+IHtcbiAgfSwgeyBzY29wZTogc2NvcGUyID0ge30sIHBhcmFtcyA9IFtdIH0gPSB7fSkgPT4ge1xuICAgIGZ1bmMucmVzdWx0ID0gdm9pZCAwO1xuICAgIGZ1bmMuZmluaXNoZWQgPSBmYWxzZTtcbiAgICBsZXQgY29tcGxldGVTY29wZSA9IG1lcmdlUHJveGllcyhbc2NvcGUyLCAuLi5kYXRhU3RhY2tdKTtcbiAgICBpZiAodHlwZW9mIGZ1bmMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgbGV0IHByb21pc2UgPSBmdW5jKGZ1bmMsIGNvbXBsZXRlU2NvcGUpLmNhdGNoKChlcnJvcjIpID0+IGhhbmRsZUVycm9yKGVycm9yMiwgZWwsIGV4cHJlc3Npb24pKTtcbiAgICAgIGlmIChmdW5jLmZpbmlzaGVkKSB7XG4gICAgICAgIHJ1bklmVHlwZU9mRnVuY3Rpb24ocmVjZWl2ZXIsIGZ1bmMucmVzdWx0LCBjb21wbGV0ZVNjb3BlLCBwYXJhbXMsIGVsKTtcbiAgICAgICAgZnVuYy5yZXN1bHQgPSB2b2lkIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9taXNlLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgIHJ1bklmVHlwZU9mRnVuY3Rpb24ocmVjZWl2ZXIsIHJlc3VsdCwgY29tcGxldGVTY29wZSwgcGFyYW1zLCBlbCk7XG4gICAgICAgIH0pLmNhdGNoKChlcnJvcjIpID0+IGhhbmRsZUVycm9yKGVycm9yMiwgZWwsIGV4cHJlc3Npb24pKS5maW5hbGx5KCgpID0+IGZ1bmMucmVzdWx0ID0gdm9pZCAwKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5mdW5jdGlvbiBydW5JZlR5cGVPZkZ1bmN0aW9uKHJlY2VpdmVyLCB2YWx1ZSwgc2NvcGUyLCBwYXJhbXMsIGVsKSB7XG4gIGlmIChzaG91bGRBdXRvRXZhbHVhdGVGdW5jdGlvbnMgJiYgdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBsZXQgcmVzdWx0ID0gdmFsdWUuYXBwbHkoc2NvcGUyLCBwYXJhbXMpO1xuICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICByZXN1bHQudGhlbigoaSkgPT4gcnVuSWZUeXBlT2ZGdW5jdGlvbihyZWNlaXZlciwgaSwgc2NvcGUyLCBwYXJhbXMpKS5jYXRjaCgoZXJyb3IyKSA9PiBoYW5kbGVFcnJvcihlcnJvcjIsIGVsLCB2YWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWNlaXZlcihyZXN1bHQpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgdmFsdWUudGhlbigoaSkgPT4gcmVjZWl2ZXIoaSkpO1xuICB9IGVsc2Uge1xuICAgIHJlY2VpdmVyKHZhbHVlKTtcbiAgfVxufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvZGlyZWN0aXZlcy5qc1xudmFyIHByZWZpeEFzU3RyaW5nID0gXCJ4LVwiO1xuZnVuY3Rpb24gcHJlZml4KHN1YmplY3QgPSBcIlwiKSB7XG4gIHJldHVybiBwcmVmaXhBc1N0cmluZyArIHN1YmplY3Q7XG59XG5mdW5jdGlvbiBzZXRQcmVmaXgobmV3UHJlZml4KSB7XG4gIHByZWZpeEFzU3RyaW5nID0gbmV3UHJlZml4O1xufVxudmFyIGRpcmVjdGl2ZUhhbmRsZXJzID0ge307XG5mdW5jdGlvbiBkaXJlY3RpdmUobmFtZSwgY2FsbGJhY2spIHtcbiAgZGlyZWN0aXZlSGFuZGxlcnNbbmFtZV0gPSBjYWxsYmFjaztcbiAgcmV0dXJuIHtcbiAgICBiZWZvcmUoZGlyZWN0aXZlMikge1xuICAgICAgaWYgKCFkaXJlY3RpdmVIYW5kbGVyc1tkaXJlY3RpdmUyXSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgXCJDYW5ub3QgZmluZCBkaXJlY3RpdmUgYCR7ZGlyZWN0aXZlfWAuIGAke25hbWV9YCB3aWxsIHVzZSB0aGUgZGVmYXVsdCBvcmRlciBvZiBleGVjdXRpb25cIlxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBwb3MgPSBkaXJlY3RpdmVPcmRlci5pbmRleE9mKGRpcmVjdGl2ZTIpO1xuICAgICAgZGlyZWN0aXZlT3JkZXIuc3BsaWNlKHBvcyA+PSAwID8gcG9zIDogZGlyZWN0aXZlT3JkZXIuaW5kZXhPZihcIkRFRkFVTFRcIiksIDAsIG5hbWUpO1xuICAgIH1cbiAgfTtcbn1cbmZ1bmN0aW9uIGRpcmVjdGl2ZXMoZWwsIGF0dHJpYnV0ZXMsIG9yaWdpbmFsQXR0cmlidXRlT3ZlcnJpZGUpIHtcbiAgYXR0cmlidXRlcyA9IEFycmF5LmZyb20oYXR0cmlidXRlcyk7XG4gIGlmIChlbC5feF92aXJ0dWFsRGlyZWN0aXZlcykge1xuICAgIGxldCB2QXR0cmlidXRlcyA9IE9iamVjdC5lbnRyaWVzKGVsLl94X3ZpcnR1YWxEaXJlY3RpdmVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+ICh7IG5hbWUsIHZhbHVlIH0pKTtcbiAgICBsZXQgc3RhdGljQXR0cmlidXRlcyA9IGF0dHJpYnV0ZXNPbmx5KHZBdHRyaWJ1dGVzKTtcbiAgICB2QXR0cmlidXRlcyA9IHZBdHRyaWJ1dGVzLm1hcCgoYXR0cmlidXRlKSA9PiB7XG4gICAgICBpZiAoc3RhdGljQXR0cmlidXRlcy5maW5kKChhdHRyKSA9PiBhdHRyLm5hbWUgPT09IGF0dHJpYnV0ZS5uYW1lKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5hbWU6IGB4LWJpbmQ6JHthdHRyaWJ1dGUubmFtZX1gLFxuICAgICAgICAgIHZhbHVlOiBgXCIke2F0dHJpYnV0ZS52YWx1ZX1cImBcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhdHRyaWJ1dGU7XG4gICAgfSk7XG4gICAgYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXMuY29uY2F0KHZBdHRyaWJ1dGVzKTtcbiAgfVxuICBsZXQgdHJhbnNmb3JtZWRBdHRyaWJ1dGVNYXAgPSB7fTtcbiAgbGV0IGRpcmVjdGl2ZXMyID0gYXR0cmlidXRlcy5tYXAodG9UcmFuc2Zvcm1lZEF0dHJpYnV0ZXMoKG5ld05hbWUsIG9sZE5hbWUpID0+IHRyYW5zZm9ybWVkQXR0cmlidXRlTWFwW25ld05hbWVdID0gb2xkTmFtZSkpLmZpbHRlcihvdXROb25BbHBpbmVBdHRyaWJ1dGVzKS5tYXAodG9QYXJzZWREaXJlY3RpdmVzKHRyYW5zZm9ybWVkQXR0cmlidXRlTWFwLCBvcmlnaW5hbEF0dHJpYnV0ZU92ZXJyaWRlKSkuc29ydChieVByaW9yaXR5KTtcbiAgcmV0dXJuIGRpcmVjdGl2ZXMyLm1hcCgoZGlyZWN0aXZlMikgPT4ge1xuICAgIHJldHVybiBnZXREaXJlY3RpdmVIYW5kbGVyKGVsLCBkaXJlY3RpdmUyKTtcbiAgfSk7XG59XG5mdW5jdGlvbiBhdHRyaWJ1dGVzT25seShhdHRyaWJ1dGVzKSB7XG4gIHJldHVybiBBcnJheS5mcm9tKGF0dHJpYnV0ZXMpLm1hcCh0b1RyYW5zZm9ybWVkQXR0cmlidXRlcygpKS5maWx0ZXIoKGF0dHIpID0+ICFvdXROb25BbHBpbmVBdHRyaWJ1dGVzKGF0dHIpKTtcbn1cbnZhciBpc0RlZmVycmluZ0hhbmRsZXJzID0gZmFsc2U7XG52YXIgZGlyZWN0aXZlSGFuZGxlclN0YWNrcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG52YXIgY3VycmVudEhhbmRsZXJTdGFja0tleSA9IFN5bWJvbCgpO1xuZnVuY3Rpb24gZGVmZXJIYW5kbGluZ0RpcmVjdGl2ZXMoY2FsbGJhY2spIHtcbiAgaXNEZWZlcnJpbmdIYW5kbGVycyA9IHRydWU7XG4gIGxldCBrZXkgPSBTeW1ib2woKTtcbiAgY3VycmVudEhhbmRsZXJTdGFja0tleSA9IGtleTtcbiAgZGlyZWN0aXZlSGFuZGxlclN0YWNrcy5zZXQoa2V5LCBbXSk7XG4gIGxldCBmbHVzaEhhbmRsZXJzID0gKCkgPT4ge1xuICAgIHdoaWxlIChkaXJlY3RpdmVIYW5kbGVyU3RhY2tzLmdldChrZXkpLmxlbmd0aClcbiAgICAgIGRpcmVjdGl2ZUhhbmRsZXJTdGFja3MuZ2V0KGtleSkuc2hpZnQoKSgpO1xuICAgIGRpcmVjdGl2ZUhhbmRsZXJTdGFja3MuZGVsZXRlKGtleSk7XG4gIH07XG4gIGxldCBzdG9wRGVmZXJyaW5nID0gKCkgPT4ge1xuICAgIGlzRGVmZXJyaW5nSGFuZGxlcnMgPSBmYWxzZTtcbiAgICBmbHVzaEhhbmRsZXJzKCk7XG4gIH07XG4gIGNhbGxiYWNrKGZsdXNoSGFuZGxlcnMpO1xuICBzdG9wRGVmZXJyaW5nKCk7XG59XG5mdW5jdGlvbiBnZXRFbGVtZW50Qm91bmRVdGlsaXRpZXMoZWwpIHtcbiAgbGV0IGNsZWFudXBzID0gW107XG4gIGxldCBjbGVhbnVwMiA9IChjYWxsYmFjaykgPT4gY2xlYW51cHMucHVzaChjYWxsYmFjayk7XG4gIGxldCBbZWZmZWN0MywgY2xlYW51cEVmZmVjdF0gPSBlbGVtZW50Qm91bmRFZmZlY3QoZWwpO1xuICBjbGVhbnVwcy5wdXNoKGNsZWFudXBFZmZlY3QpO1xuICBsZXQgdXRpbGl0aWVzID0ge1xuICAgIEFscGluZTogYWxwaW5lX2RlZmF1bHQsXG4gICAgZWZmZWN0OiBlZmZlY3QzLFxuICAgIGNsZWFudXA6IGNsZWFudXAyLFxuICAgIGV2YWx1YXRlTGF0ZXI6IGV2YWx1YXRlTGF0ZXIuYmluZChldmFsdWF0ZUxhdGVyLCBlbCksXG4gICAgZXZhbHVhdGU6IGV2YWx1YXRlLmJpbmQoZXZhbHVhdGUsIGVsKVxuICB9O1xuICBsZXQgZG9DbGVhbnVwID0gKCkgPT4gY2xlYW51cHMuZm9yRWFjaCgoaSkgPT4gaSgpKTtcbiAgcmV0dXJuIFt1dGlsaXRpZXMsIGRvQ2xlYW51cF07XG59XG5mdW5jdGlvbiBnZXREaXJlY3RpdmVIYW5kbGVyKGVsLCBkaXJlY3RpdmUyKSB7XG4gIGxldCBub29wID0gKCkgPT4ge1xuICB9O1xuICBsZXQgaGFuZGxlcjQgPSBkaXJlY3RpdmVIYW5kbGVyc1tkaXJlY3RpdmUyLnR5cGVdIHx8IG5vb3A7XG4gIGxldCBbdXRpbGl0aWVzLCBjbGVhbnVwMl0gPSBnZXRFbGVtZW50Qm91bmRVdGlsaXRpZXMoZWwpO1xuICBvbkF0dHJpYnV0ZVJlbW92ZWQoZWwsIGRpcmVjdGl2ZTIub3JpZ2luYWwsIGNsZWFudXAyKTtcbiAgbGV0IGZ1bGxIYW5kbGVyID0gKCkgPT4ge1xuICAgIGlmIChlbC5feF9pZ25vcmUgfHwgZWwuX3hfaWdub3JlU2VsZilcbiAgICAgIHJldHVybjtcbiAgICBoYW5kbGVyNC5pbmxpbmUgJiYgaGFuZGxlcjQuaW5saW5lKGVsLCBkaXJlY3RpdmUyLCB1dGlsaXRpZXMpO1xuICAgIGhhbmRsZXI0ID0gaGFuZGxlcjQuYmluZChoYW5kbGVyNCwgZWwsIGRpcmVjdGl2ZTIsIHV0aWxpdGllcyk7XG4gICAgaXNEZWZlcnJpbmdIYW5kbGVycyA/IGRpcmVjdGl2ZUhhbmRsZXJTdGFja3MuZ2V0KGN1cnJlbnRIYW5kbGVyU3RhY2tLZXkpLnB1c2goaGFuZGxlcjQpIDogaGFuZGxlcjQoKTtcbiAgfTtcbiAgZnVsbEhhbmRsZXIucnVuQ2xlYW51cHMgPSBjbGVhbnVwMjtcbiAgcmV0dXJuIGZ1bGxIYW5kbGVyO1xufVxudmFyIHN0YXJ0aW5nV2l0aCA9IChzdWJqZWN0LCByZXBsYWNlbWVudCkgPT4gKHsgbmFtZSwgdmFsdWUgfSkgPT4ge1xuICBpZiAobmFtZS5zdGFydHNXaXRoKHN1YmplY3QpKVxuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2Uoc3ViamVjdCwgcmVwbGFjZW1lbnQpO1xuICByZXR1cm4geyBuYW1lLCB2YWx1ZSB9O1xufTtcbnZhciBpbnRvID0gKGkpID0+IGk7XG5mdW5jdGlvbiB0b1RyYW5zZm9ybWVkQXR0cmlidXRlcyhjYWxsYmFjayA9ICgpID0+IHtcbn0pIHtcbiAgcmV0dXJuICh7IG5hbWUsIHZhbHVlIH0pID0+IHtcbiAgICBsZXQgeyBuYW1lOiBuZXdOYW1lLCB2YWx1ZTogbmV3VmFsdWUgfSA9IGF0dHJpYnV0ZVRyYW5zZm9ybWVycy5yZWR1Y2UoKGNhcnJ5LCB0cmFuc2Zvcm0pID0+IHtcbiAgICAgIHJldHVybiB0cmFuc2Zvcm0oY2FycnkpO1xuICAgIH0sIHsgbmFtZSwgdmFsdWUgfSk7XG4gICAgaWYgKG5ld05hbWUgIT09IG5hbWUpXG4gICAgICBjYWxsYmFjayhuZXdOYW1lLCBuYW1lKTtcbiAgICByZXR1cm4geyBuYW1lOiBuZXdOYW1lLCB2YWx1ZTogbmV3VmFsdWUgfTtcbiAgfTtcbn1cbnZhciBhdHRyaWJ1dGVUcmFuc2Zvcm1lcnMgPSBbXTtcbmZ1bmN0aW9uIG1hcEF0dHJpYnV0ZXMoY2FsbGJhY2spIHtcbiAgYXR0cmlidXRlVHJhbnNmb3JtZXJzLnB1c2goY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gb3V0Tm9uQWxwaW5lQXR0cmlidXRlcyh7IG5hbWUgfSkge1xuICByZXR1cm4gYWxwaW5lQXR0cmlidXRlUmVnZXgoKS50ZXN0KG5hbWUpO1xufVxudmFyIGFscGluZUF0dHJpYnV0ZVJlZ2V4ID0gKCkgPT4gbmV3IFJlZ0V4cChgXiR7cHJlZml4QXNTdHJpbmd9KFteOl4uXSspXFxcXGJgKTtcbmZ1bmN0aW9uIHRvUGFyc2VkRGlyZWN0aXZlcyh0cmFuc2Zvcm1lZEF0dHJpYnV0ZU1hcCwgb3JpZ2luYWxBdHRyaWJ1dGVPdmVycmlkZSkge1xuICByZXR1cm4gKHsgbmFtZSwgdmFsdWUgfSkgPT4ge1xuICAgIGxldCB0eXBlTWF0Y2ggPSBuYW1lLm1hdGNoKGFscGluZUF0dHJpYnV0ZVJlZ2V4KCkpO1xuICAgIGxldCB2YWx1ZU1hdGNoID0gbmFtZS5tYXRjaCgvOihbYS16QS1aMC05XFwtXzpdKykvKTtcbiAgICBsZXQgbW9kaWZpZXJzID0gbmFtZS5tYXRjaCgvXFwuW14uXFxdXSsoPz1bXlxcXV0qJCkvZykgfHwgW107XG4gICAgbGV0IG9yaWdpbmFsID0gb3JpZ2luYWxBdHRyaWJ1dGVPdmVycmlkZSB8fCB0cmFuc2Zvcm1lZEF0dHJpYnV0ZU1hcFtuYW1lXSB8fCBuYW1lO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0eXBlTWF0Y2ggPyB0eXBlTWF0Y2hbMV0gOiBudWxsLFxuICAgICAgdmFsdWU6IHZhbHVlTWF0Y2ggPyB2YWx1ZU1hdGNoWzFdIDogbnVsbCxcbiAgICAgIG1vZGlmaWVyczogbW9kaWZpZXJzLm1hcCgoaSkgPT4gaS5yZXBsYWNlKFwiLlwiLCBcIlwiKSksXG4gICAgICBleHByZXNzaW9uOiB2YWx1ZSxcbiAgICAgIG9yaWdpbmFsXG4gICAgfTtcbiAgfTtcbn1cbnZhciBERUZBVUxUID0gXCJERUZBVUxUXCI7XG52YXIgZGlyZWN0aXZlT3JkZXIgPSBbXG4gIFwiaWdub3JlXCIsXG4gIFwicmVmXCIsXG4gIFwiZGF0YVwiLFxuICBcImlkXCIsXG4gIFwiYW5jaG9yXCIsXG4gIFwiYmluZFwiLFxuICBcImluaXRcIixcbiAgXCJmb3JcIixcbiAgXCJtb2RlbFwiLFxuICBcIm1vZGVsYWJsZVwiLFxuICBcInRyYW5zaXRpb25cIixcbiAgXCJzaG93XCIsXG4gIFwiaWZcIixcbiAgREVGQVVMVCxcbiAgXCJ0ZWxlcG9ydFwiXG5dO1xuZnVuY3Rpb24gYnlQcmlvcml0eShhLCBiKSB7XG4gIGxldCB0eXBlQSA9IGRpcmVjdGl2ZU9yZGVyLmluZGV4T2YoYS50eXBlKSA9PT0gLTEgPyBERUZBVUxUIDogYS50eXBlO1xuICBsZXQgdHlwZUIgPSBkaXJlY3RpdmVPcmRlci5pbmRleE9mKGIudHlwZSkgPT09IC0xID8gREVGQVVMVCA6IGIudHlwZTtcbiAgcmV0dXJuIGRpcmVjdGl2ZU9yZGVyLmluZGV4T2YodHlwZUEpIC0gZGlyZWN0aXZlT3JkZXIuaW5kZXhPZih0eXBlQik7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9uZXh0VGljay5qc1xudmFyIHRpY2tTdGFjayA9IFtdO1xudmFyIGlzSG9sZGluZyA9IGZhbHNlO1xuZnVuY3Rpb24gbmV4dFRpY2soY2FsbGJhY2sgPSAoKSA9PiB7XG59KSB7XG4gIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICBpc0hvbGRpbmcgfHwgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZWxlYXNlTmV4dFRpY2tzKCk7XG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgIHRpY2tTdGFjay5wdXNoKCgpID0+IHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgICByZXMoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5mdW5jdGlvbiByZWxlYXNlTmV4dFRpY2tzKCkge1xuICBpc0hvbGRpbmcgPSBmYWxzZTtcbiAgd2hpbGUgKHRpY2tTdGFjay5sZW5ndGgpXG4gICAgdGlja1N0YWNrLnNoaWZ0KCkoKTtcbn1cbmZ1bmN0aW9uIGhvbGROZXh0VGlja3MoKSB7XG4gIGlzSG9sZGluZyA9IHRydWU7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy91dGlscy9jbGFzc2VzLmpzXG5mdW5jdGlvbiBzZXRDbGFzc2VzKGVsLCB2YWx1ZSkge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gc2V0Q2xhc3Nlc0Zyb21TdHJpbmcoZWwsIHZhbHVlLmpvaW4oXCIgXCIpKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICByZXR1cm4gc2V0Q2xhc3Nlc0Zyb21PYmplY3QoZWwsIHZhbHVlKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiBzZXRDbGFzc2VzKGVsLCB2YWx1ZSgpKTtcbiAgfVxuICByZXR1cm4gc2V0Q2xhc3Nlc0Zyb21TdHJpbmcoZWwsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHNldENsYXNzZXNGcm9tU3RyaW5nKGVsLCBjbGFzc1N0cmluZykge1xuICBsZXQgc3BsaXQgPSAoY2xhc3NTdHJpbmcyKSA9PiBjbGFzc1N0cmluZzIuc3BsaXQoXCIgXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgbGV0IG1pc3NpbmdDbGFzc2VzID0gKGNsYXNzU3RyaW5nMikgPT4gY2xhc3NTdHJpbmcyLnNwbGl0KFwiIFwiKS5maWx0ZXIoKGkpID0+ICFlbC5jbGFzc0xpc3QuY29udGFpbnMoaSkpLmZpbHRlcihCb29sZWFuKTtcbiAgbGV0IGFkZENsYXNzZXNBbmRSZXR1cm5VbmRvID0gKGNsYXNzZXMpID0+IHtcbiAgICBlbC5jbGFzc0xpc3QuYWRkKC4uLmNsYXNzZXMpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKC4uLmNsYXNzZXMpO1xuICAgIH07XG4gIH07XG4gIGNsYXNzU3RyaW5nID0gY2xhc3NTdHJpbmcgPT09IHRydWUgPyBjbGFzc1N0cmluZyA9IFwiXCIgOiBjbGFzc1N0cmluZyB8fCBcIlwiO1xuICByZXR1cm4gYWRkQ2xhc3Nlc0FuZFJldHVyblVuZG8obWlzc2luZ0NsYXNzZXMoY2xhc3NTdHJpbmcpKTtcbn1cbmZ1bmN0aW9uIHNldENsYXNzZXNGcm9tT2JqZWN0KGVsLCBjbGFzc09iamVjdCkge1xuICBsZXQgc3BsaXQgPSAoY2xhc3NTdHJpbmcpID0+IGNsYXNzU3RyaW5nLnNwbGl0KFwiIFwiKS5maWx0ZXIoQm9vbGVhbik7XG4gIGxldCBmb3JBZGQgPSBPYmplY3QuZW50cmllcyhjbGFzc09iamVjdCkuZmxhdE1hcCgoW2NsYXNzU3RyaW5nLCBib29sXSkgPT4gYm9vbCA/IHNwbGl0KGNsYXNzU3RyaW5nKSA6IGZhbHNlKS5maWx0ZXIoQm9vbGVhbik7XG4gIGxldCBmb3JSZW1vdmUgPSBPYmplY3QuZW50cmllcyhjbGFzc09iamVjdCkuZmxhdE1hcCgoW2NsYXNzU3RyaW5nLCBib29sXSkgPT4gIWJvb2wgPyBzcGxpdChjbGFzc1N0cmluZykgOiBmYWxzZSkuZmlsdGVyKEJvb2xlYW4pO1xuICBsZXQgYWRkZWQgPSBbXTtcbiAgbGV0IHJlbW92ZWQgPSBbXTtcbiAgZm9yUmVtb3ZlLmZvckVhY2goKGkpID0+IHtcbiAgICBpZiAoZWwuY2xhc3NMaXN0LmNvbnRhaW5zKGkpKSB7XG4gICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGkpO1xuICAgICAgcmVtb3ZlZC5wdXNoKGkpO1xuICAgIH1cbiAgfSk7XG4gIGZvckFkZC5mb3JFYWNoKChpKSA9PiB7XG4gICAgaWYgKCFlbC5jbGFzc0xpc3QuY29udGFpbnMoaSkpIHtcbiAgICAgIGVsLmNsYXNzTGlzdC5hZGQoaSk7XG4gICAgICBhZGRlZC5wdXNoKGkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgcmVtb3ZlZC5mb3JFYWNoKChpKSA9PiBlbC5jbGFzc0xpc3QuYWRkKGkpKTtcbiAgICBhZGRlZC5mb3JFYWNoKChpKSA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKGkpKTtcbiAgfTtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL3V0aWxzL3N0eWxlcy5qc1xuZnVuY3Rpb24gc2V0U3R5bGVzKGVsLCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIHNldFN0eWxlc0Zyb21PYmplY3QoZWwsIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gc2V0U3R5bGVzRnJvbVN0cmluZyhlbCwgdmFsdWUpO1xufVxuZnVuY3Rpb24gc2V0U3R5bGVzRnJvbU9iamVjdChlbCwgdmFsdWUpIHtcbiAgbGV0IHByZXZpb3VzU3R5bGVzID0ge307XG4gIE9iamVjdC5lbnRyaWVzKHZhbHVlKS5mb3JFYWNoKChba2V5LCB2YWx1ZTJdKSA9PiB7XG4gICAgcHJldmlvdXNTdHlsZXNba2V5XSA9IGVsLnN0eWxlW2tleV07XG4gICAgaWYgKCFrZXkuc3RhcnRzV2l0aChcIi0tXCIpKSB7XG4gICAgICBrZXkgPSBrZWJhYkNhc2Uoa2V5KTtcbiAgICB9XG4gICAgZWwuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZTIpO1xuICB9KTtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKGVsLnN0eWxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKFwic3R5bGVcIik7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBzZXRTdHlsZXMoZWwsIHByZXZpb3VzU3R5bGVzKTtcbiAgfTtcbn1cbmZ1bmN0aW9uIHNldFN0eWxlc0Zyb21TdHJpbmcoZWwsIHZhbHVlKSB7XG4gIGxldCBjYWNoZSA9IGVsLmdldEF0dHJpYnV0ZShcInN0eWxlXCIsIHZhbHVlKTtcbiAgZWwuc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgdmFsdWUpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIGNhY2hlIHx8IFwiXCIpO1xuICB9O1xufVxuZnVuY3Rpb24ga2ViYWJDYXNlKHN1YmplY3QpIHtcbiAgcmV0dXJuIHN1YmplY3QucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgXCIkMS0kMlwiKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvdXRpbHMvb25jZS5qc1xuZnVuY3Rpb24gb25jZShjYWxsYmFjaywgZmFsbGJhY2sgPSAoKSA9PiB7XG59KSB7XG4gIGxldCBjYWxsZWQgPSBmYWxzZTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGlmICghY2FsbGVkKSB7XG4gICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmFsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH07XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtdHJhbnNpdGlvbi5qc1xuZGlyZWN0aXZlKFwidHJhbnNpdGlvblwiLCAoZWwsIHsgdmFsdWUsIG1vZGlmaWVycywgZXhwcmVzc2lvbiB9LCB7IGV2YWx1YXRlOiBldmFsdWF0ZTIgfSkgPT4ge1xuICBpZiAodHlwZW9mIGV4cHJlc3Npb24gPT09IFwiZnVuY3Rpb25cIilcbiAgICBleHByZXNzaW9uID0gZXZhbHVhdGUyKGV4cHJlc3Npb24pO1xuICBpZiAoZXhwcmVzc2lvbiA9PT0gZmFsc2UpXG4gICAgcmV0dXJuO1xuICBpZiAoIWV4cHJlc3Npb24gfHwgdHlwZW9mIGV4cHJlc3Npb24gPT09IFwiYm9vbGVhblwiKSB7XG4gICAgcmVnaXN0ZXJUcmFuc2l0aW9uc0Zyb21IZWxwZXIoZWwsIG1vZGlmaWVycywgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHJlZ2lzdGVyVHJhbnNpdGlvbnNGcm9tQ2xhc3NTdHJpbmcoZWwsIGV4cHJlc3Npb24sIHZhbHVlKTtcbiAgfVxufSk7XG5mdW5jdGlvbiByZWdpc3RlclRyYW5zaXRpb25zRnJvbUNsYXNzU3RyaW5nKGVsLCBjbGFzc1N0cmluZywgc3RhZ2UpIHtcbiAgcmVnaXN0ZXJUcmFuc2l0aW9uT2JqZWN0KGVsLCBzZXRDbGFzc2VzLCBcIlwiKTtcbiAgbGV0IGRpcmVjdGl2ZVN0b3JhZ2VNYXAgPSB7XG4gICAgXCJlbnRlclwiOiAoY2xhc3NlcykgPT4ge1xuICAgICAgZWwuX3hfdHJhbnNpdGlvbi5lbnRlci5kdXJpbmcgPSBjbGFzc2VzO1xuICAgIH0sXG4gICAgXCJlbnRlci1zdGFydFwiOiAoY2xhc3NlcykgPT4ge1xuICAgICAgZWwuX3hfdHJhbnNpdGlvbi5lbnRlci5zdGFydCA9IGNsYXNzZXM7XG4gICAgfSxcbiAgICBcImVudGVyLWVuZFwiOiAoY2xhc3NlcykgPT4ge1xuICAgICAgZWwuX3hfdHJhbnNpdGlvbi5lbnRlci5lbmQgPSBjbGFzc2VzO1xuICAgIH0sXG4gICAgXCJsZWF2ZVwiOiAoY2xhc3NlcykgPT4ge1xuICAgICAgZWwuX3hfdHJhbnNpdGlvbi5sZWF2ZS5kdXJpbmcgPSBjbGFzc2VzO1xuICAgIH0sXG4gICAgXCJsZWF2ZS1zdGFydFwiOiAoY2xhc3NlcykgPT4ge1xuICAgICAgZWwuX3hfdHJhbnNpdGlvbi5sZWF2ZS5zdGFydCA9IGNsYXNzZXM7XG4gICAgfSxcbiAgICBcImxlYXZlLWVuZFwiOiAoY2xhc3NlcykgPT4ge1xuICAgICAgZWwuX3hfdHJhbnNpdGlvbi5sZWF2ZS5lbmQgPSBjbGFzc2VzO1xuICAgIH1cbiAgfTtcbiAgZGlyZWN0aXZlU3RvcmFnZU1hcFtzdGFnZV0oY2xhc3NTdHJpbmcpO1xufVxuZnVuY3Rpb24gcmVnaXN0ZXJUcmFuc2l0aW9uc0Zyb21IZWxwZXIoZWwsIG1vZGlmaWVycywgc3RhZ2UpIHtcbiAgcmVnaXN0ZXJUcmFuc2l0aW9uT2JqZWN0KGVsLCBzZXRTdHlsZXMpO1xuICBsZXQgZG9lc250U3BlY2lmeSA9ICFtb2RpZmllcnMuaW5jbHVkZXMoXCJpblwiKSAmJiAhbW9kaWZpZXJzLmluY2x1ZGVzKFwib3V0XCIpICYmICFzdGFnZTtcbiAgbGV0IHRyYW5zaXRpb25pbmdJbiA9IGRvZXNudFNwZWNpZnkgfHwgbW9kaWZpZXJzLmluY2x1ZGVzKFwiaW5cIikgfHwgW1wiZW50ZXJcIl0uaW5jbHVkZXMoc3RhZ2UpO1xuICBsZXQgdHJhbnNpdGlvbmluZ091dCA9IGRvZXNudFNwZWNpZnkgfHwgbW9kaWZpZXJzLmluY2x1ZGVzKFwib3V0XCIpIHx8IFtcImxlYXZlXCJdLmluY2x1ZGVzKHN0YWdlKTtcbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImluXCIpICYmICFkb2VzbnRTcGVjaWZ5KSB7XG4gICAgbW9kaWZpZXJzID0gbW9kaWZpZXJzLmZpbHRlcigoaSwgaW5kZXgpID0+IGluZGV4IDwgbW9kaWZpZXJzLmluZGV4T2YoXCJvdXRcIikpO1xuICB9XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJvdXRcIikgJiYgIWRvZXNudFNwZWNpZnkpIHtcbiAgICBtb2RpZmllcnMgPSBtb2RpZmllcnMuZmlsdGVyKChpLCBpbmRleCkgPT4gaW5kZXggPiBtb2RpZmllcnMuaW5kZXhPZihcIm91dFwiKSk7XG4gIH1cbiAgbGV0IHdhbnRzQWxsID0gIW1vZGlmaWVycy5pbmNsdWRlcyhcIm9wYWNpdHlcIikgJiYgIW1vZGlmaWVycy5pbmNsdWRlcyhcInNjYWxlXCIpO1xuICBsZXQgd2FudHNPcGFjaXR5ID0gd2FudHNBbGwgfHwgbW9kaWZpZXJzLmluY2x1ZGVzKFwib3BhY2l0eVwiKTtcbiAgbGV0IHdhbnRzU2NhbGUgPSB3YW50c0FsbCB8fCBtb2RpZmllcnMuaW5jbHVkZXMoXCJzY2FsZVwiKTtcbiAgbGV0IG9wYWNpdHlWYWx1ZSA9IHdhbnRzT3BhY2l0eSA/IDAgOiAxO1xuICBsZXQgc2NhbGVWYWx1ZSA9IHdhbnRzU2NhbGUgPyBtb2RpZmllclZhbHVlKG1vZGlmaWVycywgXCJzY2FsZVwiLCA5NSkgLyAxMDAgOiAxO1xuICBsZXQgZGVsYXkgPSBtb2RpZmllclZhbHVlKG1vZGlmaWVycywgXCJkZWxheVwiLCAwKSAvIDFlMztcbiAgbGV0IG9yaWdpbiA9IG1vZGlmaWVyVmFsdWUobW9kaWZpZXJzLCBcIm9yaWdpblwiLCBcImNlbnRlclwiKTtcbiAgbGV0IHByb3BlcnR5ID0gXCJvcGFjaXR5LCB0cmFuc2Zvcm1cIjtcbiAgbGV0IGR1cmF0aW9uSW4gPSBtb2RpZmllclZhbHVlKG1vZGlmaWVycywgXCJkdXJhdGlvblwiLCAxNTApIC8gMWUzO1xuICBsZXQgZHVyYXRpb25PdXQgPSBtb2RpZmllclZhbHVlKG1vZGlmaWVycywgXCJkdXJhdGlvblwiLCA3NSkgLyAxZTM7XG4gIGxldCBlYXNpbmcgPSBgY3ViaWMtYmV6aWVyKDAuNCwgMC4wLCAwLjIsIDEpYDtcbiAgaWYgKHRyYW5zaXRpb25pbmdJbikge1xuICAgIGVsLl94X3RyYW5zaXRpb24uZW50ZXIuZHVyaW5nID0ge1xuICAgICAgdHJhbnNmb3JtT3JpZ2luOiBvcmlnaW4sXG4gICAgICB0cmFuc2l0aW9uRGVsYXk6IGAke2RlbGF5fXNgLFxuICAgICAgdHJhbnNpdGlvblByb3BlcnR5OiBwcm9wZXJ0eSxcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogYCR7ZHVyYXRpb25Jbn1zYCxcbiAgICAgIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogZWFzaW5nXG4gICAgfTtcbiAgICBlbC5feF90cmFuc2l0aW9uLmVudGVyLnN0YXJ0ID0ge1xuICAgICAgb3BhY2l0eTogb3BhY2l0eVZhbHVlLFxuICAgICAgdHJhbnNmb3JtOiBgc2NhbGUoJHtzY2FsZVZhbHVlfSlgXG4gICAgfTtcbiAgICBlbC5feF90cmFuc2l0aW9uLmVudGVyLmVuZCA9IHtcbiAgICAgIG9wYWNpdHk6IDEsXG4gICAgICB0cmFuc2Zvcm06IGBzY2FsZSgxKWBcbiAgICB9O1xuICB9XG4gIGlmICh0cmFuc2l0aW9uaW5nT3V0KSB7XG4gICAgZWwuX3hfdHJhbnNpdGlvbi5sZWF2ZS5kdXJpbmcgPSB7XG4gICAgICB0cmFuc2Zvcm1PcmlnaW46IG9yaWdpbixcbiAgICAgIHRyYW5zaXRpb25EZWxheTogYCR7ZGVsYXl9c2AsXG4gICAgICB0cmFuc2l0aW9uUHJvcGVydHk6IHByb3BlcnR5LFxuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiBgJHtkdXJhdGlvbk91dH1zYCxcbiAgICAgIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogZWFzaW5nXG4gICAgfTtcbiAgICBlbC5feF90cmFuc2l0aW9uLmxlYXZlLnN0YXJ0ID0ge1xuICAgICAgb3BhY2l0eTogMSxcbiAgICAgIHRyYW5zZm9ybTogYHNjYWxlKDEpYFxuICAgIH07XG4gICAgZWwuX3hfdHJhbnNpdGlvbi5sZWF2ZS5lbmQgPSB7XG4gICAgICBvcGFjaXR5OiBvcGFjaXR5VmFsdWUsXG4gICAgICB0cmFuc2Zvcm06IGBzY2FsZSgke3NjYWxlVmFsdWV9KWBcbiAgICB9O1xuICB9XG59XG5mdW5jdGlvbiByZWdpc3RlclRyYW5zaXRpb25PYmplY3QoZWwsIHNldEZ1bmN0aW9uLCBkZWZhdWx0VmFsdWUgPSB7fSkge1xuICBpZiAoIWVsLl94X3RyYW5zaXRpb24pXG4gICAgZWwuX3hfdHJhbnNpdGlvbiA9IHtcbiAgICAgIGVudGVyOiB7IGR1cmluZzogZGVmYXVsdFZhbHVlLCBzdGFydDogZGVmYXVsdFZhbHVlLCBlbmQ6IGRlZmF1bHRWYWx1ZSB9LFxuICAgICAgbGVhdmU6IHsgZHVyaW5nOiBkZWZhdWx0VmFsdWUsIHN0YXJ0OiBkZWZhdWx0VmFsdWUsIGVuZDogZGVmYXVsdFZhbHVlIH0sXG4gICAgICBpbihiZWZvcmUgPSAoKSA9PiB7XG4gICAgICB9LCBhZnRlciA9ICgpID0+IHtcbiAgICAgIH0pIHtcbiAgICAgICAgdHJhbnNpdGlvbihlbCwgc2V0RnVuY3Rpb24sIHtcbiAgICAgICAgICBkdXJpbmc6IHRoaXMuZW50ZXIuZHVyaW5nLFxuICAgICAgICAgIHN0YXJ0OiB0aGlzLmVudGVyLnN0YXJ0LFxuICAgICAgICAgIGVuZDogdGhpcy5lbnRlci5lbmRcbiAgICAgICAgfSwgYmVmb3JlLCBhZnRlcik7XG4gICAgICB9LFxuICAgICAgb3V0KGJlZm9yZSA9ICgpID0+IHtcbiAgICAgIH0sIGFmdGVyID0gKCkgPT4ge1xuICAgICAgfSkge1xuICAgICAgICB0cmFuc2l0aW9uKGVsLCBzZXRGdW5jdGlvbiwge1xuICAgICAgICAgIGR1cmluZzogdGhpcy5sZWF2ZS5kdXJpbmcsXG4gICAgICAgICAgc3RhcnQ6IHRoaXMubGVhdmUuc3RhcnQsXG4gICAgICAgICAgZW5kOiB0aGlzLmxlYXZlLmVuZFxuICAgICAgICB9LCBiZWZvcmUsIGFmdGVyKTtcbiAgICAgIH1cbiAgICB9O1xufVxud2luZG93LkVsZW1lbnQucHJvdG90eXBlLl94X3RvZ2dsZUFuZENhc2NhZGVXaXRoVHJhbnNpdGlvbnMgPSBmdW5jdGlvbihlbCwgdmFsdWUsIHNob3csIGhpZGUpIHtcbiAgY29uc3QgbmV4dFRpY2syID0gZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSBcInZpc2libGVcIiA/IHJlcXVlc3RBbmltYXRpb25GcmFtZSA6IHNldFRpbWVvdXQ7XG4gIGxldCBjbGlja0F3YXlDb21wYXRpYmxlU2hvdyA9ICgpID0+IG5leHRUaWNrMihzaG93KTtcbiAgaWYgKHZhbHVlKSB7XG4gICAgaWYgKGVsLl94X3RyYW5zaXRpb24gJiYgKGVsLl94X3RyYW5zaXRpb24uZW50ZXIgfHwgZWwuX3hfdHJhbnNpdGlvbi5sZWF2ZSkpIHtcbiAgICAgIGVsLl94X3RyYW5zaXRpb24uZW50ZXIgJiYgKE9iamVjdC5lbnRyaWVzKGVsLl94X3RyYW5zaXRpb24uZW50ZXIuZHVyaW5nKS5sZW5ndGggfHwgT2JqZWN0LmVudHJpZXMoZWwuX3hfdHJhbnNpdGlvbi5lbnRlci5zdGFydCkubGVuZ3RoIHx8IE9iamVjdC5lbnRyaWVzKGVsLl94X3RyYW5zaXRpb24uZW50ZXIuZW5kKS5sZW5ndGgpID8gZWwuX3hfdHJhbnNpdGlvbi5pbihzaG93KSA6IGNsaWNrQXdheUNvbXBhdGlibGVTaG93KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLl94X3RyYW5zaXRpb24gPyBlbC5feF90cmFuc2l0aW9uLmluKHNob3cpIDogY2xpY2tBd2F5Q29tcGF0aWJsZVNob3coKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGVsLl94X2hpZGVQcm9taXNlID0gZWwuX3hfdHJhbnNpdGlvbiA/IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBlbC5feF90cmFuc2l0aW9uLm91dCgoKSA9PiB7XG4gICAgfSwgKCkgPT4gcmVzb2x2ZShoaWRlKSk7XG4gICAgZWwuX3hfdHJhbnNpdGlvbmluZyAmJiBlbC5feF90cmFuc2l0aW9uaW5nLmJlZm9yZUNhbmNlbCgoKSA9PiByZWplY3QoeyBpc0Zyb21DYW5jZWxsZWRUcmFuc2l0aW9uOiB0cnVlIH0pKTtcbiAgfSkgOiBQcm9taXNlLnJlc29sdmUoaGlkZSk7XG4gIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICBsZXQgY2xvc2VzdCA9IGNsb3Nlc3RIaWRlKGVsKTtcbiAgICBpZiAoY2xvc2VzdCkge1xuICAgICAgaWYgKCFjbG9zZXN0Ll94X2hpZGVDaGlsZHJlbilcbiAgICAgICAgY2xvc2VzdC5feF9oaWRlQ2hpbGRyZW4gPSBbXTtcbiAgICAgIGNsb3Nlc3QuX3hfaGlkZUNoaWxkcmVuLnB1c2goZWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0VGljazIoKCkgPT4ge1xuICAgICAgICBsZXQgaGlkZUFmdGVyQ2hpbGRyZW4gPSAoZWwyKSA9PiB7XG4gICAgICAgICAgbGV0IGNhcnJ5ID0gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgZWwyLl94X2hpZGVQcm9taXNlLFxuICAgICAgICAgICAgLi4uKGVsMi5feF9oaWRlQ2hpbGRyZW4gfHwgW10pLm1hcChoaWRlQWZ0ZXJDaGlsZHJlbilcbiAgICAgICAgICBdKS50aGVuKChbaV0pID0+IGkoKSk7XG4gICAgICAgICAgZGVsZXRlIGVsMi5feF9oaWRlUHJvbWlzZTtcbiAgICAgICAgICBkZWxldGUgZWwyLl94X2hpZGVDaGlsZHJlbjtcbiAgICAgICAgICByZXR1cm4gY2Fycnk7XG4gICAgICAgIH07XG4gICAgICAgIGhpZGVBZnRlckNoaWxkcmVuKGVsKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgIGlmICghZS5pc0Zyb21DYW5jZWxsZWRUcmFuc2l0aW9uKVxuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufTtcbmZ1bmN0aW9uIGNsb3Nlc3RIaWRlKGVsKSB7XG4gIGxldCBwYXJlbnQgPSBlbC5wYXJlbnROb2RlO1xuICBpZiAoIXBhcmVudClcbiAgICByZXR1cm47XG4gIHJldHVybiBwYXJlbnQuX3hfaGlkZVByb21pc2UgPyBwYXJlbnQgOiBjbG9zZXN0SGlkZShwYXJlbnQpO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbihlbCwgc2V0RnVuY3Rpb24sIHsgZHVyaW5nLCBzdGFydDogc3RhcnQyLCBlbmQgfSA9IHt9LCBiZWZvcmUgPSAoKSA9PiB7XG59LCBhZnRlciA9ICgpID0+IHtcbn0pIHtcbiAgaWYgKGVsLl94X3RyYW5zaXRpb25pbmcpXG4gICAgZWwuX3hfdHJhbnNpdGlvbmluZy5jYW5jZWwoKTtcbiAgaWYgKE9iamVjdC5rZXlzKGR1cmluZykubGVuZ3RoID09PSAwICYmIE9iamVjdC5rZXlzKHN0YXJ0MikubGVuZ3RoID09PSAwICYmIE9iamVjdC5rZXlzKGVuZCkubGVuZ3RoID09PSAwKSB7XG4gICAgYmVmb3JlKCk7XG4gICAgYWZ0ZXIoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IHVuZG9TdGFydCwgdW5kb0R1cmluZywgdW5kb0VuZDtcbiAgcGVyZm9ybVRyYW5zaXRpb24oZWwsIHtcbiAgICBzdGFydCgpIHtcbiAgICAgIHVuZG9TdGFydCA9IHNldEZ1bmN0aW9uKGVsLCBzdGFydDIpO1xuICAgIH0sXG4gICAgZHVyaW5nKCkge1xuICAgICAgdW5kb0R1cmluZyA9IHNldEZ1bmN0aW9uKGVsLCBkdXJpbmcpO1xuICAgIH0sXG4gICAgYmVmb3JlLFxuICAgIGVuZCgpIHtcbiAgICAgIHVuZG9TdGFydCgpO1xuICAgICAgdW5kb0VuZCA9IHNldEZ1bmN0aW9uKGVsLCBlbmQpO1xuICAgIH0sXG4gICAgYWZ0ZXIsXG4gICAgY2xlYW51cCgpIHtcbiAgICAgIHVuZG9EdXJpbmcoKTtcbiAgICAgIHVuZG9FbmQoKTtcbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gcGVyZm9ybVRyYW5zaXRpb24oZWwsIHN0YWdlcykge1xuICBsZXQgaW50ZXJydXB0ZWQsIHJlYWNoZWRCZWZvcmUsIHJlYWNoZWRFbmQ7XG4gIGxldCBmaW5pc2ggPSBvbmNlKCgpID0+IHtcbiAgICBtdXRhdGVEb20oKCkgPT4ge1xuICAgICAgaW50ZXJydXB0ZWQgPSB0cnVlO1xuICAgICAgaWYgKCFyZWFjaGVkQmVmb3JlKVxuICAgICAgICBzdGFnZXMuYmVmb3JlKCk7XG4gICAgICBpZiAoIXJlYWNoZWRFbmQpIHtcbiAgICAgICAgc3RhZ2VzLmVuZCgpO1xuICAgICAgICByZWxlYXNlTmV4dFRpY2tzKCk7XG4gICAgICB9XG4gICAgICBzdGFnZXMuYWZ0ZXIoKTtcbiAgICAgIGlmIChlbC5pc0Nvbm5lY3RlZClcbiAgICAgICAgc3RhZ2VzLmNsZWFudXAoKTtcbiAgICAgIGRlbGV0ZSBlbC5feF90cmFuc2l0aW9uaW5nO1xuICAgIH0pO1xuICB9KTtcbiAgZWwuX3hfdHJhbnNpdGlvbmluZyA9IHtcbiAgICBiZWZvcmVDYW5jZWxzOiBbXSxcbiAgICBiZWZvcmVDYW5jZWwoY2FsbGJhY2spIHtcbiAgICAgIHRoaXMuYmVmb3JlQ2FuY2Vscy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9LFxuICAgIGNhbmNlbDogb25jZShmdW5jdGlvbigpIHtcbiAgICAgIHdoaWxlICh0aGlzLmJlZm9yZUNhbmNlbHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuYmVmb3JlQ2FuY2Vscy5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgICA7XG4gICAgICBmaW5pc2goKTtcbiAgICB9KSxcbiAgICBmaW5pc2hcbiAgfTtcbiAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICBzdGFnZXMuc3RhcnQoKTtcbiAgICBzdGFnZXMuZHVyaW5nKCk7XG4gIH0pO1xuICBob2xkTmV4dFRpY2tzKCk7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgaWYgKGludGVycnVwdGVkKVxuICAgICAgcmV0dXJuO1xuICAgIGxldCBkdXJhdGlvbiA9IE51bWJlcihnZXRDb21wdXRlZFN0eWxlKGVsKS50cmFuc2l0aW9uRHVyYXRpb24ucmVwbGFjZSgvLC4qLywgXCJcIikucmVwbGFjZShcInNcIiwgXCJcIikpICogMWUzO1xuICAgIGxldCBkZWxheSA9IE51bWJlcihnZXRDb21wdXRlZFN0eWxlKGVsKS50cmFuc2l0aW9uRGVsYXkucmVwbGFjZSgvLC4qLywgXCJcIikucmVwbGFjZShcInNcIiwgXCJcIikpICogMWUzO1xuICAgIGlmIChkdXJhdGlvbiA9PT0gMClcbiAgICAgIGR1cmF0aW9uID0gTnVtYmVyKGdldENvbXB1dGVkU3R5bGUoZWwpLmFuaW1hdGlvbkR1cmF0aW9uLnJlcGxhY2UoXCJzXCIsIFwiXCIpKSAqIDFlMztcbiAgICBtdXRhdGVEb20oKCkgPT4ge1xuICAgICAgc3RhZ2VzLmJlZm9yZSgpO1xuICAgIH0pO1xuICAgIHJlYWNoZWRCZWZvcmUgPSB0cnVlO1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICBpZiAoaW50ZXJydXB0ZWQpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG11dGF0ZURvbSgoKSA9PiB7XG4gICAgICAgIHN0YWdlcy5lbmQoKTtcbiAgICAgIH0pO1xuICAgICAgcmVsZWFzZU5leHRUaWNrcygpO1xuICAgICAgc2V0VGltZW91dChlbC5feF90cmFuc2l0aW9uaW5nLmZpbmlzaCwgZHVyYXRpb24gKyBkZWxheSk7XG4gICAgICByZWFjaGVkRW5kID0gdHJ1ZTtcbiAgICB9KTtcbiAgfSk7XG59XG5mdW5jdGlvbiBtb2RpZmllclZhbHVlKG1vZGlmaWVycywga2V5LCBmYWxsYmFjaykge1xuICBpZiAobW9kaWZpZXJzLmluZGV4T2Yoa2V5KSA9PT0gLTEpXG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICBjb25zdCByYXdWYWx1ZSA9IG1vZGlmaWVyc1ttb2RpZmllcnMuaW5kZXhPZihrZXkpICsgMV07XG4gIGlmICghcmF3VmFsdWUpXG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICBpZiAoa2V5ID09PSBcInNjYWxlXCIpIHtcbiAgICBpZiAoaXNOYU4ocmF3VmFsdWUpKVxuICAgICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG4gIGlmIChrZXkgPT09IFwiZHVyYXRpb25cIiB8fCBrZXkgPT09IFwiZGVsYXlcIikge1xuICAgIGxldCBtYXRjaCA9IHJhd1ZhbHVlLm1hdGNoKC8oWzAtOV0rKW1zLyk7XG4gICAgaWYgKG1hdGNoKVxuICAgICAgcmV0dXJuIG1hdGNoWzFdO1xuICB9XG4gIGlmIChrZXkgPT09IFwib3JpZ2luXCIpIHtcbiAgICBpZiAoW1widG9wXCIsIFwicmlnaHRcIiwgXCJsZWZ0XCIsIFwiY2VudGVyXCIsIFwiYm90dG9tXCJdLmluY2x1ZGVzKG1vZGlmaWVyc1ttb2RpZmllcnMuaW5kZXhPZihrZXkpICsgMl0pKSB7XG4gICAgICByZXR1cm4gW3Jhd1ZhbHVlLCBtb2RpZmllcnNbbW9kaWZpZXJzLmluZGV4T2Yoa2V5KSArIDJdXS5qb2luKFwiIFwiKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJhd1ZhbHVlO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvY2xvbmUuanNcbnZhciBpc0Nsb25pbmcgPSBmYWxzZTtcbmZ1bmN0aW9uIHNraXBEdXJpbmdDbG9uZShjYWxsYmFjaywgZmFsbGJhY2sgPSAoKSA9PiB7XG59KSB7XG4gIHJldHVybiAoLi4uYXJncykgPT4gaXNDbG9uaW5nID8gZmFsbGJhY2soLi4uYXJncykgOiBjYWxsYmFjayguLi5hcmdzKTtcbn1cbmZ1bmN0aW9uIG9ubHlEdXJpbmdDbG9uZShjYWxsYmFjaykge1xuICByZXR1cm4gKC4uLmFyZ3MpID0+IGlzQ2xvbmluZyAmJiBjYWxsYmFjayguLi5hcmdzKTtcbn1cbnZhciBpbnRlcmNlcHRvcnMgPSBbXTtcbmZ1bmN0aW9uIGludGVyY2VwdENsb25lKGNhbGxiYWNrKSB7XG4gIGludGVyY2VwdG9ycy5wdXNoKGNhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGNsb25lTm9kZShmcm9tLCB0bykge1xuICBpbnRlcmNlcHRvcnMuZm9yRWFjaCgoaSkgPT4gaShmcm9tLCB0bykpO1xuICBpc0Nsb25pbmcgPSB0cnVlO1xuICBkb250UmVnaXN0ZXJSZWFjdGl2ZVNpZGVFZmZlY3RzKCgpID0+IHtcbiAgICBpbml0VHJlZSh0bywgKGVsLCBjYWxsYmFjaykgPT4ge1xuICAgICAgY2FsbGJhY2soZWwsICgpID0+IHtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbiAgaXNDbG9uaW5nID0gZmFsc2U7XG59XG52YXIgaXNDbG9uaW5nTGVnYWN5ID0gZmFsc2U7XG5mdW5jdGlvbiBjbG9uZShvbGRFbCwgbmV3RWwpIHtcbiAgaWYgKCFuZXdFbC5feF9kYXRhU3RhY2spXG4gICAgbmV3RWwuX3hfZGF0YVN0YWNrID0gb2xkRWwuX3hfZGF0YVN0YWNrO1xuICBpc0Nsb25pbmcgPSB0cnVlO1xuICBpc0Nsb25pbmdMZWdhY3kgPSB0cnVlO1xuICBkb250UmVnaXN0ZXJSZWFjdGl2ZVNpZGVFZmZlY3RzKCgpID0+IHtcbiAgICBjbG9uZVRyZWUobmV3RWwpO1xuICB9KTtcbiAgaXNDbG9uaW5nID0gZmFsc2U7XG4gIGlzQ2xvbmluZ0xlZ2FjeSA9IGZhbHNlO1xufVxuZnVuY3Rpb24gY2xvbmVUcmVlKGVsKSB7XG4gIGxldCBoYXNSdW5UaHJvdWdoRmlyc3RFbCA9IGZhbHNlO1xuICBsZXQgc2hhbGxvd1dhbGtlciA9IChlbDIsIGNhbGxiYWNrKSA9PiB7XG4gICAgd2FsayhlbDIsIChlbDMsIHNraXApID0+IHtcbiAgICAgIGlmIChoYXNSdW5UaHJvdWdoRmlyc3RFbCAmJiBpc1Jvb3QoZWwzKSlcbiAgICAgICAgcmV0dXJuIHNraXAoKTtcbiAgICAgIGhhc1J1blRocm91Z2hGaXJzdEVsID0gdHJ1ZTtcbiAgICAgIGNhbGxiYWNrKGVsMywgc2tpcCk7XG4gICAgfSk7XG4gIH07XG4gIGluaXRUcmVlKGVsLCBzaGFsbG93V2Fsa2VyKTtcbn1cbmZ1bmN0aW9uIGRvbnRSZWdpc3RlclJlYWN0aXZlU2lkZUVmZmVjdHMoY2FsbGJhY2spIHtcbiAgbGV0IGNhY2hlID0gZWZmZWN0O1xuICBvdmVycmlkZUVmZmVjdCgoY2FsbGJhY2syLCBlbCkgPT4ge1xuICAgIGxldCBzdG9yZWRFZmZlY3QgPSBjYWNoZShjYWxsYmFjazIpO1xuICAgIHJlbGVhc2Uoc3RvcmVkRWZmZWN0KTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgIH07XG4gIH0pO1xuICBjYWxsYmFjaygpO1xuICBvdmVycmlkZUVmZmVjdChjYWNoZSk7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy91dGlscy9iaW5kLmpzXG5mdW5jdGlvbiBiaW5kKGVsLCBuYW1lLCB2YWx1ZSwgbW9kaWZpZXJzID0gW10pIHtcbiAgaWYgKCFlbC5feF9iaW5kaW5ncylcbiAgICBlbC5feF9iaW5kaW5ncyA9IHJlYWN0aXZlKHt9KTtcbiAgZWwuX3hfYmluZGluZ3NbbmFtZV0gPSB2YWx1ZTtcbiAgbmFtZSA9IG1vZGlmaWVycy5pbmNsdWRlcyhcImNhbWVsXCIpID8gY2FtZWxDYXNlKG5hbWUpIDogbmFtZTtcbiAgc3dpdGNoIChuYW1lKSB7XG4gICAgY2FzZSBcInZhbHVlXCI6XG4gICAgICBiaW5kSW5wdXRWYWx1ZShlbCwgdmFsdWUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0eWxlXCI6XG4gICAgICBiaW5kU3R5bGVzKGVsLCB2YWx1ZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiY2xhc3NcIjpcbiAgICAgIGJpbmRDbGFzc2VzKGVsLCB2YWx1ZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwic2VsZWN0ZWRcIjpcbiAgICBjYXNlIFwiY2hlY2tlZFwiOlxuICAgICAgYmluZEF0dHJpYnV0ZUFuZFByb3BlcnR5KGVsLCBuYW1lLCB2YWx1ZSk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgYmluZEF0dHJpYnV0ZShlbCwgbmFtZSwgdmFsdWUpO1xuICAgICAgYnJlYWs7XG4gIH1cbn1cbmZ1bmN0aW9uIGJpbmRJbnB1dFZhbHVlKGVsLCB2YWx1ZSkge1xuICBpZiAoZWwudHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgaWYgKGVsLmF0dHJpYnV0ZXMudmFsdWUgPT09IHZvaWQgMCkge1xuICAgICAgZWwudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgaWYgKHdpbmRvdy5mcm9tTW9kZWwpIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIGVsLmNoZWNrZWQgPSBzYWZlUGFyc2VCb29sZWFuKGVsLnZhbHVlKSA9PT0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5jaGVja2VkID0gY2hlY2tlZEF0dHJMb29zZUNvbXBhcmUoZWwudmFsdWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoZWwudHlwZSA9PT0gXCJjaGVja2JveFwiKSB7XG4gICAgaWYgKE51bWJlci5pc0ludGVnZXIodmFsdWUpKSB7XG4gICAgICBlbC52YWx1ZSA9IHZhbHVlO1xuICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIHR5cGVvZiB2YWx1ZSAhPT0gXCJib29sZWFuXCIgJiYgIVtudWxsLCB2b2lkIDBdLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgZWwudmFsdWUgPSBTdHJpbmcodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgZWwuY2hlY2tlZCA9IHZhbHVlLnNvbWUoKHZhbCkgPT4gY2hlY2tlZEF0dHJMb29zZUNvbXBhcmUodmFsLCBlbC52YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuY2hlY2tlZCA9ICEhdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGVsLnRhZ05hbWUgPT09IFwiU0VMRUNUXCIpIHtcbiAgICB1cGRhdGVTZWxlY3QoZWwsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoZWwudmFsdWUgPT09IHZhbHVlKVxuICAgICAgcmV0dXJuO1xuICAgIGVsLnZhbHVlID0gdmFsdWUgPT09IHZvaWQgMCA/IFwiXCIgOiB2YWx1ZTtcbiAgfVxufVxuZnVuY3Rpb24gYmluZENsYXNzZXMoZWwsIHZhbHVlKSB7XG4gIGlmIChlbC5feF91bmRvQWRkZWRDbGFzc2VzKVxuICAgIGVsLl94X3VuZG9BZGRlZENsYXNzZXMoKTtcbiAgZWwuX3hfdW5kb0FkZGVkQ2xhc3NlcyA9IHNldENsYXNzZXMoZWwsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGJpbmRTdHlsZXMoZWwsIHZhbHVlKSB7XG4gIGlmIChlbC5feF91bmRvQWRkZWRTdHlsZXMpXG4gICAgZWwuX3hfdW5kb0FkZGVkU3R5bGVzKCk7XG4gIGVsLl94X3VuZG9BZGRlZFN0eWxlcyA9IHNldFN0eWxlcyhlbCwgdmFsdWUpO1xufVxuZnVuY3Rpb24gYmluZEF0dHJpYnV0ZUFuZFByb3BlcnR5KGVsLCBuYW1lLCB2YWx1ZSkge1xuICBiaW5kQXR0cmlidXRlKGVsLCBuYW1lLCB2YWx1ZSk7XG4gIHNldFByb3BlcnR5SWZDaGFuZ2VkKGVsLCBuYW1lLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBiaW5kQXR0cmlidXRlKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBpZiAoW251bGwsIHZvaWQgMCwgZmFsc2VdLmluY2x1ZGVzKHZhbHVlKSAmJiBhdHRyaWJ1dGVTaG91bGRudEJlUHJlc2VydmVkSWZGYWxzeShuYW1lKSkge1xuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoaXNCb29sZWFuQXR0cihuYW1lKSlcbiAgICAgIHZhbHVlID0gbmFtZTtcbiAgICBzZXRJZkNoYW5nZWQoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfVxufVxuZnVuY3Rpb24gc2V0SWZDaGFuZ2VkKGVsLCBhdHRyTmFtZSwgdmFsdWUpIHtcbiAgaWYgKGVsLmdldEF0dHJpYnV0ZShhdHRyTmFtZSkgIT0gdmFsdWUpIHtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIHZhbHVlKTtcbiAgfVxufVxuZnVuY3Rpb24gc2V0UHJvcGVydHlJZkNoYW5nZWQoZWwsIHByb3BOYW1lLCB2YWx1ZSkge1xuICBpZiAoZWxbcHJvcE5hbWVdICE9PSB2YWx1ZSkge1xuICAgIGVsW3Byb3BOYW1lXSA9IHZhbHVlO1xuICB9XG59XG5mdW5jdGlvbiB1cGRhdGVTZWxlY3QoZWwsIHZhbHVlKSB7XG4gIGNvbnN0IGFycmF5V3JhcHBlZFZhbHVlID0gW10uY29uY2F0KHZhbHVlKS5tYXAoKHZhbHVlMikgPT4ge1xuICAgIHJldHVybiB2YWx1ZTIgKyBcIlwiO1xuICB9KTtcbiAgQXJyYXkuZnJvbShlbC5vcHRpb25zKS5mb3JFYWNoKChvcHRpb24pID0+IHtcbiAgICBvcHRpb24uc2VsZWN0ZWQgPSBhcnJheVdyYXBwZWRWYWx1ZS5pbmNsdWRlcyhvcHRpb24udmFsdWUpO1xuICB9KTtcbn1cbmZ1bmN0aW9uIGNhbWVsQ2FzZShzdWJqZWN0KSB7XG4gIHJldHVybiBzdWJqZWN0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvLShcXHcpL2csIChtYXRjaCwgY2hhcikgPT4gY2hhci50b1VwcGVyQ2FzZSgpKTtcbn1cbmZ1bmN0aW9uIGNoZWNrZWRBdHRyTG9vc2VDb21wYXJlKHZhbHVlQSwgdmFsdWVCKSB7XG4gIHJldHVybiB2YWx1ZUEgPT0gdmFsdWVCO1xufVxuZnVuY3Rpb24gc2FmZVBhcnNlQm9vbGVhbihyYXdWYWx1ZSkge1xuICBpZiAoWzEsIFwiMVwiLCBcInRydWVcIiwgXCJvblwiLCBcInllc1wiLCB0cnVlXS5pbmNsdWRlcyhyYXdWYWx1ZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoWzAsIFwiMFwiLCBcImZhbHNlXCIsIFwib2ZmXCIsIFwibm9cIiwgZmFsc2VdLmluY2x1ZGVzKHJhd1ZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gcmF3VmFsdWUgPyBCb29sZWFuKHJhd1ZhbHVlKSA6IG51bGw7XG59XG5mdW5jdGlvbiBpc0Jvb2xlYW5BdHRyKGF0dHJOYW1lKSB7XG4gIGNvbnN0IGJvb2xlYW5BdHRyaWJ1dGVzID0gW1xuICAgIFwiZGlzYWJsZWRcIixcbiAgICBcImNoZWNrZWRcIixcbiAgICBcInJlcXVpcmVkXCIsXG4gICAgXCJyZWFkb25seVwiLFxuICAgIFwiaGlkZGVuXCIsXG4gICAgXCJvcGVuXCIsXG4gICAgXCJzZWxlY3RlZFwiLFxuICAgIFwiYXV0b2ZvY3VzXCIsXG4gICAgXCJpdGVtc2NvcGVcIixcbiAgICBcIm11bHRpcGxlXCIsXG4gICAgXCJub3ZhbGlkYXRlXCIsXG4gICAgXCJhbGxvd2Z1bGxzY3JlZW5cIixcbiAgICBcImFsbG93cGF5bWVudHJlcXVlc3RcIixcbiAgICBcImZvcm1ub3ZhbGlkYXRlXCIsXG4gICAgXCJhdXRvcGxheVwiLFxuICAgIFwiY29udHJvbHNcIixcbiAgICBcImxvb3BcIixcbiAgICBcIm11dGVkXCIsXG4gICAgXCJwbGF5c2lubGluZVwiLFxuICAgIFwiZGVmYXVsdFwiLFxuICAgIFwiaXNtYXBcIixcbiAgICBcInJldmVyc2VkXCIsXG4gICAgXCJhc3luY1wiLFxuICAgIFwiZGVmZXJcIixcbiAgICBcIm5vbW9kdWxlXCJcbiAgXTtcbiAgcmV0dXJuIGJvb2xlYW5BdHRyaWJ1dGVzLmluY2x1ZGVzKGF0dHJOYW1lKTtcbn1cbmZ1bmN0aW9uIGF0dHJpYnV0ZVNob3VsZG50QmVQcmVzZXJ2ZWRJZkZhbHN5KG5hbWUpIHtcbiAgcmV0dXJuICFbXCJhcmlhLXByZXNzZWRcIiwgXCJhcmlhLWNoZWNrZWRcIiwgXCJhcmlhLWV4cGFuZGVkXCIsIFwiYXJpYS1zZWxlY3RlZFwiXS5pbmNsdWRlcyhuYW1lKTtcbn1cbmZ1bmN0aW9uIGdldEJpbmRpbmcoZWwsIG5hbWUsIGZhbGxiYWNrKSB7XG4gIGlmIChlbC5feF9iaW5kaW5ncyAmJiBlbC5feF9iaW5kaW5nc1tuYW1lXSAhPT0gdm9pZCAwKVxuICAgIHJldHVybiBlbC5feF9iaW5kaW5nc1tuYW1lXTtcbiAgcmV0dXJuIGdldEF0dHJpYnV0ZUJpbmRpbmcoZWwsIG5hbWUsIGZhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGV4dHJhY3RQcm9wKGVsLCBuYW1lLCBmYWxsYmFjaywgZXh0cmFjdCA9IHRydWUpIHtcbiAgaWYgKGVsLl94X2JpbmRpbmdzICYmIGVsLl94X2JpbmRpbmdzW25hbWVdICE9PSB2b2lkIDApXG4gICAgcmV0dXJuIGVsLl94X2JpbmRpbmdzW25hbWVdO1xuICBpZiAoZWwuX3hfaW5saW5lQmluZGluZ3MgJiYgZWwuX3hfaW5saW5lQmluZGluZ3NbbmFtZV0gIT09IHZvaWQgMCkge1xuICAgIGxldCBiaW5kaW5nID0gZWwuX3hfaW5saW5lQmluZGluZ3NbbmFtZV07XG4gICAgYmluZGluZy5leHRyYWN0ID0gZXh0cmFjdDtcbiAgICByZXR1cm4gZG9udEF1dG9FdmFsdWF0ZUZ1bmN0aW9ucygoKSA9PiB7XG4gICAgICByZXR1cm4gZXZhbHVhdGUoZWwsIGJpbmRpbmcuZXhwcmVzc2lvbik7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGdldEF0dHJpYnV0ZUJpbmRpbmcoZWwsIG5hbWUsIGZhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZUJpbmRpbmcoZWwsIG5hbWUsIGZhbGxiYWNrKSB7XG4gIGxldCBhdHRyID0gZWwuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICBpZiAoYXR0ciA9PT0gbnVsbClcbiAgICByZXR1cm4gdHlwZW9mIGZhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIgPyBmYWxsYmFjaygpIDogZmFsbGJhY2s7XG4gIGlmIChhdHRyID09PSBcIlwiKVxuICAgIHJldHVybiB0cnVlO1xuICBpZiAoaXNCb29sZWFuQXR0cihuYW1lKSkge1xuICAgIHJldHVybiAhIVtuYW1lLCBcInRydWVcIl0uaW5jbHVkZXMoYXR0cik7XG4gIH1cbiAgcmV0dXJuIGF0dHI7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy91dGlscy9kZWJvdW5jZS5qc1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCkge1xuICB2YXIgdGltZW91dDtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gIH07XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy91dGlscy90aHJvdHRsZS5qc1xuZnVuY3Rpb24gdGhyb3R0bGUoZnVuYywgbGltaXQpIHtcbiAgbGV0IGluVGhyb3R0bGU7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBsZXQgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgaWYgKCFpblRocm90dGxlKSB7XG4gICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgaW5UaHJvdHRsZSA9IHRydWU7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IGluVGhyb3R0bGUgPSBmYWxzZSwgbGltaXQpO1xuICAgIH1cbiAgfTtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2VudGFuZ2xlLmpzXG5mdW5jdGlvbiBlbnRhbmdsZSh7IGdldDogb3V0ZXJHZXQsIHNldDogb3V0ZXJTZXQgfSwgeyBnZXQ6IGlubmVyR2V0LCBzZXQ6IGlubmVyU2V0IH0pIHtcbiAgbGV0IGZpcnN0UnVuID0gdHJ1ZTtcbiAgbGV0IG91dGVySGFzaDtcbiAgbGV0IHJlZmVyZW5jZSA9IGVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb3V0ZXIgPSBvdXRlckdldCgpO1xuICAgIGNvbnN0IGlubmVyID0gaW5uZXJHZXQoKTtcbiAgICBpZiAoZmlyc3RSdW4pIHtcbiAgICAgIGlubmVyU2V0KGNsb25lSWZPYmplY3Qob3V0ZXIpKTtcbiAgICAgIGZpcnN0UnVuID0gZmFsc2U7XG4gICAgICBvdXRlckhhc2ggPSBKU09OLnN0cmluZ2lmeShvdXRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG91dGVySGFzaExhdGVzdCA9IEpTT04uc3RyaW5naWZ5KG91dGVyKTtcbiAgICAgIGlmIChvdXRlckhhc2hMYXRlc3QgIT09IG91dGVySGFzaCkge1xuICAgICAgICBpbm5lclNldChjbG9uZUlmT2JqZWN0KG91dGVyKSk7XG4gICAgICAgIG91dGVySGFzaCA9IG91dGVySGFzaExhdGVzdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dGVyU2V0KGNsb25lSWZPYmplY3QoaW5uZXIpKTtcbiAgICAgICAgb3V0ZXJIYXNoID0gSlNPTi5zdHJpbmdpZnkoaW5uZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBKU09OLnN0cmluZ2lmeShpbm5lckdldCgpKTtcbiAgICBKU09OLnN0cmluZ2lmeShvdXRlckdldCgpKTtcbiAgfSk7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgcmVsZWFzZShyZWZlcmVuY2UpO1xuICB9O1xufVxuZnVuY3Rpb24gY2xvbmVJZk9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh2YWx1ZSkpIDogdmFsdWU7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9wbHVnaW4uanNcbmZ1bmN0aW9uIHBsdWdpbihjYWxsYmFjaykge1xuICBsZXQgY2FsbGJhY2tzID0gQXJyYXkuaXNBcnJheShjYWxsYmFjaykgPyBjYWxsYmFjayA6IFtjYWxsYmFja107XG4gIGNhbGxiYWNrcy5mb3JFYWNoKChpKSA9PiBpKGFscGluZV9kZWZhdWx0KSk7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9zdG9yZS5qc1xudmFyIHN0b3JlcyA9IHt9O1xudmFyIGlzUmVhY3RpdmUgPSBmYWxzZTtcbmZ1bmN0aW9uIHN0b3JlKG5hbWUsIHZhbHVlKSB7XG4gIGlmICghaXNSZWFjdGl2ZSkge1xuICAgIHN0b3JlcyA9IHJlYWN0aXZlKHN0b3Jlcyk7XG4gICAgaXNSZWFjdGl2ZSA9IHRydWU7XG4gIH1cbiAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcbiAgICByZXR1cm4gc3RvcmVzW25hbWVdO1xuICB9XG4gIHN0b3Jlc1tuYW1lXSA9IHZhbHVlO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIHZhbHVlLmhhc093blByb3BlcnR5KFwiaW5pdFwiKSAmJiB0eXBlb2YgdmFsdWUuaW5pdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgc3RvcmVzW25hbWVdLmluaXQoKTtcbiAgfVxuICBpbml0SW50ZXJjZXB0b3JzMihzdG9yZXNbbmFtZV0pO1xufVxuZnVuY3Rpb24gZ2V0U3RvcmVzKCkge1xuICByZXR1cm4gc3RvcmVzO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvYmluZHMuanNcbnZhciBiaW5kcyA9IHt9O1xuZnVuY3Rpb24gYmluZDIobmFtZSwgYmluZGluZ3MpIHtcbiAgbGV0IGdldEJpbmRpbmdzID0gdHlwZW9mIGJpbmRpbmdzICE9PSBcImZ1bmN0aW9uXCIgPyAoKSA9PiBiaW5kaW5ncyA6IGJpbmRpbmdzO1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICByZXR1cm4gYXBwbHlCaW5kaW5nc09iamVjdChuYW1lLCBnZXRCaW5kaW5ncygpKTtcbiAgfSBlbHNlIHtcbiAgICBiaW5kc1tuYW1lXSA9IGdldEJpbmRpbmdzO1xuICB9XG4gIHJldHVybiAoKSA9PiB7XG4gIH07XG59XG5mdW5jdGlvbiBpbmplY3RCaW5kaW5nUHJvdmlkZXJzKG9iaikge1xuICBPYmplY3QuZW50cmllcyhiaW5kcykuZm9yRWFjaCgoW25hbWUsIGNhbGxiYWNrXSkgPT4ge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKC4uLmFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cbmZ1bmN0aW9uIGFwcGx5QmluZGluZ3NPYmplY3QoZWwsIG9iaiwgb3JpZ2luYWwpIHtcbiAgbGV0IGNsZWFudXBSdW5uZXJzID0gW107XG4gIHdoaWxlIChjbGVhbnVwUnVubmVycy5sZW5ndGgpXG4gICAgY2xlYW51cFJ1bm5lcnMucG9wKCkoKTtcbiAgbGV0IGF0dHJpYnV0ZXMgPSBPYmplY3QuZW50cmllcyhvYmopLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4gKHsgbmFtZSwgdmFsdWUgfSkpO1xuICBsZXQgc3RhdGljQXR0cmlidXRlcyA9IGF0dHJpYnV0ZXNPbmx5KGF0dHJpYnV0ZXMpO1xuICBhdHRyaWJ1dGVzID0gYXR0cmlidXRlcy5tYXAoKGF0dHJpYnV0ZSkgPT4ge1xuICAgIGlmIChzdGF0aWNBdHRyaWJ1dGVzLmZpbmQoKGF0dHIpID0+IGF0dHIubmFtZSA9PT0gYXR0cmlidXRlLm5hbWUpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBgeC1iaW5kOiR7YXR0cmlidXRlLm5hbWV9YCxcbiAgICAgICAgdmFsdWU6IGBcIiR7YXR0cmlidXRlLnZhbHVlfVwiYFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnV0ZTtcbiAgfSk7XG4gIGRpcmVjdGl2ZXMoZWwsIGF0dHJpYnV0ZXMsIG9yaWdpbmFsKS5tYXAoKGhhbmRsZSkgPT4ge1xuICAgIGNsZWFudXBSdW5uZXJzLnB1c2goaGFuZGxlLnJ1bkNsZWFudXBzKTtcbiAgICBoYW5kbGUoKTtcbiAgfSk7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgd2hpbGUgKGNsZWFudXBSdW5uZXJzLmxlbmd0aClcbiAgICAgIGNsZWFudXBSdW5uZXJzLnBvcCgpKCk7XG4gIH07XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kYXRhcy5qc1xudmFyIGRhdGFzID0ge307XG5mdW5jdGlvbiBkYXRhKG5hbWUsIGNhbGxiYWNrKSB7XG4gIGRhdGFzW25hbWVdID0gY2FsbGJhY2s7XG59XG5mdW5jdGlvbiBpbmplY3REYXRhUHJvdmlkZXJzKG9iaiwgY29udGV4dCkge1xuICBPYmplY3QuZW50cmllcyhkYXRhcykuZm9yRWFjaCgoW25hbWUsIGNhbGxiYWNrXSkgPT4ge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmJpbmQoY29udGV4dCkoLi4uYXJncyk7XG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBvYmo7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9hbHBpbmUuanNcbnZhciBBbHBpbmUgPSB7XG4gIGdldCByZWFjdGl2ZSgpIHtcbiAgICByZXR1cm4gcmVhY3RpdmU7XG4gIH0sXG4gIGdldCByZWxlYXNlKCkge1xuICAgIHJldHVybiByZWxlYXNlO1xuICB9LFxuICBnZXQgZWZmZWN0KCkge1xuICAgIHJldHVybiBlZmZlY3Q7XG4gIH0sXG4gIGdldCByYXcoKSB7XG4gICAgcmV0dXJuIHJhdztcbiAgfSxcbiAgdmVyc2lvbjogXCIzLjEzLjNcIixcbiAgZmx1c2hBbmRTdG9wRGVmZXJyaW5nTXV0YXRpb25zLFxuICBkb250QXV0b0V2YWx1YXRlRnVuY3Rpb25zLFxuICBkaXNhYmxlRWZmZWN0U2NoZWR1bGluZyxcbiAgc3RhcnRPYnNlcnZpbmdNdXRhdGlvbnMsXG4gIHN0b3BPYnNlcnZpbmdNdXRhdGlvbnMsXG4gIHNldFJlYWN0aXZpdHlFbmdpbmUsXG4gIG9uQXR0cmlidXRlUmVtb3ZlZCxcbiAgb25BdHRyaWJ1dGVzQWRkZWQsXG4gIGNsb3Nlc3REYXRhU3RhY2ssXG4gIHNraXBEdXJpbmdDbG9uZSxcbiAgb25seUR1cmluZ0Nsb25lLFxuICBhZGRSb290U2VsZWN0b3IsXG4gIGFkZEluaXRTZWxlY3RvcixcbiAgaW50ZXJjZXB0Q2xvbmUsXG4gIGFkZFNjb3BlVG9Ob2RlLFxuICBkZWZlck11dGF0aW9ucyxcbiAgbWFwQXR0cmlidXRlcyxcbiAgZXZhbHVhdGVMYXRlcixcbiAgaW50ZXJjZXB0SW5pdCxcbiAgc2V0RXZhbHVhdG9yLFxuICBtZXJnZVByb3hpZXMsXG4gIGV4dHJhY3RQcm9wLFxuICBmaW5kQ2xvc2VzdCxcbiAgb25FbFJlbW92ZWQsXG4gIGNsb3Nlc3RSb290LFxuICBkZXN0cm95VHJlZSxcbiAgaW50ZXJjZXB0b3IsXG4gIC8vIElOVEVSTkFMOiBub3QgcHVibGljIEFQSSBhbmQgaXMgc3ViamVjdCB0byBjaGFuZ2Ugd2l0aG91dCBtYWpvciByZWxlYXNlLlxuICB0cmFuc2l0aW9uLFxuICAvLyBJTlRFUk5BTFxuICBzZXRTdHlsZXMsXG4gIC8vIElOVEVSTkFMXG4gIG11dGF0ZURvbSxcbiAgZGlyZWN0aXZlLFxuICBlbnRhbmdsZSxcbiAgdGhyb3R0bGUsXG4gIGRlYm91bmNlLFxuICBldmFsdWF0ZSxcbiAgaW5pdFRyZWUsXG4gIG5leHRUaWNrLFxuICBwcmVmaXhlZDogcHJlZml4LFxuICBwcmVmaXg6IHNldFByZWZpeCxcbiAgcGx1Z2luLFxuICBtYWdpYyxcbiAgc3RvcmUsXG4gIHN0YXJ0LFxuICBjbG9uZSxcbiAgLy8gSU5URVJOQUxcbiAgY2xvbmVOb2RlLFxuICAvLyBJTlRFUk5BTFxuICBib3VuZDogZ2V0QmluZGluZyxcbiAgJGRhdGE6IHNjb3BlLFxuICB3YWxrLFxuICBkYXRhLFxuICBiaW5kOiBiaW5kMlxufTtcbnZhciBhbHBpbmVfZGVmYXVsdCA9IEFscGluZTtcblxuLy8gbm9kZV9tb2R1bGVzL0B2dWUvc2hhcmVkL2Rpc3Qvc2hhcmVkLmVzbS1idW5kbGVyLmpzXG5mdW5jdGlvbiBtYWtlTWFwKHN0ciwgZXhwZWN0c0xvd2VyQ2FzZSkge1xuICBjb25zdCBtYXAgPSAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgY29uc3QgbGlzdCA9IHN0ci5zcGxpdChcIixcIik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIG1hcFtsaXN0W2ldXSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIGV4cGVjdHNMb3dlckNhc2UgPyAodmFsKSA9PiAhIW1hcFt2YWwudG9Mb3dlckNhc2UoKV0gOiAodmFsKSA9PiAhIW1hcFt2YWxdO1xufVxudmFyIHNwZWNpYWxCb29sZWFuQXR0cnMgPSBgaXRlbXNjb3BlLGFsbG93ZnVsbHNjcmVlbixmb3Jtbm92YWxpZGF0ZSxpc21hcCxub21vZHVsZSxub3ZhbGlkYXRlLHJlYWRvbmx5YDtcbnZhciBpc0Jvb2xlYW5BdHRyMiA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKHNwZWNpYWxCb29sZWFuQXR0cnMgKyBgLGFzeW5jLGF1dG9mb2N1cyxhdXRvcGxheSxjb250cm9scyxkZWZhdWx0LGRlZmVyLGRpc2FibGVkLGhpZGRlbixsb29wLG9wZW4scmVxdWlyZWQscmV2ZXJzZWQsc2NvcGVkLHNlYW1sZXNzLGNoZWNrZWQsbXV0ZWQsbXVsdGlwbGUsc2VsZWN0ZWRgKTtcbnZhciBFTVBUWV9PQkogPSB0cnVlID8gT2JqZWN0LmZyZWV6ZSh7fSkgOiB7fTtcbnZhciBFTVBUWV9BUlIgPSB0cnVlID8gT2JqZWN0LmZyZWV6ZShbXSkgOiBbXTtcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgaGFzT3duID0gKHZhbCwga2V5KSA9PiBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbCwga2V5KTtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbnZhciBpc01hcCA9ICh2YWwpID0+IHRvVHlwZVN0cmluZyh2YWwpID09PSBcIltvYmplY3QgTWFwXVwiO1xudmFyIGlzU3RyaW5nID0gKHZhbCkgPT4gdHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIjtcbnZhciBpc1N5bWJvbCA9ICh2YWwpID0+IHR5cGVvZiB2YWwgPT09IFwic3ltYm9sXCI7XG52YXIgaXNPYmplY3QgPSAodmFsKSA9PiB2YWwgIT09IG51bGwgJiYgdHlwZW9mIHZhbCA9PT0gXCJvYmplY3RcIjtcbnZhciBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgdG9UeXBlU3RyaW5nID0gKHZhbHVlKSA9PiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKTtcbnZhciB0b1Jhd1R5cGUgPSAodmFsdWUpID0+IHtcbiAgcmV0dXJuIHRvVHlwZVN0cmluZyh2YWx1ZSkuc2xpY2UoOCwgLTEpO1xufTtcbnZhciBpc0ludGVnZXJLZXkgPSAoa2V5KSA9PiBpc1N0cmluZyhrZXkpICYmIGtleSAhPT0gXCJOYU5cIiAmJiBrZXlbMF0gIT09IFwiLVwiICYmIFwiXCIgKyBwYXJzZUludChrZXksIDEwKSA9PT0ga2V5O1xudmFyIGNhY2hlU3RyaW5nRnVuY3Rpb24gPSAoZm4pID0+IHtcbiAgY29uc3QgY2FjaGUgPSAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgcmV0dXJuIChzdHIpID0+IHtcbiAgICBjb25zdCBoaXQgPSBjYWNoZVtzdHJdO1xuICAgIHJldHVybiBoaXQgfHwgKGNhY2hlW3N0cl0gPSBmbihzdHIpKTtcbiAgfTtcbn07XG52YXIgY2FtZWxpemVSRSA9IC8tKFxcdykvZztcbnZhciBjYW1lbGl6ZSA9IGNhY2hlU3RyaW5nRnVuY3Rpb24oKHN0cikgPT4ge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoY2FtZWxpemVSRSwgKF8sIGMpID0+IGMgPyBjLnRvVXBwZXJDYXNlKCkgOiBcIlwiKTtcbn0pO1xudmFyIGh5cGhlbmF0ZVJFID0gL1xcQihbQS1aXSkvZztcbnZhciBoeXBoZW5hdGUgPSBjYWNoZVN0cmluZ0Z1bmN0aW9uKChzdHIpID0+IHN0ci5yZXBsYWNlKGh5cGhlbmF0ZVJFLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpKTtcbnZhciBjYXBpdGFsaXplID0gY2FjaGVTdHJpbmdGdW5jdGlvbigoc3RyKSA9PiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSkpO1xudmFyIHRvSGFuZGxlcktleSA9IGNhY2hlU3RyaW5nRnVuY3Rpb24oKHN0cikgPT4gc3RyID8gYG9uJHtjYXBpdGFsaXplKHN0cil9YCA6IGBgKTtcbnZhciBoYXNDaGFuZ2VkID0gKHZhbHVlLCBvbGRWYWx1ZSkgPT4gdmFsdWUgIT09IG9sZFZhbHVlICYmICh2YWx1ZSA9PT0gdmFsdWUgfHwgb2xkVmFsdWUgPT09IG9sZFZhbHVlKTtcblxuLy8gbm9kZV9tb2R1bGVzL0B2dWUvcmVhY3Rpdml0eS9kaXN0L3JlYWN0aXZpdHkuZXNtLWJ1bmRsZXIuanNcbnZhciB0YXJnZXRNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbnZhciBlZmZlY3RTdGFjayA9IFtdO1xudmFyIGFjdGl2ZUVmZmVjdDtcbnZhciBJVEVSQVRFX0tFWSA9IFN5bWJvbCh0cnVlID8gXCJpdGVyYXRlXCIgOiBcIlwiKTtcbnZhciBNQVBfS0VZX0lURVJBVEVfS0VZID0gU3ltYm9sKHRydWUgPyBcIk1hcCBrZXkgaXRlcmF0ZVwiIDogXCJcIik7XG5mdW5jdGlvbiBpc0VmZmVjdChmbikge1xuICByZXR1cm4gZm4gJiYgZm4uX2lzRWZmZWN0ID09PSB0cnVlO1xufVxuZnVuY3Rpb24gZWZmZWN0Mihmbiwgb3B0aW9ucyA9IEVNUFRZX09CSikge1xuICBpZiAoaXNFZmZlY3QoZm4pKSB7XG4gICAgZm4gPSBmbi5yYXc7XG4gIH1cbiAgY29uc3QgZWZmZWN0MyA9IGNyZWF0ZVJlYWN0aXZlRWZmZWN0KGZuLCBvcHRpb25zKTtcbiAgaWYgKCFvcHRpb25zLmxhenkpIHtcbiAgICBlZmZlY3QzKCk7XG4gIH1cbiAgcmV0dXJuIGVmZmVjdDM7XG59XG5mdW5jdGlvbiBzdG9wKGVmZmVjdDMpIHtcbiAgaWYgKGVmZmVjdDMuYWN0aXZlKSB7XG4gICAgY2xlYW51cChlZmZlY3QzKTtcbiAgICBpZiAoZWZmZWN0My5vcHRpb25zLm9uU3RvcCkge1xuICAgICAgZWZmZWN0My5vcHRpb25zLm9uU3RvcCgpO1xuICAgIH1cbiAgICBlZmZlY3QzLmFjdGl2ZSA9IGZhbHNlO1xuICB9XG59XG52YXIgdWlkID0gMDtcbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0aXZlRWZmZWN0KGZuLCBvcHRpb25zKSB7XG4gIGNvbnN0IGVmZmVjdDMgPSBmdW5jdGlvbiByZWFjdGl2ZUVmZmVjdCgpIHtcbiAgICBpZiAoIWVmZmVjdDMuYWN0aXZlKSB7XG4gICAgICByZXR1cm4gZm4oKTtcbiAgICB9XG4gICAgaWYgKCFlZmZlY3RTdGFjay5pbmNsdWRlcyhlZmZlY3QzKSkge1xuICAgICAgY2xlYW51cChlZmZlY3QzKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGVuYWJsZVRyYWNraW5nKCk7XG4gICAgICAgIGVmZmVjdFN0YWNrLnB1c2goZWZmZWN0Myk7XG4gICAgICAgIGFjdGl2ZUVmZmVjdCA9IGVmZmVjdDM7XG4gICAgICAgIHJldHVybiBmbigpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgZWZmZWN0U3RhY2sucG9wKCk7XG4gICAgICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgICAgICAgYWN0aXZlRWZmZWN0ID0gZWZmZWN0U3RhY2tbZWZmZWN0U3RhY2subGVuZ3RoIC0gMV07XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBlZmZlY3QzLmlkID0gdWlkKys7XG4gIGVmZmVjdDMuYWxsb3dSZWN1cnNlID0gISFvcHRpb25zLmFsbG93UmVjdXJzZTtcbiAgZWZmZWN0My5faXNFZmZlY3QgPSB0cnVlO1xuICBlZmZlY3QzLmFjdGl2ZSA9IHRydWU7XG4gIGVmZmVjdDMucmF3ID0gZm47XG4gIGVmZmVjdDMuZGVwcyA9IFtdO1xuICBlZmZlY3QzLm9wdGlvbnMgPSBvcHRpb25zO1xuICByZXR1cm4gZWZmZWN0Mztcbn1cbmZ1bmN0aW9uIGNsZWFudXAoZWZmZWN0Mykge1xuICBjb25zdCB7IGRlcHMgfSA9IGVmZmVjdDM7XG4gIGlmIChkZXBzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVwcy5sZW5ndGg7IGkrKykge1xuICAgICAgZGVwc1tpXS5kZWxldGUoZWZmZWN0Myk7XG4gICAgfVxuICAgIGRlcHMubGVuZ3RoID0gMDtcbiAgfVxufVxudmFyIHNob3VsZFRyYWNrID0gdHJ1ZTtcbnZhciB0cmFja1N0YWNrID0gW107XG5mdW5jdGlvbiBwYXVzZVRyYWNraW5nKCkge1xuICB0cmFja1N0YWNrLnB1c2goc2hvdWxkVHJhY2spO1xuICBzaG91bGRUcmFjayA9IGZhbHNlO1xufVxuZnVuY3Rpb24gZW5hYmxlVHJhY2tpbmcoKSB7XG4gIHRyYWNrU3RhY2sucHVzaChzaG91bGRUcmFjayk7XG4gIHNob3VsZFRyYWNrID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIHJlc2V0VHJhY2tpbmcoKSB7XG4gIGNvbnN0IGxhc3QgPSB0cmFja1N0YWNrLnBvcCgpO1xuICBzaG91bGRUcmFjayA9IGxhc3QgPT09IHZvaWQgMCA/IHRydWUgOiBsYXN0O1xufVxuZnVuY3Rpb24gdHJhY2sodGFyZ2V0LCB0eXBlLCBrZXkpIHtcbiAgaWYgKCFzaG91bGRUcmFjayB8fCBhY3RpdmVFZmZlY3QgPT09IHZvaWQgMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgZGVwc01hcCA9IHRhcmdldE1hcC5nZXQodGFyZ2V0KTtcbiAgaWYgKCFkZXBzTWFwKSB7XG4gICAgdGFyZ2V0TWFwLnNldCh0YXJnZXQsIGRlcHNNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpKTtcbiAgfVxuICBsZXQgZGVwID0gZGVwc01hcC5nZXQoa2V5KTtcbiAgaWYgKCFkZXApIHtcbiAgICBkZXBzTWFwLnNldChrZXksIGRlcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCkpO1xuICB9XG4gIGlmICghZGVwLmhhcyhhY3RpdmVFZmZlY3QpKSB7XG4gICAgZGVwLmFkZChhY3RpdmVFZmZlY3QpO1xuICAgIGFjdGl2ZUVmZmVjdC5kZXBzLnB1c2goZGVwKTtcbiAgICBpZiAoYWN0aXZlRWZmZWN0Lm9wdGlvbnMub25UcmFjaykge1xuICAgICAgYWN0aXZlRWZmZWN0Lm9wdGlvbnMub25UcmFjayh7XG4gICAgICAgIGVmZmVjdDogYWN0aXZlRWZmZWN0LFxuICAgICAgICB0YXJnZXQsXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGtleVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiB0cmlnZ2VyKHRhcmdldCwgdHlwZSwga2V5LCBuZXdWYWx1ZSwgb2xkVmFsdWUsIG9sZFRhcmdldCkge1xuICBjb25zdCBkZXBzTWFwID0gdGFyZ2V0TWFwLmdldCh0YXJnZXQpO1xuICBpZiAoIWRlcHNNYXApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgZWZmZWN0cyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gIGNvbnN0IGFkZDIgPSAoZWZmZWN0c1RvQWRkKSA9PiB7XG4gICAgaWYgKGVmZmVjdHNUb0FkZCkge1xuICAgICAgZWZmZWN0c1RvQWRkLmZvckVhY2goKGVmZmVjdDMpID0+IHtcbiAgICAgICAgaWYgKGVmZmVjdDMgIT09IGFjdGl2ZUVmZmVjdCB8fCBlZmZlY3QzLmFsbG93UmVjdXJzZSkge1xuICAgICAgICAgIGVmZmVjdHMuYWRkKGVmZmVjdDMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG4gIGlmICh0eXBlID09PSBcImNsZWFyXCIpIHtcbiAgICBkZXBzTWFwLmZvckVhY2goYWRkMik7XG4gIH0gZWxzZSBpZiAoa2V5ID09PSBcImxlbmd0aFwiICYmIGlzQXJyYXkodGFyZ2V0KSkge1xuICAgIGRlcHNNYXAuZm9yRWFjaCgoZGVwLCBrZXkyKSA9PiB7XG4gICAgICBpZiAoa2V5MiA9PT0gXCJsZW5ndGhcIiB8fCBrZXkyID49IG5ld1ZhbHVlKSB7XG4gICAgICAgIGFkZDIoZGVwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoa2V5ICE9PSB2b2lkIDApIHtcbiAgICAgIGFkZDIoZGVwc01hcC5nZXQoa2V5KSk7XG4gICAgfVxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcImFkZFwiOlxuICAgICAgICBpZiAoIWlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgIGFkZDIoZGVwc01hcC5nZXQoSVRFUkFURV9LRVkpKTtcbiAgICAgICAgICBpZiAoaXNNYXAodGFyZ2V0KSkge1xuICAgICAgICAgICAgYWRkMihkZXBzTWFwLmdldChNQVBfS0VZX0lURVJBVEVfS0VZKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGlzSW50ZWdlcktleShrZXkpKSB7XG4gICAgICAgICAgYWRkMihkZXBzTWFwLmdldChcImxlbmd0aFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZGVsZXRlXCI6XG4gICAgICAgIGlmICghaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgYWRkMihkZXBzTWFwLmdldChJVEVSQVRFX0tFWSkpO1xuICAgICAgICAgIGlmIChpc01hcCh0YXJnZXQpKSB7XG4gICAgICAgICAgICBhZGQyKGRlcHNNYXAuZ2V0KE1BUF9LRVlfSVRFUkFURV9LRVkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwic2V0XCI6XG4gICAgICAgIGlmIChpc01hcCh0YXJnZXQpKSB7XG4gICAgICAgICAgYWRkMihkZXBzTWFwLmdldChJVEVSQVRFX0tFWSkpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBjb25zdCBydW4gPSAoZWZmZWN0MykgPT4ge1xuICAgIGlmIChlZmZlY3QzLm9wdGlvbnMub25UcmlnZ2VyKSB7XG4gICAgICBlZmZlY3QzLm9wdGlvbnMub25UcmlnZ2VyKHtcbiAgICAgICAgZWZmZWN0OiBlZmZlY3QzLFxuICAgICAgICB0YXJnZXQsXG4gICAgICAgIGtleSxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgbmV3VmFsdWUsXG4gICAgICAgIG9sZFZhbHVlLFxuICAgICAgICBvbGRUYXJnZXRcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoZWZmZWN0My5vcHRpb25zLnNjaGVkdWxlcikge1xuICAgICAgZWZmZWN0My5vcHRpb25zLnNjaGVkdWxlcihlZmZlY3QzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWZmZWN0MygpO1xuICAgIH1cbiAgfTtcbiAgZWZmZWN0cy5mb3JFYWNoKHJ1bik7XG59XG52YXIgaXNOb25UcmFja2FibGVLZXlzID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoYF9fcHJvdG9fXyxfX3ZfaXNSZWYsX19pc1Z1ZWApO1xudmFyIGJ1aWx0SW5TeW1ib2xzID0gbmV3IFNldChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhTeW1ib2wpLm1hcCgoa2V5KSA9PiBTeW1ib2xba2V5XSkuZmlsdGVyKGlzU3ltYm9sKSk7XG52YXIgZ2V0MiA9IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVHZXR0ZXIoKTtcbnZhciByZWFkb25seUdldCA9IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVHZXR0ZXIodHJ1ZSk7XG52YXIgYXJyYXlJbnN0cnVtZW50YXRpb25zID0gLyogQF9fUFVSRV9fICovIGNyZWF0ZUFycmF5SW5zdHJ1bWVudGF0aW9ucygpO1xuZnVuY3Rpb24gY3JlYXRlQXJyYXlJbnN0cnVtZW50YXRpb25zKCkge1xuICBjb25zdCBpbnN0cnVtZW50YXRpb25zID0ge307XG4gIFtcImluY2x1ZGVzXCIsIFwiaW5kZXhPZlwiLCBcImxhc3RJbmRleE9mXCJdLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGluc3RydW1lbnRhdGlvbnNba2V5XSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgIGNvbnN0IGFyciA9IHRvUmF3KHRoaXMpO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0cmFjayhhcnIsIFwiZ2V0XCIsIGkgKyBcIlwiKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlcyA9IGFycltrZXldKC4uLmFyZ3MpO1xuICAgICAgaWYgKHJlcyA9PT0gLTEgfHwgcmVzID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gYXJyW2tleV0oLi4uYXJncy5tYXAodG9SYXcpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4gIFtcInB1c2hcIiwgXCJwb3BcIiwgXCJzaGlmdFwiLCBcInVuc2hpZnRcIiwgXCJzcGxpY2VcIl0uZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgaW5zdHJ1bWVudGF0aW9uc1trZXldID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgcGF1c2VUcmFja2luZygpO1xuICAgICAgY29uc3QgcmVzID0gdG9SYXcodGhpcylba2V5XS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgfSk7XG4gIHJldHVybiBpbnN0cnVtZW50YXRpb25zO1xufVxuZnVuY3Rpb24gY3JlYXRlR2V0dGVyKGlzUmVhZG9ubHkgPSBmYWxzZSwgc2hhbGxvdyA9IGZhbHNlKSB7XG4gIHJldHVybiBmdW5jdGlvbiBnZXQzKHRhcmdldCwga2V5LCByZWNlaXZlcikge1xuICAgIGlmIChrZXkgPT09IFwiX192X2lzUmVhY3RpdmVcIikge1xuICAgICAgcmV0dXJuICFpc1JlYWRvbmx5O1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcIl9fdl9pc1JlYWRvbmx5XCIpIHtcbiAgICAgIHJldHVybiBpc1JlYWRvbmx5O1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcIl9fdl9yYXdcIiAmJiByZWNlaXZlciA9PT0gKGlzUmVhZG9ubHkgPyBzaGFsbG93ID8gc2hhbGxvd1JlYWRvbmx5TWFwIDogcmVhZG9ubHlNYXAgOiBzaGFsbG93ID8gc2hhbGxvd1JlYWN0aXZlTWFwIDogcmVhY3RpdmVNYXApLmdldCh0YXJnZXQpKSB7XG4gICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbiAgICBjb25zdCB0YXJnZXRJc0FycmF5ID0gaXNBcnJheSh0YXJnZXQpO1xuICAgIGlmICghaXNSZWFkb25seSAmJiB0YXJnZXRJc0FycmF5ICYmIGhhc093bihhcnJheUluc3RydW1lbnRhdGlvbnMsIGtleSkpIHtcbiAgICAgIHJldHVybiBSZWZsZWN0LmdldChhcnJheUluc3RydW1lbnRhdGlvbnMsIGtleSwgcmVjZWl2ZXIpO1xuICAgIH1cbiAgICBjb25zdCByZXMgPSBSZWZsZWN0LmdldCh0YXJnZXQsIGtleSwgcmVjZWl2ZXIpO1xuICAgIGlmIChpc1N5bWJvbChrZXkpID8gYnVpbHRJblN5bWJvbHMuaGFzKGtleSkgOiBpc05vblRyYWNrYWJsZUtleXMoa2V5KSkge1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgaWYgKCFpc1JlYWRvbmx5KSB7XG4gICAgICB0cmFjayh0YXJnZXQsIFwiZ2V0XCIsIGtleSk7XG4gICAgfVxuICAgIGlmIChzaGFsbG93KSB7XG4gICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBpZiAoaXNSZWYocmVzKSkge1xuICAgICAgY29uc3Qgc2hvdWxkVW53cmFwID0gIXRhcmdldElzQXJyYXkgfHwgIWlzSW50ZWdlcktleShrZXkpO1xuICAgICAgcmV0dXJuIHNob3VsZFVud3JhcCA/IHJlcy52YWx1ZSA6IHJlcztcbiAgICB9XG4gICAgaWYgKGlzT2JqZWN0KHJlcykpIHtcbiAgICAgIHJldHVybiBpc1JlYWRvbmx5ID8gcmVhZG9ubHkocmVzKSA6IHJlYWN0aXZlMihyZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9O1xufVxudmFyIHNldDIgPSAvKiBAX19QVVJFX18gKi8gY3JlYXRlU2V0dGVyKCk7XG5mdW5jdGlvbiBjcmVhdGVTZXR0ZXIoc2hhbGxvdyA9IGZhbHNlKSB7XG4gIHJldHVybiBmdW5jdGlvbiBzZXQzKHRhcmdldCwga2V5LCB2YWx1ZSwgcmVjZWl2ZXIpIHtcbiAgICBsZXQgb2xkVmFsdWUgPSB0YXJnZXRba2V5XTtcbiAgICBpZiAoIXNoYWxsb3cpIHtcbiAgICAgIHZhbHVlID0gdG9SYXcodmFsdWUpO1xuICAgICAgb2xkVmFsdWUgPSB0b1JhdyhvbGRWYWx1ZSk7XG4gICAgICBpZiAoIWlzQXJyYXkodGFyZ2V0KSAmJiBpc1JlZihvbGRWYWx1ZSkgJiYgIWlzUmVmKHZhbHVlKSkge1xuICAgICAgICBvbGRWYWx1ZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaGFkS2V5ID0gaXNBcnJheSh0YXJnZXQpICYmIGlzSW50ZWdlcktleShrZXkpID8gTnVtYmVyKGtleSkgPCB0YXJnZXQubGVuZ3RoIDogaGFzT3duKHRhcmdldCwga2V5KTtcbiAgICBjb25zdCByZXN1bHQgPSBSZWZsZWN0LnNldCh0YXJnZXQsIGtleSwgdmFsdWUsIHJlY2VpdmVyKTtcbiAgICBpZiAodGFyZ2V0ID09PSB0b1JhdyhyZWNlaXZlcikpIHtcbiAgICAgIGlmICghaGFkS2V5KSB7XG4gICAgICAgIHRyaWdnZXIodGFyZ2V0LCBcImFkZFwiLCBrZXksIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzQ2hhbmdlZCh2YWx1ZSwgb2xkVmFsdWUpKSB7XG4gICAgICAgIHRyaWdnZXIodGFyZ2V0LCBcInNldFwiLCBrZXksIHZhbHVlLCBvbGRWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5mdW5jdGlvbiBkZWxldGVQcm9wZXJ0eSh0YXJnZXQsIGtleSkge1xuICBjb25zdCBoYWRLZXkgPSBoYXNPd24odGFyZ2V0LCBrZXkpO1xuICBjb25zdCBvbGRWYWx1ZSA9IHRhcmdldFtrZXldO1xuICBjb25zdCByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHRhcmdldCwga2V5KTtcbiAgaWYgKHJlc3VsdCAmJiBoYWRLZXkpIHtcbiAgICB0cmlnZ2VyKHRhcmdldCwgXCJkZWxldGVcIiwga2V5LCB2b2lkIDAsIG9sZFZhbHVlKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gaGFzKHRhcmdldCwga2V5KSB7XG4gIGNvbnN0IHJlc3VsdCA9IFJlZmxlY3QuaGFzKHRhcmdldCwga2V5KTtcbiAgaWYgKCFpc1N5bWJvbChrZXkpIHx8ICFidWlsdEluU3ltYm9scy5oYXMoa2V5KSkge1xuICAgIHRyYWNrKHRhcmdldCwgXCJoYXNcIiwga2V5KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gb3duS2V5cyh0YXJnZXQpIHtcbiAgdHJhY2sodGFyZ2V0LCBcIml0ZXJhdGVcIiwgaXNBcnJheSh0YXJnZXQpID8gXCJsZW5ndGhcIiA6IElURVJBVEVfS0VZKTtcbiAgcmV0dXJuIFJlZmxlY3Qub3duS2V5cyh0YXJnZXQpO1xufVxudmFyIG11dGFibGVIYW5kbGVycyA9IHtcbiAgZ2V0OiBnZXQyLFxuICBzZXQ6IHNldDIsXG4gIGRlbGV0ZVByb3BlcnR5LFxuICBoYXMsXG4gIG93bktleXNcbn07XG52YXIgcmVhZG9ubHlIYW5kbGVycyA9IHtcbiAgZ2V0OiByZWFkb25seUdldCxcbiAgc2V0KHRhcmdldCwga2V5KSB7XG4gICAgaWYgKHRydWUpIHtcbiAgICAgIGNvbnNvbGUud2FybihgU2V0IG9wZXJhdGlvbiBvbiBrZXkgXCIke1N0cmluZyhrZXkpfVwiIGZhaWxlZDogdGFyZ2V0IGlzIHJlYWRvbmx5LmAsIHRhcmdldCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9LFxuICBkZWxldGVQcm9wZXJ0eSh0YXJnZXQsIGtleSkge1xuICAgIGlmICh0cnVlKSB7XG4gICAgICBjb25zb2xlLndhcm4oYERlbGV0ZSBvcGVyYXRpb24gb24ga2V5IFwiJHtTdHJpbmcoa2V5KX1cIiBmYWlsZWQ6IHRhcmdldCBpcyByZWFkb25seS5gLCB0YXJnZXQpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcbnZhciB0b1JlYWN0aXZlID0gKHZhbHVlKSA9PiBpc09iamVjdCh2YWx1ZSkgPyByZWFjdGl2ZTIodmFsdWUpIDogdmFsdWU7XG52YXIgdG9SZWFkb25seSA9ICh2YWx1ZSkgPT4gaXNPYmplY3QodmFsdWUpID8gcmVhZG9ubHkodmFsdWUpIDogdmFsdWU7XG52YXIgdG9TaGFsbG93ID0gKHZhbHVlKSA9PiB2YWx1ZTtcbnZhciBnZXRQcm90byA9ICh2KSA9PiBSZWZsZWN0LmdldFByb3RvdHlwZU9mKHYpO1xuZnVuY3Rpb24gZ2V0JDEodGFyZ2V0LCBrZXksIGlzUmVhZG9ubHkgPSBmYWxzZSwgaXNTaGFsbG93ID0gZmFsc2UpIHtcbiAgdGFyZ2V0ID0gdGFyZ2V0W1xuICAgIFwiX192X3Jhd1wiXG4gICAgLyogUkFXICovXG4gIF07XG4gIGNvbnN0IHJhd1RhcmdldCA9IHRvUmF3KHRhcmdldCk7XG4gIGNvbnN0IHJhd0tleSA9IHRvUmF3KGtleSk7XG4gIGlmIChrZXkgIT09IHJhd0tleSkge1xuICAgICFpc1JlYWRvbmx5ICYmIHRyYWNrKHJhd1RhcmdldCwgXCJnZXRcIiwga2V5KTtcbiAgfVxuICAhaXNSZWFkb25seSAmJiB0cmFjayhyYXdUYXJnZXQsIFwiZ2V0XCIsIHJhd0tleSk7XG4gIGNvbnN0IHsgaGFzOiBoYXMyIH0gPSBnZXRQcm90byhyYXdUYXJnZXQpO1xuICBjb25zdCB3cmFwID0gaXNTaGFsbG93ID8gdG9TaGFsbG93IDogaXNSZWFkb25seSA/IHRvUmVhZG9ubHkgOiB0b1JlYWN0aXZlO1xuICBpZiAoaGFzMi5jYWxsKHJhd1RhcmdldCwga2V5KSkge1xuICAgIHJldHVybiB3cmFwKHRhcmdldC5nZXQoa2V5KSk7XG4gIH0gZWxzZSBpZiAoaGFzMi5jYWxsKHJhd1RhcmdldCwgcmF3S2V5KSkge1xuICAgIHJldHVybiB3cmFwKHRhcmdldC5nZXQocmF3S2V5KSk7XG4gIH0gZWxzZSBpZiAodGFyZ2V0ICE9PSByYXdUYXJnZXQpIHtcbiAgICB0YXJnZXQuZ2V0KGtleSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGhhcyQxKGtleSwgaXNSZWFkb25seSA9IGZhbHNlKSB7XG4gIGNvbnN0IHRhcmdldCA9IHRoaXNbXG4gICAgXCJfX3ZfcmF3XCJcbiAgICAvKiBSQVcgKi9cbiAgXTtcbiAgY29uc3QgcmF3VGFyZ2V0ID0gdG9SYXcodGFyZ2V0KTtcbiAgY29uc3QgcmF3S2V5ID0gdG9SYXcoa2V5KTtcbiAgaWYgKGtleSAhPT0gcmF3S2V5KSB7XG4gICAgIWlzUmVhZG9ubHkgJiYgdHJhY2socmF3VGFyZ2V0LCBcImhhc1wiLCBrZXkpO1xuICB9XG4gICFpc1JlYWRvbmx5ICYmIHRyYWNrKHJhd1RhcmdldCwgXCJoYXNcIiwgcmF3S2V5KTtcbiAgcmV0dXJuIGtleSA9PT0gcmF3S2V5ID8gdGFyZ2V0LmhhcyhrZXkpIDogdGFyZ2V0LmhhcyhrZXkpIHx8IHRhcmdldC5oYXMocmF3S2V5KTtcbn1cbmZ1bmN0aW9uIHNpemUodGFyZ2V0LCBpc1JlYWRvbmx5ID0gZmFsc2UpIHtcbiAgdGFyZ2V0ID0gdGFyZ2V0W1xuICAgIFwiX192X3Jhd1wiXG4gICAgLyogUkFXICovXG4gIF07XG4gICFpc1JlYWRvbmx5ICYmIHRyYWNrKHRvUmF3KHRhcmdldCksIFwiaXRlcmF0ZVwiLCBJVEVSQVRFX0tFWSk7XG4gIHJldHVybiBSZWZsZWN0LmdldCh0YXJnZXQsIFwic2l6ZVwiLCB0YXJnZXQpO1xufVxuZnVuY3Rpb24gYWRkKHZhbHVlKSB7XG4gIHZhbHVlID0gdG9SYXcodmFsdWUpO1xuICBjb25zdCB0YXJnZXQgPSB0b1Jhdyh0aGlzKTtcbiAgY29uc3QgcHJvdG8gPSBnZXRQcm90byh0YXJnZXQpO1xuICBjb25zdCBoYWRLZXkgPSBwcm90by5oYXMuY2FsbCh0YXJnZXQsIHZhbHVlKTtcbiAgaWYgKCFoYWRLZXkpIHtcbiAgICB0YXJnZXQuYWRkKHZhbHVlKTtcbiAgICB0cmlnZ2VyKHRhcmdldCwgXCJhZGRcIiwgdmFsdWUsIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn1cbmZ1bmN0aW9uIHNldCQxKGtleSwgdmFsdWUpIHtcbiAgdmFsdWUgPSB0b1Jhdyh2YWx1ZSk7XG4gIGNvbnN0IHRhcmdldCA9IHRvUmF3KHRoaXMpO1xuICBjb25zdCB7IGhhczogaGFzMiwgZ2V0OiBnZXQzIH0gPSBnZXRQcm90byh0YXJnZXQpO1xuICBsZXQgaGFkS2V5ID0gaGFzMi5jYWxsKHRhcmdldCwga2V5KTtcbiAgaWYgKCFoYWRLZXkpIHtcbiAgICBrZXkgPSB0b1JhdyhrZXkpO1xuICAgIGhhZEtleSA9IGhhczIuY2FsbCh0YXJnZXQsIGtleSk7XG4gIH0gZWxzZSBpZiAodHJ1ZSkge1xuICAgIGNoZWNrSWRlbnRpdHlLZXlzKHRhcmdldCwgaGFzMiwga2V5KTtcbiAgfVxuICBjb25zdCBvbGRWYWx1ZSA9IGdldDMuY2FsbCh0YXJnZXQsIGtleSk7XG4gIHRhcmdldC5zZXQoa2V5LCB2YWx1ZSk7XG4gIGlmICghaGFkS2V5KSB7XG4gICAgdHJpZ2dlcih0YXJnZXQsIFwiYWRkXCIsIGtleSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKGhhc0NoYW5nZWQodmFsdWUsIG9sZFZhbHVlKSkge1xuICAgIHRyaWdnZXIodGFyZ2V0LCBcInNldFwiLCBrZXksIHZhbHVlLCBvbGRWYWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5mdW5jdGlvbiBkZWxldGVFbnRyeShrZXkpIHtcbiAgY29uc3QgdGFyZ2V0ID0gdG9SYXcodGhpcyk7XG4gIGNvbnN0IHsgaGFzOiBoYXMyLCBnZXQ6IGdldDMgfSA9IGdldFByb3RvKHRhcmdldCk7XG4gIGxldCBoYWRLZXkgPSBoYXMyLmNhbGwodGFyZ2V0LCBrZXkpO1xuICBpZiAoIWhhZEtleSkge1xuICAgIGtleSA9IHRvUmF3KGtleSk7XG4gICAgaGFkS2V5ID0gaGFzMi5jYWxsKHRhcmdldCwga2V5KTtcbiAgfSBlbHNlIGlmICh0cnVlKSB7XG4gICAgY2hlY2tJZGVudGl0eUtleXModGFyZ2V0LCBoYXMyLCBrZXkpO1xuICB9XG4gIGNvbnN0IG9sZFZhbHVlID0gZ2V0MyA/IGdldDMuY2FsbCh0YXJnZXQsIGtleSkgOiB2b2lkIDA7XG4gIGNvbnN0IHJlc3VsdCA9IHRhcmdldC5kZWxldGUoa2V5KTtcbiAgaWYgKGhhZEtleSkge1xuICAgIHRyaWdnZXIodGFyZ2V0LCBcImRlbGV0ZVwiLCBrZXksIHZvaWQgMCwgb2xkVmFsdWUpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjbGVhcigpIHtcbiAgY29uc3QgdGFyZ2V0ID0gdG9SYXcodGhpcyk7XG4gIGNvbnN0IGhhZEl0ZW1zID0gdGFyZ2V0LnNpemUgIT09IDA7XG4gIGNvbnN0IG9sZFRhcmdldCA9IHRydWUgPyBpc01hcCh0YXJnZXQpID8gbmV3IE1hcCh0YXJnZXQpIDogbmV3IFNldCh0YXJnZXQpIDogdm9pZCAwO1xuICBjb25zdCByZXN1bHQgPSB0YXJnZXQuY2xlYXIoKTtcbiAgaWYgKGhhZEl0ZW1zKSB7XG4gICAgdHJpZ2dlcih0YXJnZXQsIFwiY2xlYXJcIiwgdm9pZCAwLCB2b2lkIDAsIG9sZFRhcmdldCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUZvckVhY2goaXNSZWFkb25seSwgaXNTaGFsbG93KSB7XG4gIHJldHVybiBmdW5jdGlvbiBmb3JFYWNoKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgY29uc3Qgb2JzZXJ2ZWQgPSB0aGlzO1xuICAgIGNvbnN0IHRhcmdldCA9IG9ic2VydmVkW1xuICAgICAgXCJfX3ZfcmF3XCJcbiAgICAgIC8qIFJBVyAqL1xuICAgIF07XG4gICAgY29uc3QgcmF3VGFyZ2V0ID0gdG9SYXcodGFyZ2V0KTtcbiAgICBjb25zdCB3cmFwID0gaXNTaGFsbG93ID8gdG9TaGFsbG93IDogaXNSZWFkb25seSA/IHRvUmVhZG9ubHkgOiB0b1JlYWN0aXZlO1xuICAgICFpc1JlYWRvbmx5ICYmIHRyYWNrKHJhd1RhcmdldCwgXCJpdGVyYXRlXCIsIElURVJBVEVfS0VZKTtcbiAgICByZXR1cm4gdGFyZ2V0LmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHdyYXAodmFsdWUpLCB3cmFwKGtleSksIG9ic2VydmVkKTtcbiAgICB9KTtcbiAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUl0ZXJhYmxlTWV0aG9kKG1ldGhvZCwgaXNSZWFkb25seSwgaXNTaGFsbG93KSB7XG4gIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpc1tcbiAgICAgIFwiX192X3Jhd1wiXG4gICAgICAvKiBSQVcgKi9cbiAgICBdO1xuICAgIGNvbnN0IHJhd1RhcmdldCA9IHRvUmF3KHRhcmdldCk7XG4gICAgY29uc3QgdGFyZ2V0SXNNYXAgPSBpc01hcChyYXdUYXJnZXQpO1xuICAgIGNvbnN0IGlzUGFpciA9IG1ldGhvZCA9PT0gXCJlbnRyaWVzXCIgfHwgbWV0aG9kID09PSBTeW1ib2wuaXRlcmF0b3IgJiYgdGFyZ2V0SXNNYXA7XG4gICAgY29uc3QgaXNLZXlPbmx5ID0gbWV0aG9kID09PSBcImtleXNcIiAmJiB0YXJnZXRJc01hcDtcbiAgICBjb25zdCBpbm5lckl0ZXJhdG9yID0gdGFyZ2V0W21ldGhvZF0oLi4uYXJncyk7XG4gICAgY29uc3Qgd3JhcCA9IGlzU2hhbGxvdyA/IHRvU2hhbGxvdyA6IGlzUmVhZG9ubHkgPyB0b1JlYWRvbmx5IDogdG9SZWFjdGl2ZTtcbiAgICAhaXNSZWFkb25seSAmJiB0cmFjayhyYXdUYXJnZXQsIFwiaXRlcmF0ZVwiLCBpc0tleU9ubHkgPyBNQVBfS0VZX0lURVJBVEVfS0VZIDogSVRFUkFURV9LRVkpO1xuICAgIHJldHVybiB7XG4gICAgICAvLyBpdGVyYXRvciBwcm90b2NvbFxuICAgICAgbmV4dCgpIHtcbiAgICAgICAgY29uc3QgeyB2YWx1ZSwgZG9uZSB9ID0gaW5uZXJJdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIHJldHVybiBkb25lID8geyB2YWx1ZSwgZG9uZSB9IDoge1xuICAgICAgICAgIHZhbHVlOiBpc1BhaXIgPyBbd3JhcCh2YWx1ZVswXSksIHdyYXAodmFsdWVbMV0pXSA6IHdyYXAodmFsdWUpLFxuICAgICAgICAgIGRvbmVcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICAvLyBpdGVyYWJsZSBwcm90b2NvbFxuICAgICAgW1N5bWJvbC5pdGVyYXRvcl0oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH07XG4gIH07XG59XG5mdW5jdGlvbiBjcmVhdGVSZWFkb25seU1ldGhvZCh0eXBlKSB7XG4gIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgaWYgKHRydWUpIHtcbiAgICAgIGNvbnN0IGtleSA9IGFyZ3NbMF0gPyBgb24ga2V5IFwiJHthcmdzWzBdfVwiIGAgOiBgYDtcbiAgICAgIGNvbnNvbGUud2FybihgJHtjYXBpdGFsaXplKHR5cGUpfSBvcGVyYXRpb24gJHtrZXl9ZmFpbGVkOiB0YXJnZXQgaXMgcmVhZG9ubHkuYCwgdG9SYXcodGhpcykpO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZSA9PT0gXCJkZWxldGVcIiA/IGZhbHNlIDogdGhpcztcbiAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUluc3RydW1lbnRhdGlvbnMoKSB7XG4gIGNvbnN0IG11dGFibGVJbnN0cnVtZW50YXRpb25zMiA9IHtcbiAgICBnZXQoa2V5KSB7XG4gICAgICByZXR1cm4gZ2V0JDEodGhpcywga2V5KTtcbiAgICB9LFxuICAgIGdldCBzaXplKCkge1xuICAgICAgcmV0dXJuIHNpemUodGhpcyk7XG4gICAgfSxcbiAgICBoYXM6IGhhcyQxLFxuICAgIGFkZCxcbiAgICBzZXQ6IHNldCQxLFxuICAgIGRlbGV0ZTogZGVsZXRlRW50cnksXG4gICAgY2xlYXIsXG4gICAgZm9yRWFjaDogY3JlYXRlRm9yRWFjaChmYWxzZSwgZmFsc2UpXG4gIH07XG4gIGNvbnN0IHNoYWxsb3dJbnN0cnVtZW50YXRpb25zMiA9IHtcbiAgICBnZXQoa2V5KSB7XG4gICAgICByZXR1cm4gZ2V0JDEodGhpcywga2V5LCBmYWxzZSwgdHJ1ZSk7XG4gICAgfSxcbiAgICBnZXQgc2l6ZSgpIHtcbiAgICAgIHJldHVybiBzaXplKHRoaXMpO1xuICAgIH0sXG4gICAgaGFzOiBoYXMkMSxcbiAgICBhZGQsXG4gICAgc2V0OiBzZXQkMSxcbiAgICBkZWxldGU6IGRlbGV0ZUVudHJ5LFxuICAgIGNsZWFyLFxuICAgIGZvckVhY2g6IGNyZWF0ZUZvckVhY2goZmFsc2UsIHRydWUpXG4gIH07XG4gIGNvbnN0IHJlYWRvbmx5SW5zdHJ1bWVudGF0aW9uczIgPSB7XG4gICAgZ2V0KGtleSkge1xuICAgICAgcmV0dXJuIGdldCQxKHRoaXMsIGtleSwgdHJ1ZSk7XG4gICAgfSxcbiAgICBnZXQgc2l6ZSgpIHtcbiAgICAgIHJldHVybiBzaXplKHRoaXMsIHRydWUpO1xuICAgIH0sXG4gICAgaGFzKGtleSkge1xuICAgICAgcmV0dXJuIGhhcyQxLmNhbGwodGhpcywga2V5LCB0cnVlKTtcbiAgICB9LFxuICAgIGFkZDogY3JlYXRlUmVhZG9ubHlNZXRob2QoXG4gICAgICBcImFkZFwiXG4gICAgICAvKiBBREQgKi9cbiAgICApLFxuICAgIHNldDogY3JlYXRlUmVhZG9ubHlNZXRob2QoXG4gICAgICBcInNldFwiXG4gICAgICAvKiBTRVQgKi9cbiAgICApLFxuICAgIGRlbGV0ZTogY3JlYXRlUmVhZG9ubHlNZXRob2QoXG4gICAgICBcImRlbGV0ZVwiXG4gICAgICAvKiBERUxFVEUgKi9cbiAgICApLFxuICAgIGNsZWFyOiBjcmVhdGVSZWFkb25seU1ldGhvZChcbiAgICAgIFwiY2xlYXJcIlxuICAgICAgLyogQ0xFQVIgKi9cbiAgICApLFxuICAgIGZvckVhY2g6IGNyZWF0ZUZvckVhY2godHJ1ZSwgZmFsc2UpXG4gIH07XG4gIGNvbnN0IHNoYWxsb3dSZWFkb25seUluc3RydW1lbnRhdGlvbnMyID0ge1xuICAgIGdldChrZXkpIHtcbiAgICAgIHJldHVybiBnZXQkMSh0aGlzLCBrZXksIHRydWUsIHRydWUpO1xuICAgIH0sXG4gICAgZ2V0IHNpemUoKSB7XG4gICAgICByZXR1cm4gc2l6ZSh0aGlzLCB0cnVlKTtcbiAgICB9LFxuICAgIGhhcyhrZXkpIHtcbiAgICAgIHJldHVybiBoYXMkMS5jYWxsKHRoaXMsIGtleSwgdHJ1ZSk7XG4gICAgfSxcbiAgICBhZGQ6IGNyZWF0ZVJlYWRvbmx5TWV0aG9kKFxuICAgICAgXCJhZGRcIlxuICAgICAgLyogQUREICovXG4gICAgKSxcbiAgICBzZXQ6IGNyZWF0ZVJlYWRvbmx5TWV0aG9kKFxuICAgICAgXCJzZXRcIlxuICAgICAgLyogU0VUICovXG4gICAgKSxcbiAgICBkZWxldGU6IGNyZWF0ZVJlYWRvbmx5TWV0aG9kKFxuICAgICAgXCJkZWxldGVcIlxuICAgICAgLyogREVMRVRFICovXG4gICAgKSxcbiAgICBjbGVhcjogY3JlYXRlUmVhZG9ubHlNZXRob2QoXG4gICAgICBcImNsZWFyXCJcbiAgICAgIC8qIENMRUFSICovXG4gICAgKSxcbiAgICBmb3JFYWNoOiBjcmVhdGVGb3JFYWNoKHRydWUsIHRydWUpXG4gIH07XG4gIGNvbnN0IGl0ZXJhdG9yTWV0aG9kcyA9IFtcImtleXNcIiwgXCJ2YWx1ZXNcIiwgXCJlbnRyaWVzXCIsIFN5bWJvbC5pdGVyYXRvcl07XG4gIGl0ZXJhdG9yTWV0aG9kcy5mb3JFYWNoKChtZXRob2QpID0+IHtcbiAgICBtdXRhYmxlSW5zdHJ1bWVudGF0aW9uczJbbWV0aG9kXSA9IGNyZWF0ZUl0ZXJhYmxlTWV0aG9kKG1ldGhvZCwgZmFsc2UsIGZhbHNlKTtcbiAgICByZWFkb25seUluc3RydW1lbnRhdGlvbnMyW21ldGhvZF0gPSBjcmVhdGVJdGVyYWJsZU1ldGhvZChtZXRob2QsIHRydWUsIGZhbHNlKTtcbiAgICBzaGFsbG93SW5zdHJ1bWVudGF0aW9uczJbbWV0aG9kXSA9IGNyZWF0ZUl0ZXJhYmxlTWV0aG9kKG1ldGhvZCwgZmFsc2UsIHRydWUpO1xuICAgIHNoYWxsb3dSZWFkb25seUluc3RydW1lbnRhdGlvbnMyW21ldGhvZF0gPSBjcmVhdGVJdGVyYWJsZU1ldGhvZChtZXRob2QsIHRydWUsIHRydWUpO1xuICB9KTtcbiAgcmV0dXJuIFtcbiAgICBtdXRhYmxlSW5zdHJ1bWVudGF0aW9uczIsXG4gICAgcmVhZG9ubHlJbnN0cnVtZW50YXRpb25zMixcbiAgICBzaGFsbG93SW5zdHJ1bWVudGF0aW9uczIsXG4gICAgc2hhbGxvd1JlYWRvbmx5SW5zdHJ1bWVudGF0aW9uczJcbiAgXTtcbn1cbnZhciBbbXV0YWJsZUluc3RydW1lbnRhdGlvbnMsIHJlYWRvbmx5SW5zdHJ1bWVudGF0aW9ucywgc2hhbGxvd0luc3RydW1lbnRhdGlvbnMsIHNoYWxsb3dSZWFkb25seUluc3RydW1lbnRhdGlvbnNdID0gLyogQF9fUFVSRV9fICovIGNyZWF0ZUluc3RydW1lbnRhdGlvbnMoKTtcbmZ1bmN0aW9uIGNyZWF0ZUluc3RydW1lbnRhdGlvbkdldHRlcihpc1JlYWRvbmx5LCBzaGFsbG93KSB7XG4gIGNvbnN0IGluc3RydW1lbnRhdGlvbnMgPSBzaGFsbG93ID8gaXNSZWFkb25seSA/IHNoYWxsb3dSZWFkb25seUluc3RydW1lbnRhdGlvbnMgOiBzaGFsbG93SW5zdHJ1bWVudGF0aW9ucyA6IGlzUmVhZG9ubHkgPyByZWFkb25seUluc3RydW1lbnRhdGlvbnMgOiBtdXRhYmxlSW5zdHJ1bWVudGF0aW9ucztcbiAgcmV0dXJuICh0YXJnZXQsIGtleSwgcmVjZWl2ZXIpID0+IHtcbiAgICBpZiAoa2V5ID09PSBcIl9fdl9pc1JlYWN0aXZlXCIpIHtcbiAgICAgIHJldHVybiAhaXNSZWFkb25seTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJfX3ZfaXNSZWFkb25seVwiKSB7XG4gICAgICByZXR1cm4gaXNSZWFkb25seTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJfX3ZfcmF3XCIpIHtcbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuICAgIHJldHVybiBSZWZsZWN0LmdldChoYXNPd24oaW5zdHJ1bWVudGF0aW9ucywga2V5KSAmJiBrZXkgaW4gdGFyZ2V0ID8gaW5zdHJ1bWVudGF0aW9ucyA6IHRhcmdldCwga2V5LCByZWNlaXZlcik7XG4gIH07XG59XG52YXIgbXV0YWJsZUNvbGxlY3Rpb25IYW5kbGVycyA9IHtcbiAgZ2V0OiAvKiBAX19QVVJFX18gKi8gY3JlYXRlSW5zdHJ1bWVudGF0aW9uR2V0dGVyKGZhbHNlLCBmYWxzZSlcbn07XG52YXIgcmVhZG9ubHlDb2xsZWN0aW9uSGFuZGxlcnMgPSB7XG4gIGdldDogLyogQF9fUFVSRV9fICovIGNyZWF0ZUluc3RydW1lbnRhdGlvbkdldHRlcih0cnVlLCBmYWxzZSlcbn07XG5mdW5jdGlvbiBjaGVja0lkZW50aXR5S2V5cyh0YXJnZXQsIGhhczIsIGtleSkge1xuICBjb25zdCByYXdLZXkgPSB0b1JhdyhrZXkpO1xuICBpZiAocmF3S2V5ICE9PSBrZXkgJiYgaGFzMi5jYWxsKHRhcmdldCwgcmF3S2V5KSkge1xuICAgIGNvbnN0IHR5cGUgPSB0b1Jhd1R5cGUodGFyZ2V0KTtcbiAgICBjb25zb2xlLndhcm4oYFJlYWN0aXZlICR7dHlwZX0gY29udGFpbnMgYm90aCB0aGUgcmF3IGFuZCByZWFjdGl2ZSB2ZXJzaW9ucyBvZiB0aGUgc2FtZSBvYmplY3Qke3R5cGUgPT09IGBNYXBgID8gYCBhcyBrZXlzYCA6IGBgfSwgd2hpY2ggY2FuIGxlYWQgdG8gaW5jb25zaXN0ZW5jaWVzLiBBdm9pZCBkaWZmZXJlbnRpYXRpbmcgYmV0d2VlbiB0aGUgcmF3IGFuZCByZWFjdGl2ZSB2ZXJzaW9ucyBvZiBhbiBvYmplY3QgYW5kIG9ubHkgdXNlIHRoZSByZWFjdGl2ZSB2ZXJzaW9uIGlmIHBvc3NpYmxlLmApO1xuICB9XG59XG52YXIgcmVhY3RpdmVNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbnZhciBzaGFsbG93UmVhY3RpdmVNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbnZhciByZWFkb25seU1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xudmFyIHNoYWxsb3dSZWFkb25seU1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuZnVuY3Rpb24gdGFyZ2V0VHlwZU1hcChyYXdUeXBlKSB7XG4gIHN3aXRjaCAocmF3VHlwZSkge1xuICAgIGNhc2UgXCJPYmplY3RcIjpcbiAgICBjYXNlIFwiQXJyYXlcIjpcbiAgICAgIHJldHVybiAxO1xuICAgIGNhc2UgXCJNYXBcIjpcbiAgICBjYXNlIFwiU2V0XCI6XG4gICAgY2FzZSBcIldlYWtNYXBcIjpcbiAgICBjYXNlIFwiV2Vha1NldFwiOlxuICAgICAgcmV0dXJuIDI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAwO1xuICB9XG59XG5mdW5jdGlvbiBnZXRUYXJnZXRUeXBlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZVtcbiAgICBcIl9fdl9za2lwXCJcbiAgICAvKiBTS0lQICovXG4gIF0gfHwgIU9iamVjdC5pc0V4dGVuc2libGUodmFsdWUpID8gMCA6IHRhcmdldFR5cGVNYXAodG9SYXdUeXBlKHZhbHVlKSk7XG59XG5mdW5jdGlvbiByZWFjdGl2ZTIodGFyZ2V0KSB7XG4gIGlmICh0YXJnZXQgJiYgdGFyZ2V0W1xuICAgIFwiX192X2lzUmVhZG9ubHlcIlxuICAgIC8qIElTX1JFQURPTkxZICovXG4gIF0pIHtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG4gIHJldHVybiBjcmVhdGVSZWFjdGl2ZU9iamVjdCh0YXJnZXQsIGZhbHNlLCBtdXRhYmxlSGFuZGxlcnMsIG11dGFibGVDb2xsZWN0aW9uSGFuZGxlcnMsIHJlYWN0aXZlTWFwKTtcbn1cbmZ1bmN0aW9uIHJlYWRvbmx5KHRhcmdldCkge1xuICByZXR1cm4gY3JlYXRlUmVhY3RpdmVPYmplY3QodGFyZ2V0LCB0cnVlLCByZWFkb25seUhhbmRsZXJzLCByZWFkb25seUNvbGxlY3Rpb25IYW5kbGVycywgcmVhZG9ubHlNYXApO1xufVxuZnVuY3Rpb24gY3JlYXRlUmVhY3RpdmVPYmplY3QodGFyZ2V0LCBpc1JlYWRvbmx5LCBiYXNlSGFuZGxlcnMsIGNvbGxlY3Rpb25IYW5kbGVycywgcHJveHlNYXApIHtcbiAgaWYgKCFpc09iamVjdCh0YXJnZXQpKSB7XG4gICAgaWYgKHRydWUpIHtcbiAgICAgIGNvbnNvbGUud2FybihgdmFsdWUgY2Fubm90IGJlIG1hZGUgcmVhY3RpdmU6ICR7U3RyaW5nKHRhcmdldCl9YCk7XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cbiAgaWYgKHRhcmdldFtcbiAgICBcIl9fdl9yYXdcIlxuICAgIC8qIFJBVyAqL1xuICBdICYmICEoaXNSZWFkb25seSAmJiB0YXJnZXRbXG4gICAgXCJfX3ZfaXNSZWFjdGl2ZVwiXG4gICAgLyogSVNfUkVBQ1RJVkUgKi9cbiAgXSkpIHtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG4gIGNvbnN0IGV4aXN0aW5nUHJveHkgPSBwcm94eU1hcC5nZXQodGFyZ2V0KTtcbiAgaWYgKGV4aXN0aW5nUHJveHkpIHtcbiAgICByZXR1cm4gZXhpc3RpbmdQcm94eTtcbiAgfVxuICBjb25zdCB0YXJnZXRUeXBlID0gZ2V0VGFyZ2V0VHlwZSh0YXJnZXQpO1xuICBpZiAodGFyZ2V0VHlwZSA9PT0gMCkge1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cbiAgY29uc3QgcHJveHkgPSBuZXcgUHJveHkodGFyZ2V0LCB0YXJnZXRUeXBlID09PSAyID8gY29sbGVjdGlvbkhhbmRsZXJzIDogYmFzZUhhbmRsZXJzKTtcbiAgcHJveHlNYXAuc2V0KHRhcmdldCwgcHJveHkpO1xuICByZXR1cm4gcHJveHk7XG59XG5mdW5jdGlvbiB0b1JhdyhvYnNlcnZlZCkge1xuICByZXR1cm4gb2JzZXJ2ZWQgJiYgdG9SYXcob2JzZXJ2ZWRbXG4gICAgXCJfX3ZfcmF3XCJcbiAgICAvKiBSQVcgKi9cbiAgXSkgfHwgb2JzZXJ2ZWQ7XG59XG5mdW5jdGlvbiBpc1JlZihyKSB7XG4gIHJldHVybiBCb29sZWFuKHIgJiYgci5fX3ZfaXNSZWYgPT09IHRydWUpO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvbWFnaWNzLyRuZXh0VGljay5qc1xubWFnaWMoXCJuZXh0VGlja1wiLCAoKSA9PiBuZXh0VGljayk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9tYWdpY3MvJGRpc3BhdGNoLmpzXG5tYWdpYyhcImRpc3BhdGNoXCIsIChlbCkgPT4gZGlzcGF0Y2guYmluZChkaXNwYXRjaCwgZWwpKTtcblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL21hZ2ljcy8kd2F0Y2guanNcbm1hZ2ljKFwid2F0Y2hcIiwgKGVsLCB7IGV2YWx1YXRlTGF0ZXI6IGV2YWx1YXRlTGF0ZXIyLCBlZmZlY3Q6IGVmZmVjdDMgfSkgPT4gKGtleSwgY2FsbGJhY2spID0+IHtcbiAgbGV0IGV2YWx1YXRlMiA9IGV2YWx1YXRlTGF0ZXIyKGtleSk7XG4gIGxldCBmaXJzdFRpbWUgPSB0cnVlO1xuICBsZXQgb2xkVmFsdWU7XG4gIGxldCBlZmZlY3RSZWZlcmVuY2UgPSBlZmZlY3QzKCgpID0+IGV2YWx1YXRlMigodmFsdWUpID0+IHtcbiAgICBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgaWYgKCFmaXJzdFRpbWUpIHtcbiAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgY2FsbGJhY2sodmFsdWUsIG9sZFZhbHVlKTtcbiAgICAgICAgb2xkVmFsdWUgPSB2YWx1ZTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBvbGRWYWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBmaXJzdFRpbWUgPSBmYWxzZTtcbiAgfSkpO1xuICBlbC5feF9lZmZlY3RzLmRlbGV0ZShlZmZlY3RSZWZlcmVuY2UpO1xufSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9tYWdpY3MvJHN0b3JlLmpzXG5tYWdpYyhcInN0b3JlXCIsIGdldFN0b3Jlcyk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9tYWdpY3MvJGRhdGEuanNcbm1hZ2ljKFwiZGF0YVwiLCAoZWwpID0+IHNjb3BlKGVsKSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9tYWdpY3MvJHJvb3QuanNcbm1hZ2ljKFwicm9vdFwiLCAoZWwpID0+IGNsb3Nlc3RSb290KGVsKSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9tYWdpY3MvJHJlZnMuanNcbm1hZ2ljKFwicmVmc1wiLCAoZWwpID0+IHtcbiAgaWYgKGVsLl94X3JlZnNfcHJveHkpXG4gICAgcmV0dXJuIGVsLl94X3JlZnNfcHJveHk7XG4gIGVsLl94X3JlZnNfcHJveHkgPSBtZXJnZVByb3hpZXMoZ2V0QXJyYXlPZlJlZk9iamVjdChlbCkpO1xuICByZXR1cm4gZWwuX3hfcmVmc19wcm94eTtcbn0pO1xuZnVuY3Rpb24gZ2V0QXJyYXlPZlJlZk9iamVjdChlbCkge1xuICBsZXQgcmVmT2JqZWN0cyA9IFtdO1xuICBsZXQgY3VycmVudEVsID0gZWw7XG4gIHdoaWxlIChjdXJyZW50RWwpIHtcbiAgICBpZiAoY3VycmVudEVsLl94X3JlZnMpXG4gICAgICByZWZPYmplY3RzLnB1c2goY3VycmVudEVsLl94X3JlZnMpO1xuICAgIGN1cnJlbnRFbCA9IGN1cnJlbnRFbC5wYXJlbnROb2RlO1xuICB9XG4gIHJldHVybiByZWZPYmplY3RzO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvaWRzLmpzXG52YXIgZ2xvYmFsSWRNZW1vID0ge307XG5mdW5jdGlvbiBmaW5kQW5kSW5jcmVtZW50SWQobmFtZSkge1xuICBpZiAoIWdsb2JhbElkTWVtb1tuYW1lXSlcbiAgICBnbG9iYWxJZE1lbW9bbmFtZV0gPSAwO1xuICByZXR1cm4gKytnbG9iYWxJZE1lbW9bbmFtZV07XG59XG5mdW5jdGlvbiBjbG9zZXN0SWRSb290KGVsLCBuYW1lKSB7XG4gIHJldHVybiBmaW5kQ2xvc2VzdChlbCwgKGVsZW1lbnQpID0+IHtcbiAgICBpZiAoZWxlbWVudC5feF9pZHMgJiYgZWxlbWVudC5feF9pZHNbbmFtZV0pXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59XG5mdW5jdGlvbiBzZXRJZFJvb3QoZWwsIG5hbWUpIHtcbiAgaWYgKCFlbC5feF9pZHMpXG4gICAgZWwuX3hfaWRzID0ge307XG4gIGlmICghZWwuX3hfaWRzW25hbWVdKVxuICAgIGVsLl94X2lkc1tuYW1lXSA9IGZpbmRBbmRJbmNyZW1lbnRJZChuYW1lKTtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL21hZ2ljcy8kaWQuanNcbm1hZ2ljKFwiaWRcIiwgKGVsKSA9PiAobmFtZSwga2V5ID0gbnVsbCkgPT4ge1xuICBsZXQgcm9vdCA9IGNsb3Nlc3RJZFJvb3QoZWwsIG5hbWUpO1xuICBsZXQgaWQgPSByb290ID8gcm9vdC5feF9pZHNbbmFtZV0gOiBmaW5kQW5kSW5jcmVtZW50SWQobmFtZSk7XG4gIHJldHVybiBrZXkgPyBgJHtuYW1lfS0ke2lkfS0ke2tleX1gIDogYCR7bmFtZX0tJHtpZH1gO1xufSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9tYWdpY3MvJGVsLmpzXG5tYWdpYyhcImVsXCIsIChlbCkgPT4gZWwpO1xuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvbWFnaWNzL2luZGV4LmpzXG53YXJuTWlzc2luZ1BsdWdpbk1hZ2ljKFwiRm9jdXNcIiwgXCJmb2N1c1wiLCBcImZvY3VzXCIpO1xud2Fybk1pc3NpbmdQbHVnaW5NYWdpYyhcIlBlcnNpc3RcIiwgXCJwZXJzaXN0XCIsIFwicGVyc2lzdFwiKTtcbmZ1bmN0aW9uIHdhcm5NaXNzaW5nUGx1Z2luTWFnaWMobmFtZSwgbWFnaWNOYW1lLCBzbHVnKSB7XG4gIG1hZ2ljKG1hZ2ljTmFtZSwgKGVsKSA9PiB3YXJuKGBZb3UgY2FuJ3QgdXNlIFskJHttYWdpY05hbWV9XSB3aXRob3V0IGZpcnN0IGluc3RhbGxpbmcgdGhlIFwiJHtuYW1lfVwiIHBsdWdpbiBoZXJlOiBodHRwczovL2FscGluZWpzLmRldi9wbHVnaW5zLyR7c2x1Z31gLCBlbCkpO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvZGlyZWN0aXZlcy94LW1vZGVsYWJsZS5qc1xuZGlyZWN0aXZlKFwibW9kZWxhYmxlXCIsIChlbCwgeyBleHByZXNzaW9uIH0sIHsgZWZmZWN0OiBlZmZlY3QzLCBldmFsdWF0ZUxhdGVyOiBldmFsdWF0ZUxhdGVyMiwgY2xlYW51cDogY2xlYW51cDIgfSkgPT4ge1xuICBsZXQgZnVuYyA9IGV2YWx1YXRlTGF0ZXIyKGV4cHJlc3Npb24pO1xuICBsZXQgaW5uZXJHZXQgPSAoKSA9PiB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBmdW5jKChpKSA9PiByZXN1bHQgPSBpKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBsZXQgZXZhbHVhdGVJbm5lclNldCA9IGV2YWx1YXRlTGF0ZXIyKGAke2V4cHJlc3Npb259ID0gX19wbGFjZWhvbGRlcmApO1xuICBsZXQgaW5uZXJTZXQgPSAodmFsKSA9PiBldmFsdWF0ZUlubmVyU2V0KCgpID0+IHtcbiAgfSwgeyBzY29wZTogeyBcIl9fcGxhY2Vob2xkZXJcIjogdmFsIH0gfSk7XG4gIGxldCBpbml0aWFsVmFsdWUgPSBpbm5lckdldCgpO1xuICBpbm5lclNldChpbml0aWFsVmFsdWUpO1xuICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgaWYgKCFlbC5feF9tb2RlbClcbiAgICAgIHJldHVybjtcbiAgICBlbC5feF9yZW1vdmVNb2RlbExpc3RlbmVyc1tcImRlZmF1bHRcIl0oKTtcbiAgICBsZXQgb3V0ZXJHZXQgPSBlbC5feF9tb2RlbC5nZXQ7XG4gICAgbGV0IG91dGVyU2V0ID0gZWwuX3hfbW9kZWwuc2V0O1xuICAgIGxldCByZWxlYXNlRW50YW5nbGVtZW50ID0gZW50YW5nbGUoXG4gICAgICB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gb3V0ZXJHZXQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0KHZhbHVlKSB7XG4gICAgICAgICAgb3V0ZXJTZXQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIGlubmVyR2V0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldCh2YWx1ZSkge1xuICAgICAgICAgIGlubmVyU2V0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgY2xlYW51cDIocmVsZWFzZUVudGFuZ2xlbWVudCk7XG4gIH0pO1xufSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtdGVsZXBvcnQuanNcbmRpcmVjdGl2ZShcInRlbGVwb3J0XCIsIChlbCwgeyBtb2RpZmllcnMsIGV4cHJlc3Npb24gfSwgeyBjbGVhbnVwOiBjbGVhbnVwMiB9KSA9PiB7XG4gIGlmIChlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgIT09IFwidGVtcGxhdGVcIilcbiAgICB3YXJuKFwieC10ZWxlcG9ydCBjYW4gb25seSBiZSB1c2VkIG9uIGEgPHRlbXBsYXRlPiB0YWdcIiwgZWwpO1xuICBsZXQgdGFyZ2V0ID0gZ2V0VGFyZ2V0KGV4cHJlc3Npb24pO1xuICBsZXQgY2xvbmUyID0gZWwuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gIGVsLl94X3RlbGVwb3J0ID0gY2xvbmUyO1xuICBjbG9uZTIuX3hfdGVsZXBvcnRCYWNrID0gZWw7XG4gIGVsLnNldEF0dHJpYnV0ZShcImRhdGEtdGVsZXBvcnQtdGVtcGxhdGVcIiwgdHJ1ZSk7XG4gIGNsb25lMi5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRlbGVwb3J0LXRhcmdldFwiLCB0cnVlKTtcbiAgaWYgKGVsLl94X2ZvcndhcmRFdmVudHMpIHtcbiAgICBlbC5feF9mb3J3YXJkRXZlbnRzLmZvckVhY2goKGV2ZW50TmFtZSkgPT4ge1xuICAgICAgY2xvbmUyLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlbC5kaXNwYXRjaEV2ZW50KG5ldyBlLmNvbnN0cnVjdG9yKGUudHlwZSwgZSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgYWRkU2NvcGVUb05vZGUoY2xvbmUyLCB7fSwgZWwpO1xuICBsZXQgcGxhY2VJbkRvbSA9IChjbG9uZTMsIHRhcmdldDIsIG1vZGlmaWVyczIpID0+IHtcbiAgICBpZiAobW9kaWZpZXJzMi5pbmNsdWRlcyhcInByZXBlbmRcIikpIHtcbiAgICAgIHRhcmdldDIucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY2xvbmUzLCB0YXJnZXQyKTtcbiAgICB9IGVsc2UgaWYgKG1vZGlmaWVyczIuaW5jbHVkZXMoXCJhcHBlbmRcIikpIHtcbiAgICAgIHRhcmdldDIucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY2xvbmUzLCB0YXJnZXQyLm5leHRTaWJsaW5nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFyZ2V0Mi5hcHBlbmRDaGlsZChjbG9uZTMpO1xuICAgIH1cbiAgfTtcbiAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICBwbGFjZUluRG9tKGNsb25lMiwgdGFyZ2V0LCBtb2RpZmllcnMpO1xuICAgIGluaXRUcmVlKGNsb25lMik7XG4gICAgY2xvbmUyLl94X2lnbm9yZSA9IHRydWU7XG4gIH0pO1xuICBlbC5feF90ZWxlcG9ydFB1dEJhY2sgPSAoKSA9PiB7XG4gICAgbGV0IHRhcmdldDIgPSBnZXRUYXJnZXQoZXhwcmVzc2lvbik7XG4gICAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICAgIHBsYWNlSW5Eb20oZWwuX3hfdGVsZXBvcnQsIHRhcmdldDIsIG1vZGlmaWVycyk7XG4gICAgfSk7XG4gIH07XG4gIGNsZWFudXAyKCgpID0+IGNsb25lMi5yZW1vdmUoKSk7XG59KTtcbnZhciB0ZWxlcG9ydENvbnRhaW5lckR1cmluZ0Nsb25lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbmZ1bmN0aW9uIGdldFRhcmdldChleHByZXNzaW9uKSB7XG4gIGxldCB0YXJnZXQgPSBza2lwRHVyaW5nQ2xvbmUoKCkgPT4ge1xuICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGV4cHJlc3Npb24pO1xuICB9LCAoKSA9PiB7XG4gICAgcmV0dXJuIHRlbGVwb3J0Q29udGFpbmVyRHVyaW5nQ2xvbmU7XG4gIH0pKCk7XG4gIGlmICghdGFyZ2V0KVxuICAgIHdhcm4oYENhbm5vdCBmaW5kIHgtdGVsZXBvcnQgZWxlbWVudCBmb3Igc2VsZWN0b3I6IFwiJHtleHByZXNzaW9ufVwiYCk7XG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtaWdub3JlLmpzXG52YXIgaGFuZGxlciA9ICgpID0+IHtcbn07XG5oYW5kbGVyLmlubGluZSA9IChlbCwgeyBtb2RpZmllcnMgfSwgeyBjbGVhbnVwOiBjbGVhbnVwMiB9KSA9PiB7XG4gIG1vZGlmaWVycy5pbmNsdWRlcyhcInNlbGZcIikgPyBlbC5feF9pZ25vcmVTZWxmID0gdHJ1ZSA6IGVsLl94X2lnbm9yZSA9IHRydWU7XG4gIGNsZWFudXAyKCgpID0+IHtcbiAgICBtb2RpZmllcnMuaW5jbHVkZXMoXCJzZWxmXCIpID8gZGVsZXRlIGVsLl94X2lnbm9yZVNlbGYgOiBkZWxldGUgZWwuX3hfaWdub3JlO1xuICB9KTtcbn07XG5kaXJlY3RpdmUoXCJpZ25vcmVcIiwgaGFuZGxlcik7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtZWZmZWN0LmpzXG5kaXJlY3RpdmUoXCJlZmZlY3RcIiwgc2tpcER1cmluZ0Nsb25lKChlbCwgeyBleHByZXNzaW9uIH0sIHsgZWZmZWN0OiBlZmZlY3QzIH0pID0+IHtcbiAgZWZmZWN0MyhldmFsdWF0ZUxhdGVyKGVsLCBleHByZXNzaW9uKSk7XG59KSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy91dGlscy9vbi5qc1xuZnVuY3Rpb24gb24oZWwsIGV2ZW50LCBtb2RpZmllcnMsIGNhbGxiYWNrKSB7XG4gIGxldCBsaXN0ZW5lclRhcmdldCA9IGVsO1xuICBsZXQgaGFuZGxlcjQgPSAoZSkgPT4gY2FsbGJhY2soZSk7XG4gIGxldCBvcHRpb25zID0ge307XG4gIGxldCB3cmFwSGFuZGxlciA9IChjYWxsYmFjazIsIHdyYXBwZXIpID0+IChlKSA9PiB3cmFwcGVyKGNhbGxiYWNrMiwgZSk7XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJkb3RcIikpXG4gICAgZXZlbnQgPSBkb3RTeW50YXgoZXZlbnQpO1xuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwiY2FtZWxcIikpXG4gICAgZXZlbnQgPSBjYW1lbENhc2UyKGV2ZW50KTtcbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcInBhc3NpdmVcIikpXG4gICAgb3B0aW9ucy5wYXNzaXZlID0gdHJ1ZTtcbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImNhcHR1cmVcIikpXG4gICAgb3B0aW9ucy5jYXB0dXJlID0gdHJ1ZTtcbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcIndpbmRvd1wiKSlcbiAgICBsaXN0ZW5lclRhcmdldCA9IHdpbmRvdztcbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImRvY3VtZW50XCIpKVxuICAgIGxpc3RlbmVyVGFyZ2V0ID0gZG9jdW1lbnQ7XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJkZWJvdW5jZVwiKSkge1xuICAgIGxldCBuZXh0TW9kaWZpZXIgPSBtb2RpZmllcnNbbW9kaWZpZXJzLmluZGV4T2YoXCJkZWJvdW5jZVwiKSArIDFdIHx8IFwiaW52YWxpZC13YWl0XCI7XG4gICAgbGV0IHdhaXQgPSBpc051bWVyaWMobmV4dE1vZGlmaWVyLnNwbGl0KFwibXNcIilbMF0pID8gTnVtYmVyKG5leHRNb2RpZmllci5zcGxpdChcIm1zXCIpWzBdKSA6IDI1MDtcbiAgICBoYW5kbGVyNCA9IGRlYm91bmNlKGhhbmRsZXI0LCB3YWl0KTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwidGhyb3R0bGVcIikpIHtcbiAgICBsZXQgbmV4dE1vZGlmaWVyID0gbW9kaWZpZXJzW21vZGlmaWVycy5pbmRleE9mKFwidGhyb3R0bGVcIikgKyAxXSB8fCBcImludmFsaWQtd2FpdFwiO1xuICAgIGxldCB3YWl0ID0gaXNOdW1lcmljKG5leHRNb2RpZmllci5zcGxpdChcIm1zXCIpWzBdKSA/IE51bWJlcihuZXh0TW9kaWZpZXIuc3BsaXQoXCJtc1wiKVswXSkgOiAyNTA7XG4gICAgaGFuZGxlcjQgPSB0aHJvdHRsZShoYW5kbGVyNCwgd2FpdCk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcInByZXZlbnRcIikpXG4gICAgaGFuZGxlcjQgPSB3cmFwSGFuZGxlcihoYW5kbGVyNCwgKG5leHQsIGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG5leHQoZSk7XG4gICAgfSk7XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJzdG9wXCIpKVxuICAgIGhhbmRsZXI0ID0gd3JhcEhhbmRsZXIoaGFuZGxlcjQsIChuZXh0LCBlKSA9PiB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgbmV4dChlKTtcbiAgICB9KTtcbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcInNlbGZcIikpXG4gICAgaGFuZGxlcjQgPSB3cmFwSGFuZGxlcihoYW5kbGVyNCwgKG5leHQsIGUpID0+IHtcbiAgICAgIGUudGFyZ2V0ID09PSBlbCAmJiBuZXh0KGUpO1xuICAgIH0pO1xuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwiYXdheVwiKSB8fCBtb2RpZmllcnMuaW5jbHVkZXMoXCJvdXRzaWRlXCIpKSB7XG4gICAgbGlzdGVuZXJUYXJnZXQgPSBkb2N1bWVudDtcbiAgICBoYW5kbGVyNCA9IHdyYXBIYW5kbGVyKGhhbmRsZXI0LCAobmV4dCwgZSkgPT4ge1xuICAgICAgaWYgKGVsLmNvbnRhaW5zKGUudGFyZ2V0KSlcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYgKGUudGFyZ2V0LmlzQ29ubmVjdGVkID09PSBmYWxzZSlcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYgKGVsLm9mZnNldFdpZHRoIDwgMSAmJiBlbC5vZmZzZXRIZWlnaHQgPCAxKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZiAoZWwuX3hfaXNTaG93biA9PT0gZmFsc2UpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG5leHQoZSk7XG4gICAgfSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcIm9uY2VcIikpIHtcbiAgICBoYW5kbGVyNCA9IHdyYXBIYW5kbGVyKGhhbmRsZXI0LCAobmV4dCwgZSkgPT4ge1xuICAgICAgbmV4dChlKTtcbiAgICAgIGxpc3RlbmVyVGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXI0LCBvcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuICBoYW5kbGVyNCA9IHdyYXBIYW5kbGVyKGhhbmRsZXI0LCAobmV4dCwgZSkgPT4ge1xuICAgIGlmIChpc0tleUV2ZW50KGV2ZW50KSkge1xuICAgICAgaWYgKGlzTGlzdGVuaW5nRm9yQVNwZWNpZmljS2V5VGhhdEhhc250QmVlblByZXNzZWQoZSwgbW9kaWZpZXJzKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIG5leHQoZSk7XG4gIH0pO1xuICBsaXN0ZW5lclRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyNCwgb3B0aW9ucyk7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgbGlzdGVuZXJUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlcjQsIG9wdGlvbnMpO1xuICB9O1xufVxuZnVuY3Rpb24gZG90U3ludGF4KHN1YmplY3QpIHtcbiAgcmV0dXJuIHN1YmplY3QucmVwbGFjZSgvLS9nLCBcIi5cIik7XG59XG5mdW5jdGlvbiBjYW1lbENhc2UyKHN1YmplY3QpIHtcbiAgcmV0dXJuIHN1YmplY3QudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8tKFxcdykvZywgKG1hdGNoLCBjaGFyKSA9PiBjaGFyLnRvVXBwZXJDYXNlKCkpO1xufVxuZnVuY3Rpb24gaXNOdW1lcmljKHN1YmplY3QpIHtcbiAgcmV0dXJuICFBcnJheS5pc0FycmF5KHN1YmplY3QpICYmICFpc05hTihzdWJqZWN0KTtcbn1cbmZ1bmN0aW9uIGtlYmFiQ2FzZTIoc3ViamVjdCkge1xuICBpZiAoW1wiIFwiLCBcIl9cIl0uaW5jbHVkZXMoXG4gICAgc3ViamVjdFxuICApKVxuICAgIHJldHVybiBzdWJqZWN0O1xuICByZXR1cm4gc3ViamVjdC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCBcIiQxLSQyXCIpLnJlcGxhY2UoL1tfXFxzXS8sIFwiLVwiKS50b0xvd2VyQ2FzZSgpO1xufVxuZnVuY3Rpb24gaXNLZXlFdmVudChldmVudCkge1xuICByZXR1cm4gW1wia2V5ZG93blwiLCBcImtleXVwXCJdLmluY2x1ZGVzKGV2ZW50KTtcbn1cbmZ1bmN0aW9uIGlzTGlzdGVuaW5nRm9yQVNwZWNpZmljS2V5VGhhdEhhc250QmVlblByZXNzZWQoZSwgbW9kaWZpZXJzKSB7XG4gIGxldCBrZXlNb2RpZmllcnMgPSBtb2RpZmllcnMuZmlsdGVyKChpKSA9PiB7XG4gICAgcmV0dXJuICFbXCJ3aW5kb3dcIiwgXCJkb2N1bWVudFwiLCBcInByZXZlbnRcIiwgXCJzdG9wXCIsIFwib25jZVwiLCBcImNhcHR1cmVcIl0uaW5jbHVkZXMoaSk7XG4gIH0pO1xuICBpZiAoa2V5TW9kaWZpZXJzLmluY2x1ZGVzKFwiZGVib3VuY2VcIikpIHtcbiAgICBsZXQgZGVib3VuY2VJbmRleCA9IGtleU1vZGlmaWVycy5pbmRleE9mKFwiZGVib3VuY2VcIik7XG4gICAga2V5TW9kaWZpZXJzLnNwbGljZShkZWJvdW5jZUluZGV4LCBpc051bWVyaWMoKGtleU1vZGlmaWVyc1tkZWJvdW5jZUluZGV4ICsgMV0gfHwgXCJpbnZhbGlkLXdhaXRcIikuc3BsaXQoXCJtc1wiKVswXSkgPyAyIDogMSk7XG4gIH1cbiAgaWYgKGtleU1vZGlmaWVycy5pbmNsdWRlcyhcInRocm90dGxlXCIpKSB7XG4gICAgbGV0IGRlYm91bmNlSW5kZXggPSBrZXlNb2RpZmllcnMuaW5kZXhPZihcInRocm90dGxlXCIpO1xuICAgIGtleU1vZGlmaWVycy5zcGxpY2UoZGVib3VuY2VJbmRleCwgaXNOdW1lcmljKChrZXlNb2RpZmllcnNbZGVib3VuY2VJbmRleCArIDFdIHx8IFwiaW52YWxpZC13YWl0XCIpLnNwbGl0KFwibXNcIilbMF0pID8gMiA6IDEpO1xuICB9XG4gIGlmIChrZXlNb2RpZmllcnMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGtleU1vZGlmaWVycy5sZW5ndGggPT09IDEgJiYga2V5VG9Nb2RpZmllcnMoZS5rZXkpLmluY2x1ZGVzKGtleU1vZGlmaWVyc1swXSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBzeXN0ZW1LZXlNb2RpZmllcnMgPSBbXCJjdHJsXCIsIFwic2hpZnRcIiwgXCJhbHRcIiwgXCJtZXRhXCIsIFwiY21kXCIsIFwic3VwZXJcIl07XG4gIGNvbnN0IHNlbGVjdGVkU3lzdGVtS2V5TW9kaWZpZXJzID0gc3lzdGVtS2V5TW9kaWZpZXJzLmZpbHRlcigobW9kaWZpZXIpID0+IGtleU1vZGlmaWVycy5pbmNsdWRlcyhtb2RpZmllcikpO1xuICBrZXlNb2RpZmllcnMgPSBrZXlNb2RpZmllcnMuZmlsdGVyKChpKSA9PiAhc2VsZWN0ZWRTeXN0ZW1LZXlNb2RpZmllcnMuaW5jbHVkZXMoaSkpO1xuICBpZiAoc2VsZWN0ZWRTeXN0ZW1LZXlNb2RpZmllcnMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGFjdGl2ZWx5UHJlc3NlZEtleU1vZGlmaWVycyA9IHNlbGVjdGVkU3lzdGVtS2V5TW9kaWZpZXJzLmZpbHRlcigobW9kaWZpZXIpID0+IHtcbiAgICAgIGlmIChtb2RpZmllciA9PT0gXCJjbWRcIiB8fCBtb2RpZmllciA9PT0gXCJzdXBlclwiKVxuICAgICAgICBtb2RpZmllciA9IFwibWV0YVwiO1xuICAgICAgcmV0dXJuIGVbYCR7bW9kaWZpZXJ9S2V5YF07XG4gICAgfSk7XG4gICAgaWYgKGFjdGl2ZWx5UHJlc3NlZEtleU1vZGlmaWVycy5sZW5ndGggPT09IHNlbGVjdGVkU3lzdGVtS2V5TW9kaWZpZXJzLmxlbmd0aCkge1xuICAgICAgaWYgKGtleVRvTW9kaWZpZXJzKGUua2V5KS5pbmNsdWRlcyhrZXlNb2RpZmllcnNbMF0pKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24ga2V5VG9Nb2RpZmllcnMoa2V5KSB7XG4gIGlmICgha2V5KVxuICAgIHJldHVybiBbXTtcbiAga2V5ID0ga2ViYWJDYXNlMihrZXkpO1xuICBsZXQgbW9kaWZpZXJUb0tleU1hcCA9IHtcbiAgICBcImN0cmxcIjogXCJjb250cm9sXCIsXG4gICAgXCJzbGFzaFwiOiBcIi9cIixcbiAgICBcInNwYWNlXCI6IFwiIFwiLFxuICAgIFwic3BhY2ViYXJcIjogXCIgXCIsXG4gICAgXCJjbWRcIjogXCJtZXRhXCIsXG4gICAgXCJlc2NcIjogXCJlc2NhcGVcIixcbiAgICBcInVwXCI6IFwiYXJyb3ctdXBcIixcbiAgICBcImRvd25cIjogXCJhcnJvdy1kb3duXCIsXG4gICAgXCJsZWZ0XCI6IFwiYXJyb3ctbGVmdFwiLFxuICAgIFwicmlnaHRcIjogXCJhcnJvdy1yaWdodFwiLFxuICAgIFwicGVyaW9kXCI6IFwiLlwiLFxuICAgIFwiZXF1YWxcIjogXCI9XCIsXG4gICAgXCJtaW51c1wiOiBcIi1cIixcbiAgICBcInVuZGVyc2NvcmVcIjogXCJfXCJcbiAgfTtcbiAgbW9kaWZpZXJUb0tleU1hcFtrZXldID0ga2V5O1xuICByZXR1cm4gT2JqZWN0LmtleXMobW9kaWZpZXJUb0tleU1hcCkubWFwKChtb2RpZmllcikgPT4ge1xuICAgIGlmIChtb2RpZmllclRvS2V5TWFwW21vZGlmaWVyXSA9PT0ga2V5KVxuICAgICAgcmV0dXJuIG1vZGlmaWVyO1xuICB9KS5maWx0ZXIoKG1vZGlmaWVyKSA9PiBtb2RpZmllcik7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtbW9kZWwuanNcbmRpcmVjdGl2ZShcIm1vZGVsXCIsIChlbCwgeyBtb2RpZmllcnMsIGV4cHJlc3Npb24gfSwgeyBlZmZlY3Q6IGVmZmVjdDMsIGNsZWFudXA6IGNsZWFudXAyIH0pID0+IHtcbiAgbGV0IHNjb3BlVGFyZ2V0ID0gZWw7XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJwYXJlbnRcIikpIHtcbiAgICBzY29wZVRhcmdldCA9IGVsLnBhcmVudE5vZGU7XG4gIH1cbiAgbGV0IGV2YWx1YXRlR2V0ID0gZXZhbHVhdGVMYXRlcihzY29wZVRhcmdldCwgZXhwcmVzc2lvbik7XG4gIGxldCBldmFsdWF0ZVNldDtcbiAgaWYgKHR5cGVvZiBleHByZXNzaW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgZXZhbHVhdGVTZXQgPSBldmFsdWF0ZUxhdGVyKHNjb3BlVGFyZ2V0LCBgJHtleHByZXNzaW9ufSA9IF9fcGxhY2Vob2xkZXJgKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwcmVzc2lvbiA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBleHByZXNzaW9uKCkgPT09IFwic3RyaW5nXCIpIHtcbiAgICBldmFsdWF0ZVNldCA9IGV2YWx1YXRlTGF0ZXIoc2NvcGVUYXJnZXQsIGAke2V4cHJlc3Npb24oKX0gPSBfX3BsYWNlaG9sZGVyYCk7XG4gIH0gZWxzZSB7XG4gICAgZXZhbHVhdGVTZXQgPSAoKSA9PiB7XG4gICAgfTtcbiAgfVxuICBsZXQgZ2V0VmFsdWUgPSAoKSA9PiB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBldmFsdWF0ZUdldCgodmFsdWUpID0+IHJlc3VsdCA9IHZhbHVlKTtcbiAgICByZXR1cm4gaXNHZXR0ZXJTZXR0ZXIocmVzdWx0KSA/IHJlc3VsdC5nZXQoKSA6IHJlc3VsdDtcbiAgfTtcbiAgbGV0IHNldFZhbHVlID0gKHZhbHVlKSA9PiB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBldmFsdWF0ZUdldCgodmFsdWUyKSA9PiByZXN1bHQgPSB2YWx1ZTIpO1xuICAgIGlmIChpc0dldHRlclNldHRlcihyZXN1bHQpKSB7XG4gICAgICByZXN1bHQuc2V0KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZhbHVhdGVTZXQoKCkgPT4ge1xuICAgICAgfSwge1xuICAgICAgICBzY29wZTogeyBcIl9fcGxhY2Vob2xkZXJcIjogdmFsdWUgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBpZiAodHlwZW9mIGV4cHJlc3Npb24gPT09IFwic3RyaW5nXCIgJiYgZWwudHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICAgIGlmICghZWwuaGFzQXR0cmlidXRlKFwibmFtZVwiKSlcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBleHByZXNzaW9uKTtcbiAgICB9KTtcbiAgfVxuICB2YXIgZXZlbnQgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwic2VsZWN0XCIgfHwgW1wiY2hlY2tib3hcIiwgXCJyYWRpb1wiXS5pbmNsdWRlcyhlbC50eXBlKSB8fCBtb2RpZmllcnMuaW5jbHVkZXMoXCJsYXp5XCIpID8gXCJjaGFuZ2VcIiA6IFwiaW5wdXRcIjtcbiAgbGV0IHJlbW92ZUxpc3RlbmVyID0gaXNDbG9uaW5nID8gKCkgPT4ge1xuICB9IDogb24oZWwsIGV2ZW50LCBtb2RpZmllcnMsIChlKSA9PiB7XG4gICAgc2V0VmFsdWUoZ2V0SW5wdXRWYWx1ZShlbCwgbW9kaWZpZXJzLCBlLCBnZXRWYWx1ZSgpKSk7XG4gIH0pO1xuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwiZmlsbFwiKSkge1xuICAgIGlmIChbbnVsbCwgXCJcIl0uaW5jbHVkZXMoZ2V0VmFsdWUoKSkgfHwgZWwudHlwZSA9PT0gXCJjaGVja2JveFwiICYmIEFycmF5LmlzQXJyYXkoZ2V0VmFsdWUoKSkpIHtcbiAgICAgIGVsLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KGV2ZW50LCB7fSkpO1xuICAgIH1cbiAgfVxuICBpZiAoIWVsLl94X3JlbW92ZU1vZGVsTGlzdGVuZXJzKVxuICAgIGVsLl94X3JlbW92ZU1vZGVsTGlzdGVuZXJzID0ge307XG4gIGVsLl94X3JlbW92ZU1vZGVsTGlzdGVuZXJzW1wiZGVmYXVsdFwiXSA9IHJlbW92ZUxpc3RlbmVyO1xuICBjbGVhbnVwMigoKSA9PiBlbC5feF9yZW1vdmVNb2RlbExpc3RlbmVyc1tcImRlZmF1bHRcIl0oKSk7XG4gIGlmIChlbC5mb3JtKSB7XG4gICAgbGV0IHJlbW92ZVJlc2V0TGlzdGVuZXIgPSBvbihlbC5mb3JtLCBcInJlc2V0XCIsIFtdLCAoZSkgPT4ge1xuICAgICAgbmV4dFRpY2soKCkgPT4gZWwuX3hfbW9kZWwgJiYgZWwuX3hfbW9kZWwuc2V0KGVsLnZhbHVlKSk7XG4gICAgfSk7XG4gICAgY2xlYW51cDIoKCkgPT4gcmVtb3ZlUmVzZXRMaXN0ZW5lcigpKTtcbiAgfVxuICBlbC5feF9tb2RlbCA9IHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gZ2V0VmFsdWUoKTtcbiAgICB9LFxuICAgIHNldCh2YWx1ZSkge1xuICAgICAgc2V0VmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfTtcbiAgZWwuX3hfZm9yY2VNb2RlbFVwZGF0ZSA9ICh2YWx1ZSkgPT4ge1xuICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwICYmIHR5cGVvZiBleHByZXNzaW9uID09PSBcInN0cmluZ1wiICYmIGV4cHJlc3Npb24ubWF0Y2goL1xcLi8pKVxuICAgICAgdmFsdWUgPSBcIlwiO1xuICAgIHdpbmRvdy5mcm9tTW9kZWwgPSB0cnVlO1xuICAgIG11dGF0ZURvbSgoKSA9PiBiaW5kKGVsLCBcInZhbHVlXCIsIHZhbHVlKSk7XG4gICAgZGVsZXRlIHdpbmRvdy5mcm9tTW9kZWw7XG4gIH07XG4gIGVmZmVjdDMoKCkgPT4ge1xuICAgIGxldCB2YWx1ZSA9IGdldFZhbHVlKCk7XG4gICAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcInVuaW50cnVzaXZlXCIpICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuaXNTYW1lTm9kZShlbCkpXG4gICAgICByZXR1cm47XG4gICAgZWwuX3hfZm9yY2VNb2RlbFVwZGF0ZSh2YWx1ZSk7XG4gIH0pO1xufSk7XG5mdW5jdGlvbiBnZXRJbnB1dFZhbHVlKGVsLCBtb2RpZmllcnMsIGV2ZW50LCBjdXJyZW50VmFsdWUpIHtcbiAgcmV0dXJuIG11dGF0ZURvbSgoKSA9PiB7XG4gICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgQ3VzdG9tRXZlbnQgJiYgZXZlbnQuZGV0YWlsICE9PSB2b2lkIDApXG4gICAgICByZXR1cm4gZXZlbnQuZGV0YWlsICE9PSBudWxsICYmIGV2ZW50LmRldGFpbCAhPT0gdm9pZCAwID8gZXZlbnQuZGV0YWlsIDogZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgIGVsc2UgaWYgKGVsLnR5cGUgPT09IFwiY2hlY2tib3hcIikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY3VycmVudFZhbHVlKSkge1xuICAgICAgICBsZXQgbmV3VmFsdWUgPSBudWxsO1xuICAgICAgICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwibnVtYmVyXCIpKSB7XG4gICAgICAgICAgbmV3VmFsdWUgPSBzYWZlUGFyc2VOdW1iZXIoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJib29sZWFuXCIpKSB7XG4gICAgICAgICAgbmV3VmFsdWUgPSBzYWZlUGFyc2VCb29sZWFuKGV2ZW50LnRhcmdldC52YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3VmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV2ZW50LnRhcmdldC5jaGVja2VkID8gY3VycmVudFZhbHVlLmNvbmNhdChbbmV3VmFsdWVdKSA6IGN1cnJlbnRWYWx1ZS5maWx0ZXIoKGVsMikgPT4gIWNoZWNrZWRBdHRyTG9vc2VDb21wYXJlMihlbDIsIG5ld1ZhbHVlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwic2VsZWN0XCIgJiYgZWwubXVsdGlwbGUpIHtcbiAgICAgIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJudW1iZXJcIikpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20oZXZlbnQudGFyZ2V0LnNlbGVjdGVkT3B0aW9ucykubWFwKChvcHRpb24pID0+IHtcbiAgICAgICAgICBsZXQgcmF3VmFsdWUgPSBvcHRpb24udmFsdWUgfHwgb3B0aW9uLnRleHQ7XG4gICAgICAgICAgcmV0dXJuIHNhZmVQYXJzZU51bWJlcihyYXdWYWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJib29sZWFuXCIpKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKGV2ZW50LnRhcmdldC5zZWxlY3RlZE9wdGlvbnMpLm1hcCgob3B0aW9uKSA9PiB7XG4gICAgICAgICAgbGV0IHJhd1ZhbHVlID0gb3B0aW9uLnZhbHVlIHx8IG9wdGlvbi50ZXh0O1xuICAgICAgICAgIHJldHVybiBzYWZlUGFyc2VCb29sZWFuKHJhd1ZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShldmVudC50YXJnZXQuc2VsZWN0ZWRPcHRpb25zKS5tYXAoKG9wdGlvbikgPT4ge1xuICAgICAgICByZXR1cm4gb3B0aW9uLnZhbHVlIHx8IG9wdGlvbi50ZXh0O1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJudW1iZXJcIikpIHtcbiAgICAgICAgcmV0dXJuIHNhZmVQYXJzZU51bWJlcihldmVudC50YXJnZXQudmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJib29sZWFuXCIpKSB7XG4gICAgICAgIHJldHVybiBzYWZlUGFyc2VCb29sZWFuKGV2ZW50LnRhcmdldC52YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbW9kaWZpZXJzLmluY2x1ZGVzKFwidHJpbVwiKSA/IGV2ZW50LnRhcmdldC52YWx1ZS50cmltKCkgOiBldmVudC50YXJnZXQudmFsdWU7XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIHNhZmVQYXJzZU51bWJlcihyYXdWYWx1ZSkge1xuICBsZXQgbnVtYmVyID0gcmF3VmFsdWUgPyBwYXJzZUZsb2F0KHJhd1ZhbHVlKSA6IG51bGw7XG4gIHJldHVybiBpc051bWVyaWMyKG51bWJlcikgPyBudW1iZXIgOiByYXdWYWx1ZTtcbn1cbmZ1bmN0aW9uIGNoZWNrZWRBdHRyTG9vc2VDb21wYXJlMih2YWx1ZUEsIHZhbHVlQikge1xuICByZXR1cm4gdmFsdWVBID09IHZhbHVlQjtcbn1cbmZ1bmN0aW9uIGlzTnVtZXJpYzIoc3ViamVjdCkge1xuICByZXR1cm4gIUFycmF5LmlzQXJyYXkoc3ViamVjdCkgJiYgIWlzTmFOKHN1YmplY3QpO1xufVxuZnVuY3Rpb24gaXNHZXR0ZXJTZXR0ZXIodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUuZ2V0ID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIHZhbHVlLnNldCA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvZGlyZWN0aXZlcy94LWNsb2FrLmpzXG5kaXJlY3RpdmUoXCJjbG9ha1wiLCAoZWwpID0+IHF1ZXVlTWljcm90YXNrKCgpID0+IG11dGF0ZURvbSgoKSA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUocHJlZml4KFwiY2xvYWtcIikpKSkpO1xuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvZGlyZWN0aXZlcy94LWluaXQuanNcbmFkZEluaXRTZWxlY3RvcigoKSA9PiBgWyR7cHJlZml4KFwiaW5pdFwiKX1dYCk7XG5kaXJlY3RpdmUoXCJpbml0XCIsIHNraXBEdXJpbmdDbG9uZSgoZWwsIHsgZXhwcmVzc2lvbiB9LCB7IGV2YWx1YXRlOiBldmFsdWF0ZTIgfSkgPT4ge1xuICBpZiAodHlwZW9mIGV4cHJlc3Npb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gISFleHByZXNzaW9uLnRyaW0oKSAmJiBldmFsdWF0ZTIoZXhwcmVzc2lvbiwge30sIGZhbHNlKTtcbiAgfVxuICByZXR1cm4gZXZhbHVhdGUyKGV4cHJlc3Npb24sIHt9LCBmYWxzZSk7XG59KSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtdGV4dC5qc1xuZGlyZWN0aXZlKFwidGV4dFwiLCAoZWwsIHsgZXhwcmVzc2lvbiB9LCB7IGVmZmVjdDogZWZmZWN0MywgZXZhbHVhdGVMYXRlcjogZXZhbHVhdGVMYXRlcjIgfSkgPT4ge1xuICBsZXQgZXZhbHVhdGUyID0gZXZhbHVhdGVMYXRlcjIoZXhwcmVzc2lvbik7XG4gIGVmZmVjdDMoKCkgPT4ge1xuICAgIGV2YWx1YXRlMigodmFsdWUpID0+IHtcbiAgICAgIG11dGF0ZURvbSgoKSA9PiB7XG4gICAgICAgIGVsLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2RpcmVjdGl2ZXMveC1odG1sLmpzXG5kaXJlY3RpdmUoXCJodG1sXCIsIChlbCwgeyBleHByZXNzaW9uIH0sIHsgZWZmZWN0OiBlZmZlY3QzLCBldmFsdWF0ZUxhdGVyOiBldmFsdWF0ZUxhdGVyMiB9KSA9PiB7XG4gIGxldCBldmFsdWF0ZTIgPSBldmFsdWF0ZUxhdGVyMihleHByZXNzaW9uKTtcbiAgZWZmZWN0MygoKSA9PiB7XG4gICAgZXZhbHVhdGUyKCh2YWx1ZSkgPT4ge1xuICAgICAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgICAgIGVsLl94X2lnbm9yZVNlbGYgPSB0cnVlO1xuICAgICAgICBpbml0VHJlZShlbCk7XG4gICAgICAgIGRlbGV0ZSBlbC5feF9pZ25vcmVTZWxmO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtYmluZC5qc1xubWFwQXR0cmlidXRlcyhzdGFydGluZ1dpdGgoXCI6XCIsIGludG8ocHJlZml4KFwiYmluZDpcIikpKSk7XG52YXIgaGFuZGxlcjIgPSAoZWwsIHsgdmFsdWUsIG1vZGlmaWVycywgZXhwcmVzc2lvbiwgb3JpZ2luYWwgfSwgeyBlZmZlY3Q6IGVmZmVjdDMgfSkgPT4ge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgbGV0IGJpbmRpbmdQcm92aWRlcnMgPSB7fTtcbiAgICBpbmplY3RCaW5kaW5nUHJvdmlkZXJzKGJpbmRpbmdQcm92aWRlcnMpO1xuICAgIGxldCBnZXRCaW5kaW5ncyA9IGV2YWx1YXRlTGF0ZXIoZWwsIGV4cHJlc3Npb24pO1xuICAgIGdldEJpbmRpbmdzKChiaW5kaW5ncykgPT4ge1xuICAgICAgYXBwbHlCaW5kaW5nc09iamVjdChlbCwgYmluZGluZ3MsIG9yaWdpbmFsKTtcbiAgICB9LCB7IHNjb3BlOiBiaW5kaW5nUHJvdmlkZXJzIH0pO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodmFsdWUgPT09IFwia2V5XCIpXG4gICAgcmV0dXJuIHN0b3JlS2V5Rm9yWEZvcihlbCwgZXhwcmVzc2lvbik7XG4gIGlmIChlbC5feF9pbmxpbmVCaW5kaW5ncyAmJiBlbC5feF9pbmxpbmVCaW5kaW5nc1t2YWx1ZV0gJiYgZWwuX3hfaW5saW5lQmluZGluZ3NbdmFsdWVdLmV4dHJhY3QpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGV2YWx1YXRlMiA9IGV2YWx1YXRlTGF0ZXIoZWwsIGV4cHJlc3Npb24pO1xuICBlZmZlY3QzKCgpID0+IGV2YWx1YXRlMigocmVzdWx0KSA9PiB7XG4gICAgaWYgKHJlc3VsdCA9PT0gdm9pZCAwICYmIHR5cGVvZiBleHByZXNzaW9uID09PSBcInN0cmluZ1wiICYmIGV4cHJlc3Npb24ubWF0Y2goL1xcLi8pKSB7XG4gICAgICByZXN1bHQgPSBcIlwiO1xuICAgIH1cbiAgICBtdXRhdGVEb20oKCkgPT4gYmluZChlbCwgdmFsdWUsIHJlc3VsdCwgbW9kaWZpZXJzKSk7XG4gIH0pKTtcbn07XG5oYW5kbGVyMi5pbmxpbmUgPSAoZWwsIHsgdmFsdWUsIG1vZGlmaWVycywgZXhwcmVzc2lvbiB9KSA9PiB7XG4gIGlmICghdmFsdWUpXG4gICAgcmV0dXJuO1xuICBpZiAoIWVsLl94X2lubGluZUJpbmRpbmdzKVxuICAgIGVsLl94X2lubGluZUJpbmRpbmdzID0ge307XG4gIGVsLl94X2lubGluZUJpbmRpbmdzW3ZhbHVlXSA9IHsgZXhwcmVzc2lvbiwgZXh0cmFjdDogZmFsc2UgfTtcbn07XG5kaXJlY3RpdmUoXCJiaW5kXCIsIGhhbmRsZXIyKTtcbmZ1bmN0aW9uIHN0b3JlS2V5Rm9yWEZvcihlbCwgZXhwcmVzc2lvbikge1xuICBlbC5feF9rZXlFeHByZXNzaW9uID0gZXhwcmVzc2lvbjtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2RpcmVjdGl2ZXMveC1kYXRhLmpzXG5hZGRSb290U2VsZWN0b3IoKCkgPT4gYFske3ByZWZpeChcImRhdGFcIil9XWApO1xuZGlyZWN0aXZlKFwiZGF0YVwiLCAoZWwsIHsgZXhwcmVzc2lvbiB9LCB7IGNsZWFudXA6IGNsZWFudXAyIH0pID0+IHtcbiAgaWYgKHNob3VsZFNraXBSZWdpc3RlcmluZ0RhdGFEdXJpbmdDbG9uZShlbCkpXG4gICAgcmV0dXJuO1xuICBleHByZXNzaW9uID0gZXhwcmVzc2lvbiA9PT0gXCJcIiA/IFwie31cIiA6IGV4cHJlc3Npb247XG4gIGxldCBtYWdpY0NvbnRleHQgPSB7fTtcbiAgaW5qZWN0TWFnaWNzKG1hZ2ljQ29udGV4dCwgZWwpO1xuICBsZXQgZGF0YVByb3ZpZGVyQ29udGV4dCA9IHt9O1xuICBpbmplY3REYXRhUHJvdmlkZXJzKGRhdGFQcm92aWRlckNvbnRleHQsIG1hZ2ljQ29udGV4dCk7XG4gIGxldCBkYXRhMiA9IGV2YWx1YXRlKGVsLCBleHByZXNzaW9uLCB7IHNjb3BlOiBkYXRhUHJvdmlkZXJDb250ZXh0IH0pO1xuICBpZiAoZGF0YTIgPT09IHZvaWQgMCB8fCBkYXRhMiA9PT0gdHJ1ZSlcbiAgICBkYXRhMiA9IHt9O1xuICBpbmplY3RNYWdpY3MoZGF0YTIsIGVsKTtcbiAgbGV0IHJlYWN0aXZlRGF0YSA9IHJlYWN0aXZlKGRhdGEyKTtcbiAgaW5pdEludGVyY2VwdG9yczIocmVhY3RpdmVEYXRhKTtcbiAgbGV0IHVuZG8gPSBhZGRTY29wZVRvTm9kZShlbCwgcmVhY3RpdmVEYXRhKTtcbiAgcmVhY3RpdmVEYXRhW1wiaW5pdFwiXSAmJiBldmFsdWF0ZShlbCwgcmVhY3RpdmVEYXRhW1wiaW5pdFwiXSk7XG4gIGNsZWFudXAyKCgpID0+IHtcbiAgICByZWFjdGl2ZURhdGFbXCJkZXN0cm95XCJdICYmIGV2YWx1YXRlKGVsLCByZWFjdGl2ZURhdGFbXCJkZXN0cm95XCJdKTtcbiAgICB1bmRvKCk7XG4gIH0pO1xufSk7XG5pbnRlcmNlcHRDbG9uZSgoZnJvbSwgdG8pID0+IHtcbiAgaWYgKGZyb20uX3hfZGF0YVN0YWNrKSB7XG4gICAgdG8uX3hfZGF0YVN0YWNrID0gZnJvbS5feF9kYXRhU3RhY2s7XG4gICAgdG8uc2V0QXR0cmlidXRlKFwiZGF0YS1oYXMtYWxwaW5lLXN0YXRlXCIsIHRydWUpO1xuICB9XG59KTtcbmZ1bmN0aW9uIHNob3VsZFNraXBSZWdpc3RlcmluZ0RhdGFEdXJpbmdDbG9uZShlbCkge1xuICBpZiAoIWlzQ2xvbmluZylcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChpc0Nsb25pbmdMZWdhY3kpXG4gICAgcmV0dXJuIHRydWU7XG4gIHJldHVybiBlbC5oYXNBdHRyaWJ1dGUoXCJkYXRhLWhhcy1hbHBpbmUtc3RhdGVcIik7XG59XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtc2hvdy5qc1xuZGlyZWN0aXZlKFwic2hvd1wiLCAoZWwsIHsgbW9kaWZpZXJzLCBleHByZXNzaW9uIH0sIHsgZWZmZWN0OiBlZmZlY3QzIH0pID0+IHtcbiAgbGV0IGV2YWx1YXRlMiA9IGV2YWx1YXRlTGF0ZXIoZWwsIGV4cHJlc3Npb24pO1xuICBpZiAoIWVsLl94X2RvSGlkZSlcbiAgICBlbC5feF9kb0hpZGUgPSAoKSA9PiB7XG4gICAgICBtdXRhdGVEb20oKCkgPT4ge1xuICAgICAgICBlbC5zdHlsZS5zZXRQcm9wZXJ0eShcImRpc3BsYXlcIiwgXCJub25lXCIsIG1vZGlmaWVycy5pbmNsdWRlcyhcImltcG9ydGFudFwiKSA/IFwiaW1wb3J0YW50XCIgOiB2b2lkIDApO1xuICAgICAgfSk7XG4gICAgfTtcbiAgaWYgKCFlbC5feF9kb1Nob3cpXG4gICAgZWwuX3hfZG9TaG93ID0gKCkgPT4ge1xuICAgICAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICAgICAgaWYgKGVsLnN0eWxlLmxlbmd0aCA9PT0gMSAmJiBlbC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShcInN0eWxlXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsLnN0eWxlLnJlbW92ZVByb3BlcnR5KFwiZGlzcGxheVwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgbGV0IGhpZGUgPSAoKSA9PiB7XG4gICAgZWwuX3hfZG9IaWRlKCk7XG4gICAgZWwuX3hfaXNTaG93biA9IGZhbHNlO1xuICB9O1xuICBsZXQgc2hvdyA9ICgpID0+IHtcbiAgICBlbC5feF9kb1Nob3coKTtcbiAgICBlbC5feF9pc1Nob3duID0gdHJ1ZTtcbiAgfTtcbiAgbGV0IGNsaWNrQXdheUNvbXBhdGlibGVTaG93ID0gKCkgPT4gc2V0VGltZW91dChzaG93KTtcbiAgbGV0IHRvZ2dsZSA9IG9uY2UoXG4gICAgKHZhbHVlKSA9PiB2YWx1ZSA/IHNob3coKSA6IGhpZGUoKSxcbiAgICAodmFsdWUpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgZWwuX3hfdG9nZ2xlQW5kQ2FzY2FkZVdpdGhUcmFuc2l0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGVsLl94X3RvZ2dsZUFuZENhc2NhZGVXaXRoVHJhbnNpdGlvbnMoZWwsIHZhbHVlLCBzaG93LCBoaWRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID8gY2xpY2tBd2F5Q29tcGF0aWJsZVNob3coKSA6IGhpZGUoKTtcbiAgICAgIH1cbiAgICB9XG4gICk7XG4gIGxldCBvbGRWYWx1ZTtcbiAgbGV0IGZpcnN0VGltZSA9IHRydWU7XG4gIGVmZmVjdDMoKCkgPT4gZXZhbHVhdGUyKCh2YWx1ZSkgPT4ge1xuICAgIGlmICghZmlyc3RUaW1lICYmIHZhbHVlID09PSBvbGRWYWx1ZSlcbiAgICAgIHJldHVybjtcbiAgICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwiaW1tZWRpYXRlXCIpKVxuICAgICAgdmFsdWUgPyBjbGlja0F3YXlDb21wYXRpYmxlU2hvdygpIDogaGlkZSgpO1xuICAgIHRvZ2dsZSh2YWx1ZSk7XG4gICAgb2xkVmFsdWUgPSB2YWx1ZTtcbiAgICBmaXJzdFRpbWUgPSBmYWxzZTtcbiAgfSkpO1xufSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtZm9yLmpzXG5kaXJlY3RpdmUoXCJmb3JcIiwgKGVsLCB7IGV4cHJlc3Npb24gfSwgeyBlZmZlY3Q6IGVmZmVjdDMsIGNsZWFudXA6IGNsZWFudXAyIH0pID0+IHtcbiAgbGV0IGl0ZXJhdG9yTmFtZXMgPSBwYXJzZUZvckV4cHJlc3Npb24oZXhwcmVzc2lvbik7XG4gIGxldCBldmFsdWF0ZUl0ZW1zID0gZXZhbHVhdGVMYXRlcihlbCwgaXRlcmF0b3JOYW1lcy5pdGVtcyk7XG4gIGxldCBldmFsdWF0ZUtleSA9IGV2YWx1YXRlTGF0ZXIoXG4gICAgZWwsXG4gICAgLy8gdGhlIHgtYmluZDprZXkgZXhwcmVzc2lvbiBpcyBzdG9yZWQgZm9yIG91ciB1c2UgaW5zdGVhZCBvZiBldmFsdWF0ZWQuXG4gICAgZWwuX3hfa2V5RXhwcmVzc2lvbiB8fCBcImluZGV4XCJcbiAgKTtcbiAgZWwuX3hfcHJldktleXMgPSBbXTtcbiAgZWwuX3hfbG9va3VwID0ge307XG4gIGVmZmVjdDMoKCkgPT4gbG9vcChlbCwgaXRlcmF0b3JOYW1lcywgZXZhbHVhdGVJdGVtcywgZXZhbHVhdGVLZXkpKTtcbiAgY2xlYW51cDIoKCkgPT4ge1xuICAgIE9iamVjdC52YWx1ZXMoZWwuX3hfbG9va3VwKS5mb3JFYWNoKChlbDIpID0+IGVsMi5yZW1vdmUoKSk7XG4gICAgZGVsZXRlIGVsLl94X3ByZXZLZXlzO1xuICAgIGRlbGV0ZSBlbC5feF9sb29rdXA7XG4gIH0pO1xufSk7XG5mdW5jdGlvbiBsb29wKGVsLCBpdGVyYXRvck5hbWVzLCBldmFsdWF0ZUl0ZW1zLCBldmFsdWF0ZUtleSkge1xuICBsZXQgaXNPYmplY3QyID0gKGkpID0+IHR5cGVvZiBpID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KGkpO1xuICBsZXQgdGVtcGxhdGVFbCA9IGVsO1xuICBldmFsdWF0ZUl0ZW1zKChpdGVtcykgPT4ge1xuICAgIGlmIChpc051bWVyaWMzKGl0ZW1zKSAmJiBpdGVtcyA+PSAwKSB7XG4gICAgICBpdGVtcyA9IEFycmF5LmZyb20oQXJyYXkoaXRlbXMpLmtleXMoKSwgKGkpID0+IGkgKyAxKTtcbiAgICB9XG4gICAgaWYgKGl0ZW1zID09PSB2b2lkIDApXG4gICAgICBpdGVtcyA9IFtdO1xuICAgIGxldCBsb29rdXAgPSBlbC5feF9sb29rdXA7XG4gICAgbGV0IHByZXZLZXlzID0gZWwuX3hfcHJldktleXM7XG4gICAgbGV0IHNjb3BlcyA9IFtdO1xuICAgIGxldCBrZXlzID0gW107XG4gICAgaWYgKGlzT2JqZWN0MihpdGVtcykpIHtcbiAgICAgIGl0ZW1zID0gT2JqZWN0LmVudHJpZXMoaXRlbXMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIGxldCBzY29wZTIgPSBnZXRJdGVyYXRpb25TY29wZVZhcmlhYmxlcyhpdGVyYXRvck5hbWVzLCB2YWx1ZSwga2V5LCBpdGVtcyk7XG4gICAgICAgIGV2YWx1YXRlS2V5KCh2YWx1ZTIpID0+IGtleXMucHVzaCh2YWx1ZTIpLCB7IHNjb3BlOiB7IGluZGV4OiBrZXksIC4uLnNjb3BlMiB9IH0pO1xuICAgICAgICBzY29wZXMucHVzaChzY29wZTIpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHNjb3BlMiA9IGdldEl0ZXJhdGlvblNjb3BlVmFyaWFibGVzKGl0ZXJhdG9yTmFtZXMsIGl0ZW1zW2ldLCBpLCBpdGVtcyk7XG4gICAgICAgIGV2YWx1YXRlS2V5KCh2YWx1ZSkgPT4ga2V5cy5wdXNoKHZhbHVlKSwgeyBzY29wZTogeyBpbmRleDogaSwgLi4uc2NvcGUyIH0gfSk7XG4gICAgICAgIHNjb3Blcy5wdXNoKHNjb3BlMik7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBhZGRzID0gW107XG4gICAgbGV0IG1vdmVzID0gW107XG4gICAgbGV0IHJlbW92ZXMgPSBbXTtcbiAgICBsZXQgc2FtZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZXZLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQga2V5ID0gcHJldktleXNbaV07XG4gICAgICBpZiAoa2V5cy5pbmRleE9mKGtleSkgPT09IC0xKVxuICAgICAgICByZW1vdmVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcHJldktleXMgPSBwcmV2S2V5cy5maWx0ZXIoKGtleSkgPT4gIXJlbW92ZXMuaW5jbHVkZXMoa2V5KSk7XG4gICAgbGV0IGxhc3RLZXkgPSBcInRlbXBsYXRlXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQga2V5ID0ga2V5c1tpXTtcbiAgICAgIGxldCBwcmV2SW5kZXggPSBwcmV2S2V5cy5pbmRleE9mKGtleSk7XG4gICAgICBpZiAocHJldkluZGV4ID09PSAtMSkge1xuICAgICAgICBwcmV2S2V5cy5zcGxpY2UoaSwgMCwga2V5KTtcbiAgICAgICAgYWRkcy5wdXNoKFtsYXN0S2V5LCBpXSk7XG4gICAgICB9IGVsc2UgaWYgKHByZXZJbmRleCAhPT0gaSkge1xuICAgICAgICBsZXQga2V5SW5TcG90ID0gcHJldktleXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICBsZXQga2V5Rm9yU3BvdCA9IHByZXZLZXlzLnNwbGljZShwcmV2SW5kZXggLSAxLCAxKVswXTtcbiAgICAgICAgcHJldktleXMuc3BsaWNlKGksIDAsIGtleUZvclNwb3QpO1xuICAgICAgICBwcmV2S2V5cy5zcGxpY2UocHJldkluZGV4LCAwLCBrZXlJblNwb3QpO1xuICAgICAgICBtb3Zlcy5wdXNoKFtrZXlJblNwb3QsIGtleUZvclNwb3RdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNhbWVzLnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICAgIGxhc3RLZXkgPSBrZXk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVtb3Zlcy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGtleSA9IHJlbW92ZXNbaV07XG4gICAgICBpZiAoISFsb29rdXBba2V5XS5feF9lZmZlY3RzKSB7XG4gICAgICAgIGxvb2t1cFtrZXldLl94X2VmZmVjdHMuZm9yRWFjaChkZXF1ZXVlSm9iKTtcbiAgICAgIH1cbiAgICAgIGxvb2t1cFtrZXldLnJlbW92ZSgpO1xuICAgICAgbG9va3VwW2tleV0gPSBudWxsO1xuICAgICAgZGVsZXRlIGxvb2t1cFtrZXldO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgW2tleUluU3BvdCwga2V5Rm9yU3BvdF0gPSBtb3Zlc1tpXTtcbiAgICAgIGxldCBlbEluU3BvdCA9IGxvb2t1cFtrZXlJblNwb3RdO1xuICAgICAgbGV0IGVsRm9yU3BvdCA9IGxvb2t1cFtrZXlGb3JTcG90XTtcbiAgICAgIGxldCBtYXJrZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICAgICAgaWYgKCFlbEZvclNwb3QpXG4gICAgICAgICAgd2FybihgeC1mb3IgXCI6a2V5XCIgaXMgdW5kZWZpbmVkIG9yIGludmFsaWRgLCB0ZW1wbGF0ZUVsKTtcbiAgICAgICAgZWxGb3JTcG90LmFmdGVyKG1hcmtlcik7XG4gICAgICAgIGVsSW5TcG90LmFmdGVyKGVsRm9yU3BvdCk7XG4gICAgICAgIGVsRm9yU3BvdC5feF9jdXJyZW50SWZFbCAmJiBlbEZvclNwb3QuYWZ0ZXIoZWxGb3JTcG90Ll94X2N1cnJlbnRJZkVsKTtcbiAgICAgICAgbWFya2VyLmJlZm9yZShlbEluU3BvdCk7XG4gICAgICAgIGVsSW5TcG90Ll94X2N1cnJlbnRJZkVsICYmIGVsSW5TcG90LmFmdGVyKGVsSW5TcG90Ll94X2N1cnJlbnRJZkVsKTtcbiAgICAgICAgbWFya2VyLnJlbW92ZSgpO1xuICAgICAgfSk7XG4gICAgICBlbEZvclNwb3QuX3hfcmVmcmVzaFhGb3JTY29wZShzY29wZXNba2V5cy5pbmRleE9mKGtleUZvclNwb3QpXSk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWRkcy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IFtsYXN0S2V5MiwgaW5kZXhdID0gYWRkc1tpXTtcbiAgICAgIGxldCBsYXN0RWwgPSBsYXN0S2V5MiA9PT0gXCJ0ZW1wbGF0ZVwiID8gdGVtcGxhdGVFbCA6IGxvb2t1cFtsYXN0S2V5Ml07XG4gICAgICBpZiAobGFzdEVsLl94X2N1cnJlbnRJZkVsKVxuICAgICAgICBsYXN0RWwgPSBsYXN0RWwuX3hfY3VycmVudElmRWw7XG4gICAgICBsZXQgc2NvcGUyID0gc2NvcGVzW2luZGV4XTtcbiAgICAgIGxldCBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgIGxldCBjbG9uZTIgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlRWwuY29udGVudCwgdHJ1ZSkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICBsZXQgcmVhY3RpdmVTY29wZSA9IHJlYWN0aXZlKHNjb3BlMik7XG4gICAgICBhZGRTY29wZVRvTm9kZShjbG9uZTIsIHJlYWN0aXZlU2NvcGUsIHRlbXBsYXRlRWwpO1xuICAgICAgY2xvbmUyLl94X3JlZnJlc2hYRm9yU2NvcGUgPSAobmV3U2NvcGUpID0+IHtcbiAgICAgICAgT2JqZWN0LmVudHJpZXMobmV3U2NvcGUpLmZvckVhY2goKFtrZXkyLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICByZWFjdGl2ZVNjb3BlW2tleTJdID0gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIG11dGF0ZURvbSgoKSA9PiB7XG4gICAgICAgIGxhc3RFbC5hZnRlcihjbG9uZTIpO1xuICAgICAgICBpbml0VHJlZShjbG9uZTIpO1xuICAgICAgfSk7XG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICB3YXJuKFwieC1mb3Iga2V5IGNhbm5vdCBiZSBhbiBvYmplY3QsIGl0IG11c3QgYmUgYSBzdHJpbmcgb3IgYW4gaW50ZWdlclwiLCB0ZW1wbGF0ZUVsKTtcbiAgICAgIH1cbiAgICAgIGxvb2t1cFtrZXldID0gY2xvbmUyO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsb29rdXBbc2FtZXNbaV1dLl94X3JlZnJlc2hYRm9yU2NvcGUoc2NvcGVzW2tleXMuaW5kZXhPZihzYW1lc1tpXSldKTtcbiAgICB9XG4gICAgdGVtcGxhdGVFbC5feF9wcmV2S2V5cyA9IGtleXM7XG4gIH0pO1xufVxuZnVuY3Rpb24gcGFyc2VGb3JFeHByZXNzaW9uKGV4cHJlc3Npb24pIHtcbiAgbGV0IGZvckl0ZXJhdG9yUkUgPSAvLChbXixcXH1cXF1dKikoPzosKFteLFxcfVxcXV0qKSk/JC87XG4gIGxldCBzdHJpcFBhcmVuc1JFID0gL15cXHMqXFwofFxcKVxccyokL2c7XG4gIGxldCBmb3JBbGlhc1JFID0gLyhbXFxzXFxTXSo/KVxccysoPzppbnxvZilcXHMrKFtcXHNcXFNdKikvO1xuICBsZXQgaW5NYXRjaCA9IGV4cHJlc3Npb24ubWF0Y2goZm9yQWxpYXNSRSk7XG4gIGlmICghaW5NYXRjaClcbiAgICByZXR1cm47XG4gIGxldCByZXMgPSB7fTtcbiAgcmVzLml0ZW1zID0gaW5NYXRjaFsyXS50cmltKCk7XG4gIGxldCBpdGVtID0gaW5NYXRjaFsxXS5yZXBsYWNlKHN0cmlwUGFyZW5zUkUsIFwiXCIpLnRyaW0oKTtcbiAgbGV0IGl0ZXJhdG9yTWF0Y2ggPSBpdGVtLm1hdGNoKGZvckl0ZXJhdG9yUkUpO1xuICBpZiAoaXRlcmF0b3JNYXRjaCkge1xuICAgIHJlcy5pdGVtID0gaXRlbS5yZXBsYWNlKGZvckl0ZXJhdG9yUkUsIFwiXCIpLnRyaW0oKTtcbiAgICByZXMuaW5kZXggPSBpdGVyYXRvck1hdGNoWzFdLnRyaW0oKTtcbiAgICBpZiAoaXRlcmF0b3JNYXRjaFsyXSkge1xuICAgICAgcmVzLmNvbGxlY3Rpb24gPSBpdGVyYXRvck1hdGNoWzJdLnRyaW0oKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzLml0ZW0gPSBpdGVtO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5mdW5jdGlvbiBnZXRJdGVyYXRpb25TY29wZVZhcmlhYmxlcyhpdGVyYXRvck5hbWVzLCBpdGVtLCBpbmRleCwgaXRlbXMpIHtcbiAgbGV0IHNjb3BlVmFyaWFibGVzID0ge307XG4gIGlmICgvXlxcWy4qXFxdJC8udGVzdChpdGVyYXRvck5hbWVzLml0ZW0pICYmIEFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICBsZXQgbmFtZXMgPSBpdGVyYXRvck5hbWVzLml0ZW0ucmVwbGFjZShcIltcIiwgXCJcIikucmVwbGFjZShcIl1cIiwgXCJcIikuc3BsaXQoXCIsXCIpLm1hcCgoaSkgPT4gaS50cmltKCkpO1xuICAgIG5hbWVzLmZvckVhY2goKG5hbWUsIGkpID0+IHtcbiAgICAgIHNjb3BlVmFyaWFibGVzW25hbWVdID0gaXRlbVtpXTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgvXlxcey4qXFx9JC8udGVzdChpdGVyYXRvck5hbWVzLml0ZW0pICYmICFBcnJheS5pc0FycmF5KGl0ZW0pICYmIHR5cGVvZiBpdGVtID09PSBcIm9iamVjdFwiKSB7XG4gICAgbGV0IG5hbWVzID0gaXRlcmF0b3JOYW1lcy5pdGVtLnJlcGxhY2UoXCJ7XCIsIFwiXCIpLnJlcGxhY2UoXCJ9XCIsIFwiXCIpLnNwbGl0KFwiLFwiKS5tYXAoKGkpID0+IGkudHJpbSgpKTtcbiAgICBuYW1lcy5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICBzY29wZVZhcmlhYmxlc1tuYW1lXSA9IGl0ZW1bbmFtZV07XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgc2NvcGVWYXJpYWJsZXNbaXRlcmF0b3JOYW1lcy5pdGVtXSA9IGl0ZW07XG4gIH1cbiAgaWYgKGl0ZXJhdG9yTmFtZXMuaW5kZXgpXG4gICAgc2NvcGVWYXJpYWJsZXNbaXRlcmF0b3JOYW1lcy5pbmRleF0gPSBpbmRleDtcbiAgaWYgKGl0ZXJhdG9yTmFtZXMuY29sbGVjdGlvbilcbiAgICBzY29wZVZhcmlhYmxlc1tpdGVyYXRvck5hbWVzLmNvbGxlY3Rpb25dID0gaXRlbXM7XG4gIHJldHVybiBzY29wZVZhcmlhYmxlcztcbn1cbmZ1bmN0aW9uIGlzTnVtZXJpYzMoc3ViamVjdCkge1xuICByZXR1cm4gIUFycmF5LmlzQXJyYXkoc3ViamVjdCkgJiYgIWlzTmFOKHN1YmplY3QpO1xufVxuXG4vLyBwYWNrYWdlcy9hbHBpbmVqcy9zcmMvZGlyZWN0aXZlcy94LXJlZi5qc1xuZnVuY3Rpb24gaGFuZGxlcjMoKSB7XG59XG5oYW5kbGVyMy5pbmxpbmUgPSAoZWwsIHsgZXhwcmVzc2lvbiB9LCB7IGNsZWFudXA6IGNsZWFudXAyIH0pID0+IHtcbiAgbGV0IHJvb3QgPSBjbG9zZXN0Um9vdChlbCk7XG4gIGlmICghcm9vdC5feF9yZWZzKVxuICAgIHJvb3QuX3hfcmVmcyA9IHt9O1xuICByb290Ll94X3JlZnNbZXhwcmVzc2lvbl0gPSBlbDtcbiAgY2xlYW51cDIoKCkgPT4gZGVsZXRlIHJvb3QuX3hfcmVmc1tleHByZXNzaW9uXSk7XG59O1xuZGlyZWN0aXZlKFwicmVmXCIsIGhhbmRsZXIzKTtcblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2RpcmVjdGl2ZXMveC1pZi5qc1xuZGlyZWN0aXZlKFwiaWZcIiwgKGVsLCB7IGV4cHJlc3Npb24gfSwgeyBlZmZlY3Q6IGVmZmVjdDMsIGNsZWFudXA6IGNsZWFudXAyIH0pID0+IHtcbiAgaWYgKGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPT0gXCJ0ZW1wbGF0ZVwiKVxuICAgIHdhcm4oXCJ4LWlmIGNhbiBvbmx5IGJlIHVzZWQgb24gYSA8dGVtcGxhdGU+IHRhZ1wiLCBlbCk7XG4gIGxldCBldmFsdWF0ZTIgPSBldmFsdWF0ZUxhdGVyKGVsLCBleHByZXNzaW9uKTtcbiAgbGV0IHNob3cgPSAoKSA9PiB7XG4gICAgaWYgKGVsLl94X2N1cnJlbnRJZkVsKVxuICAgICAgcmV0dXJuIGVsLl94X2N1cnJlbnRJZkVsO1xuICAgIGxldCBjbG9uZTIgPSBlbC5jb250ZW50LmNsb25lTm9kZSh0cnVlKS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICBhZGRTY29wZVRvTm9kZShjbG9uZTIsIHt9LCBlbCk7XG4gICAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICAgIGVsLmFmdGVyKGNsb25lMik7XG4gICAgICBpbml0VHJlZShjbG9uZTIpO1xuICAgIH0pO1xuICAgIGVsLl94X2N1cnJlbnRJZkVsID0gY2xvbmUyO1xuICAgIGVsLl94X3VuZG9JZiA9ICgpID0+IHtcbiAgICAgIHdhbGsoY2xvbmUyLCAobm9kZSkgPT4ge1xuICAgICAgICBpZiAoISFub2RlLl94X2VmZmVjdHMpIHtcbiAgICAgICAgICBub2RlLl94X2VmZmVjdHMuZm9yRWFjaChkZXF1ZXVlSm9iKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBjbG9uZTIucmVtb3ZlKCk7XG4gICAgICBkZWxldGUgZWwuX3hfY3VycmVudElmRWw7XG4gICAgfTtcbiAgICByZXR1cm4gY2xvbmUyO1xuICB9O1xuICBsZXQgaGlkZSA9ICgpID0+IHtcbiAgICBpZiAoIWVsLl94X3VuZG9JZilcbiAgICAgIHJldHVybjtcbiAgICBlbC5feF91bmRvSWYoKTtcbiAgICBkZWxldGUgZWwuX3hfdW5kb0lmO1xuICB9O1xuICBlZmZlY3QzKCgpID0+IGV2YWx1YXRlMigodmFsdWUpID0+IHtcbiAgICB2YWx1ZSA/IHNob3coKSA6IGhpZGUoKTtcbiAgfSkpO1xuICBjbGVhbnVwMigoKSA9PiBlbC5feF91bmRvSWYgJiYgZWwuX3hfdW5kb0lmKCkpO1xufSk7XG5cbi8vIHBhY2thZ2VzL2FscGluZWpzL3NyYy9kaXJlY3RpdmVzL3gtaWQuanNcbmRpcmVjdGl2ZShcImlkXCIsIChlbCwgeyBleHByZXNzaW9uIH0sIHsgZXZhbHVhdGU6IGV2YWx1YXRlMiB9KSA9PiB7XG4gIGxldCBuYW1lcyA9IGV2YWx1YXRlMihleHByZXNzaW9uKTtcbiAgbmFtZXMuZm9yRWFjaCgobmFtZSkgPT4gc2V0SWRSb290KGVsLCBuYW1lKSk7XG59KTtcblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2RpcmVjdGl2ZXMveC1vbi5qc1xubWFwQXR0cmlidXRlcyhzdGFydGluZ1dpdGgoXCJAXCIsIGludG8ocHJlZml4KFwib246XCIpKSkpO1xuZGlyZWN0aXZlKFwib25cIiwgc2tpcER1cmluZ0Nsb25lKChlbCwgeyB2YWx1ZSwgbW9kaWZpZXJzLCBleHByZXNzaW9uIH0sIHsgY2xlYW51cDogY2xlYW51cDIgfSkgPT4ge1xuICBsZXQgZXZhbHVhdGUyID0gZXhwcmVzc2lvbiA/IGV2YWx1YXRlTGF0ZXIoZWwsIGV4cHJlc3Npb24pIDogKCkgPT4ge1xuICB9O1xuICBpZiAoZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcInRlbXBsYXRlXCIpIHtcbiAgICBpZiAoIWVsLl94X2ZvcndhcmRFdmVudHMpXG4gICAgICBlbC5feF9mb3J3YXJkRXZlbnRzID0gW107XG4gICAgaWYgKCFlbC5feF9mb3J3YXJkRXZlbnRzLmluY2x1ZGVzKHZhbHVlKSlcbiAgICAgIGVsLl94X2ZvcndhcmRFdmVudHMucHVzaCh2YWx1ZSk7XG4gIH1cbiAgbGV0IHJlbW92ZUxpc3RlbmVyID0gb24oZWwsIHZhbHVlLCBtb2RpZmllcnMsIChlKSA9PiB7XG4gICAgZXZhbHVhdGUyKCgpID0+IHtcbiAgICB9LCB7IHNjb3BlOiB7IFwiJGV2ZW50XCI6IGUgfSwgcGFyYW1zOiBbZV0gfSk7XG4gIH0pO1xuICBjbGVhbnVwMigoKSA9PiByZW1vdmVMaXN0ZW5lcigpKTtcbn0pKTtcblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2RpcmVjdGl2ZXMvaW5kZXguanNcbndhcm5NaXNzaW5nUGx1Z2luRGlyZWN0aXZlKFwiQ29sbGFwc2VcIiwgXCJjb2xsYXBzZVwiLCBcImNvbGxhcHNlXCIpO1xud2Fybk1pc3NpbmdQbHVnaW5EaXJlY3RpdmUoXCJJbnRlcnNlY3RcIiwgXCJpbnRlcnNlY3RcIiwgXCJpbnRlcnNlY3RcIik7XG53YXJuTWlzc2luZ1BsdWdpbkRpcmVjdGl2ZShcIkZvY3VzXCIsIFwidHJhcFwiLCBcImZvY3VzXCIpO1xud2Fybk1pc3NpbmdQbHVnaW5EaXJlY3RpdmUoXCJNYXNrXCIsIFwibWFza1wiLCBcIm1hc2tcIik7XG5mdW5jdGlvbiB3YXJuTWlzc2luZ1BsdWdpbkRpcmVjdGl2ZShuYW1lLCBkaXJlY3RpdmVOYW1lLCBzbHVnKSB7XG4gIGRpcmVjdGl2ZShkaXJlY3RpdmVOYW1lLCAoZWwpID0+IHdhcm4oYFlvdSBjYW4ndCB1c2UgW3gtJHtkaXJlY3RpdmVOYW1lfV0gd2l0aG91dCBmaXJzdCBpbnN0YWxsaW5nIHRoZSBcIiR7bmFtZX1cIiBwbHVnaW4gaGVyZTogaHR0cHM6Ly9hbHBpbmVqcy5kZXYvcGx1Z2lucy8ke3NsdWd9YCwgZWwpKTtcbn1cblxuLy8gcGFja2FnZXMvYWxwaW5lanMvc3JjL2luZGV4LmpzXG5hbHBpbmVfZGVmYXVsdC5zZXRFdmFsdWF0b3Iobm9ybWFsRXZhbHVhdG9yKTtcbmFscGluZV9kZWZhdWx0LnNldFJlYWN0aXZpdHlFbmdpbmUoeyByZWFjdGl2ZTogcmVhY3RpdmUyLCBlZmZlY3Q6IGVmZmVjdDIsIHJlbGVhc2U6IHN0b3AsIHJhdzogdG9SYXcgfSk7XG52YXIgc3JjX2RlZmF1bHQgPSBhbHBpbmVfZGVmYXVsdDtcblxuLy8gcGFja2FnZXMvYWxwaW5lanMvYnVpbGRzL21vZHVsZS5qc1xudmFyIG1vZHVsZV9kZWZhdWx0ID0gc3JjX2RlZmF1bHQ7XG5leHBvcnQge1xuICBtb2R1bGVfZGVmYXVsdCBhcyBkZWZhdWx0XG59O1xuIiwgImV4cG9ydCBkZWZhdWx0ICgpID0+ICh7XG4gIGluaXQoKSB7fSxcbiAgZGVzdHJveSgpIHt9LFxuICBkYjoge1xuICAgIFwiaWNvbnNcIjogW1xuICAgICAgXCJzY29vdGVyLnBuZ1wiLFxuICAgICAgXCJtb3RvcmN5Y2xlLnBuZ1wiLFxuICAgICAgXCJjYXIucG5nXCIsXG4gICAgICBcInRydWNrLnBuZ1wiLFxuICAgICAgXCJzcG9ydC5wbmdcIixcbiAgICAgIFwiZ3VuLnBuZ1wiLFxuICAgICAgXCJhaXJjcmFmdC5wbmdcIixcbiAgICAgIG51bGxcbiAgICBdLFxuICAgIFwiQ2VydGlmaWNhdGlcIiA6IHtcbiAgICAgIFwiUGF0ZW50ZSBDSUdcIjoge1xuICAgICAgICBcIkNvbnNlZ3VpbWVudG9cIjogXCI8cD5QZXIgaWwgY2VydGlmaWNhdG8gbWVkaWNvIGRpIGlkb25laXRcdTAwRTAgcHNpY29maXNpY2EgZmluYWxpenphdG8gYWwgY29uc2VndWltZW50byBkZWxsYSBwYXRlbnRlIENJRyBvY2NvcnJlIGNoZSBsJ2ludGVyZXNzYXRvIHZlbmdhIGEgdmlzaXRhIG1lZGljYSBtdW5pdG8gZGk6PC9wPjx1bCBjbGFzcz0nbXktNiBsaXN0LWRpc2MgbGlzdC1pbnNpZGUnPjxsaT5kb2N1bWVudG8gZCdpZGVudGl0XHUwMEUwIGluIGNvcnNvIGRpIHZhbGlkaXRcdTAwRTA7PC9saT48bGk+Y2VydGlmaWNhdG8gbWVkaWNvIGFuYW1uZXN0aWNvIHJpbGFzY2lhdG8gZGFsIHByb3ByaW8gbWVkaWNvIGRpIGZhbWlnbGlhOzwvbGk+PGxpPm5yLiAzIGZvdG8tdGVzc2VyZSByZWNlbnRpOzwvbGk+PGxpPjEgbWFyY2EgZGEgYm9sbG8gZGkgXHUyMEFDIDE2LDAwOzwvbGk+PGxpPm9jY2hpYWxpIG8gbGVudGkgYSBjb250YXR0byBzZSBuZWNlc3NhcmlvOzwvbGk+PC91bD48cCBjbGFzcz0nbXQtMyc+PHNwYW4gY2xhc3M9J2ZvbnQtYm9sZCc+QXR0ZW56aW9uZSE8L3NwYW4+IFNlIGwnaW50ZXJlc3NhdG8gXHUwMEU4IG1pbm9yZW5uZSBkb3ZyXHUwMEUwIGVzc2VyZSBhY2NvbXBhZ25hdG8gZGEgdW4gZ2VuaXRvcmUuPC9wPlwiLFxuICAgICAgICBcIlJpbm5vdm9cIjogXCI8cD5QZXIgaWwgcmlsYXNjaW8gZGVsIGNlcnRpZmljYXRvIG1lZGljbyB1dGlsZSBhbCByaW5ub3ZvIGRlbGxhIHBhdGVudGUgZGkgZ3VpZGEsIG9jY29ycmUgY2hlIGwnaW50ZXJlc3NhdG8gdmVuZ2EgYSB2aXNpdGEgbWVkaWNhIG11bml0byBkaTo8L3A+PHVsIGNsYXNzPSdteS02IGxpc3QtZGlzYyBsaXN0LWluc2lkZSc+PGxpPmRvY3VtZW50byBkJ2lkZW50aXRcdTAwRTAgaW4gY29yc28gZGkgdmFsaWRpdFx1MDBFMDs8L2xpPjxsaT51bmEgZm90by10ZXNzZXJhIHJlY2VudGU7PC9saT48bGk+b2NjaGlhbGkgbyBsZW50aSBhIGNvbnRhdHRvIHNlIG5lY2Vzc2FyaW87PC9saT48L3VsPjxwPlBlciBsJ2VmZmV0dHVhemlvbmUgZGVsbGEgcHJhdGljYSwgbm9uIFx1MDBFOCBwaVx1MDBGOSBuZWNlc3NpYXJpbyBjaGUgbCdpbnRlcmVzc2F0byBhY3F1aXN0aSBsYSBtYXJjYSBkYSBib2xsbyBkYSBcdTIwQUMgMTYsMDAsIGluIHF1YW50byBxdWVzdGEgXHUwMEU4IHN0YXRhIHNvc3RpdHVpdGEgY29uIHVuIGJvbGxldHRpbm8gcG9zdGFsZSBkaSBwYXJpIGltcG9ydG8uIExvIHN0dWRpbyBtZWRpY28gaGEgZ2lcdTAwRTAgYSBkaXNwb3NpemlvbmUgaSBib2xsZXR0aW5pIHByZS1wYWdhdGkgZGkgXHUyMEFDIDE2LDAwICgrIFx1MjBBQyAxLDgwIGRpIHRhc3NlIHBvc3RhbGkpIGUgXHUyMEFDIDksMDAgXHUyMEFDICgrIFx1MjBBQyAxLDgwIGRpIHRhc3NlIHBvc3RhbGkpLjwvcD48cD5UcmFtaXRlIGlsIGNvbGxlZ2FtZW50byBpbiB0ZW1wbyByZWFsZSBjb24gaWwgUG9ydGFsZSBkZWxsJ0F1dG9tb2JpbGlzdGEsIGlsIHNhbml0YXJpbyByaWxhc2Nlclx1MDBFMCBhbGwnaW50ZXJlc3NhdG8gbGEgcmljZXZ1dGEgZGVsbCdhdnZlbnV0byByaW5ub3ZvIGUsIGRvcG8gcG9jaGkgZ2lvcm5pLCBsYSBwYXRlbnRlIGRpIGd1aWRhIHNhclx1MDBFMCByZWNhcGl0YXRhIHBlciBwb3N0YSBhc3NpY3VyYXRhLjwvcD48cCBjbGFzcz0nbXQtMyc+PHNwYW4gY2xhc3M9J2ZvbnQtYm9sZCc+QXR0ZW56aW9uZSE8L3NwYW4+IFNlIGwnaW50ZXJlc3NhdG8gXHUwMEU4IG1pbm9yZW5uZSBkb3ZyXHUwMEUwIGVzc2VyZSBhY2NvbXBhZ25hdG8gZGEgdW4gZ2VuaXRvcmUuPC9wPlwiLFxuICAgICAgICBcIkR1cGxpY2F0byBkb2N1bWVudG9cIjogXCI8cD5OZWwgY2FzbyBjaGUgbCdpbnRlcmVzc2F0byBuZWNlc3NpdGkgZGkgZWZmZXR0dWFyZSB1biBkdXBsaWNhdG8gZGVsbGEgcHJvcHJpYSBwYXRlbnRlIGRpIGd1aWRhIChvIHBlciBzbWFycmltZW50byBvIHBlciBkZXRlcmlvcmFtZW50bykgcG90clx1MDBFMCBlZmZldHR1YXJlIHByZXNzbyBpbCBub3N0cm8gc3R1ZGlvIGxhIHZpc2l0YSBwZXIgaWwgcmlsYXNjaW8gZGVsIGNlcnRpZmljYXRvIG1lZGljbyB1dGlsZSBhbGxhIHByYXRpY2EuIEwnaW50ZXJlc3NhdG8gZG92clx1MDBFMCB2ZW5pcmUgbXVuaXRvIGRpOjwvcD48dWwgY2xhc3M9J215LTYgbGlzdC1kaXNjIGxpc3QtaW5zaWRlJz48bGk+ZG9jdW1lbnRvIGQnaWRlbnRpdFx1MDBFMCBpbiBjb3JzbyBkaSB2YWxpZGl0XHUwMEUwOzwvbGk+PGxpPnVuYSBtYXJjYSBkYSBib2xsbyBkaSBcdTIwQUMgMTYuMDA7PC9saT48bGk+bnIuIDMgZm90by10ZXNzZXJlIHJlY2VudGk7PC9saT48bGk+b2NjaGlhbGkgbyBsZW50aSBhIGNvbnRhdHRvIHNlIG5lY2Vzc2FyaW87PC9saT48L3VsPjxwIGNsYXNzPSdtdC0zJz48c3BhbiBjbGFzcz0nZm9udC1ib2xkJz5BdHRlbnppb25lITwvc3Bhbj4gU2UgbCdpbnRlcmVzc2F0byBcdTAwRTggbWlub3Jlbm5lIGRvdnJcdTAwRTAgZXNzZXJlIGFjY29tcGFnbmF0byBkYSB1biBnZW5pdG9yZS48L3A+XCJcbiAgICAgIH0sXG4gICAgICBcIlBhdGVudGUgQVwiOiB7XG4gICAgICAgIFwiQ29uc2VndWltZW50b1wiOiBcIjxwPlBlciBpbCBjZXJ0aWZpY2F0byBtZWRpY28gZGkgaWRvbmVpdFx1MDBFMCBwc2ljb2Zpc2ljYSBhbCBjb25zZWd1aW1lbnRvIGRlbGxhIHBhdGVudGUgQSBvY2NvcnJlIGNoZSBsJ2ludGVyZXNzYXRvIHZlbmdhIGEgdmlzaXRhIG1lZGljYSBtdW5pdG8gZGk6PC9wPjx1bCBjbGFzcz0nbXktNiBsaXN0LWRpc2MgbGlzdC1pbnNpZGUnPjxsaT5kb2N1bWVudG8gZCdpZGVudGl0XHUwMEUwIGluIGNvcnNvIGRpIHZhbGlkaXRcdTAwRTA7PC9saT48bGk+IGNlcnRpZmljYXRvIG1lZGljbyBhbmFtbmVzdGljbyByaWxhc2NpYXRvIGRhbCBwcm9wcmlvIG1lZGljbyBkaSBmYW1pZ2xpYTs8L2xpPjxsaT5uci4gMyBmb3RvLXRlc3NlcmUgcmVjZW50aTs8L2xpPjxsaT51bmEgbWFyY2EgZGEgYm9sbG8gZGkgXHUyMEFDIDE2LDAwOzwvbGk+PGxpPm9jY2hpYWxpIG8gbGVudGkgYSBjb250YXR0byBzZSBuZWNlc3NhcmlvLjwvbGk+PC91bD5cIixcbiAgICAgICAgXCJSaW5ub3ZvXCI6IFwiPHA+UGVyIGlsIHJpbGFzY2lvIGRlbCBjZXJ0aWZpY2F0byBtZWRpY28gdXRpbGUgYWwgcmlubm92byBkZWxsYSBwYXRlbnRlIGRpIGd1aWRhLCBvY2NvcnJlIGNoZSBsJ2ludGVyZXNzYXRvIHZlbmdhIGEgdmlzaXRhIG1lZGljYSBtdW5pdG8gZGk6PC9wPjx1bCBjbGFzcz0nbXktNiBsaXN0LWRpc2MgbGlzdC1pbnNpZGUnPjxsaT5kb2N1bWVudG8gZCdpZGVudGl0XHUwMEUwIGluIGNvcnNvIGRpIHZhbGlkaXRcdTAwRTA7PC9saT48bGk+dW5hIGZvdG8tdGVzc2VyYSByZWNlbnRlOzwvbGk+PGxpPm9jY2hpYWxpIG8gbGVudGkgYSBjb250YXR0byBzZSBuZWNlc3NhcmlvLjwvbGk+PC91bD48cD5QZXIgbCdlZmZldHR1YXppb25lIGRlbGxhIHByYXRpY2EsIG5vbiBuZWNlc3NpdGEgcGlcdTAwRjkgY2hlIGwnaW50ZXJlc3NhdG8gYWNxdWlzdGkgbGEgbWFyY2EgZGEgYm9sbG8gZGEgXHUyMEFDIDE2LDAwLCBpbiBxdWFudG8gcXVlc3RhIFx1MDBFOCBzdGF0YSBzb3N0aXR1aXRhIGRhbGxhIG5vcm1hdGl2YSBjb24gdW4gYm9sbGV0dGlubyBwb3N0YWxlIGRpIHBhcmkgaW1wb3J0by4gTG8gc3R1ZGlvIG1lZGljbyBoYSBnaVx1MDBFMCBhIGRpc3Bvc2l6aW9uZSBpIGJvbGxldHRpbmkgcHJlLXBhZ2F0aSBkaSBcdTIwQUMgMTYsMDAgKCsgXHUyMEFDIDEsODAgZGkgdGFzc2UgcG9zdGFsaSkgZSBcdTIwQUMgOSwwMCBcdTIwQUMgKCsgXHUyMEFDIDEsODAgZGkgdGFzc2UgcG9zdGFsaSkuIFRyYW1pdGUgaWwgY29sbGVnYW1lbnRvIGluIHRlbXBvIHJlYWxlIGNvbiBpbCBQb3J0YWxlIGRlbGwnQXV0b21vYmlsaXN0YSwgaWwgc2FuaXRhcmlvIHJpbGFzY2VyXHUwMEUwIGFsbCdpbnRlcmVzc2F0byBsYSByaWNldnV0YSBkZWxsJ2F2dmVudXRvIHJpbm5vdm8gZSwgZG9wbyBwb2NoaSBnaW9ybmksIGxhIHBhdGVudGUgZGkgZ3VpZGEgc2FyXHUwMEUwIHJlY2FwaXRhdGEgcGVyIHBvc3RhIGFzc2ljdXJhdGEuPC9wPjxwPkNvbiBpbCBzb2xvIHBhZ2FtZW50byBkZWwgY2VydGlmaWNhdG8gbWVkaWNvIChzZW56YSBzcGVzZSBhZ2dpdW50aXZlKSBsYSBwcmF0aWNhIHBlciBpbCByaW5ub3ZvIGRlbGxhIHBhdGVudGUgXHUwMEU4IGRhIGNvbnNpZGVyYXJzaSBjb25jbHVzYSwgc2VuemEgY2hlIGwnaW50ZXJlc3NhdG8gZGViYmEgcmVjYXJzaSBwcmVzc28gYWdlbnppZSBlL28gYXV0b3NjdW9sZS48L3A+XCIsXG4gICAgICAgIFwiZHVwbGljYXRvXCI6IFwiPHA+TmVsIGNhc28gY2hlIGwnaW50ZXJlc3NhdG8gbmVjZXNzaXRpIGRpIGVmZmV0dHVhcmUgdW4gZHVwbGljYXRvIGRlbGxhIHByb3ByaWEgcGF0ZW50ZSBkaSBndWlkYSAobyBwZXIgc21hcnJpbWVudG8gbyBwZXIgZGV0ZXJpb3JhbWVudG8pIHBvdHJcdTAwRTAgZWZmZXR0dWFyZSBwcmVzc28gaWwgbm9zdHJvIHN0dWRpbyBsYSB2aXNpdGEgcGVyIGlsIHJpbGFzY2lvIGRlbCBjZXJ0aWZpY2F0byBtZWRpY28gdXRpbGUgYWxsYSBwcmF0aWNhLiBMJ2ludGVyZXNzYXRvIGRvdnJcdTAwRTAgdmVuaXJlIG11bml0byBkaTo8L3A+PHVsIGNsYXNzPSdteS02IGxpc3QtZGlzYyBsaXN0LWluc2lkZSc+PGxpPmRvY3VtZW50byBkJ2lkZW50aXRcdTAwRTAgaW4gY29yc28gZGkgdmFsaWRpdFx1MDBFMDs8L2xpPjxsaT51bmEgbWFyY2EgZGEgYm9sbG8gZGkgXHUyMEFDIDE2LjAwOzwvbGk+PGxpPm5yLiAzIGZvdG8tdGVzc2VyZSByZWNlbnRpOzwvbGk+PGxpPm9jY2hpYWxpIG8gbGVudGkgYSBjb250YXR0byBzZSBuZWNlc3NhcmlvLjwvbGk+PC91bD5cIlxuICAgICAgfSxcbiAgICAgIFwiUGF0ZW50ZSBCXCI6IHtcbiAgICAgICAgXCJDb25zZWd1aW1lbnRvXCI6IFwiPHA+UGVyIGlsIGNlcnRpZmljYXRvIG1lZGljbyBkaSBpZG9uZWl0XHUwMEUwIHBzaWNvZmlzaWNhIGFsIGNvbnNlZ3VpbWVudG8gZGVsbGEgcGF0ZW50ZSBCIG9jY29ycmUgY2hlIGwnaW50ZXJlc3NhdG8gdmVuZ2EgYSB2aXNpdGEgbWVkaWNhIG11bml0byBkaTo8L3A+PHVsIGNsYXNzPSdteS02IGxpc3QtZGlzYyBsaXN0LWluc2lkZSc+PGxpPmRvY3VtZW50byBkJ2lkZW50aXRcdTAwRTAgaW4gY29yc28gZGkgdmFsaWRpdFx1MDBFMDs8L2xpPjxsaT5jZXJ0aWZpY2F0byBtZWRpY28gYW5hbW5lc3RpY28gcmlsYXNjaWF0byBkYWwgcHJvcHJpbyBtZWRpY28gZGkgZmFtaWdsaWE7PC9saT48bGk+bnIuIDMgZm90by10ZXNzZXJlIHJlY2VudGk7IHVuYSBtYXJjYSBkYSBib2xsbyBkaSBcdTIwQUMgMTYsMDA7PC9saT48bGk+b2NjaGlhbGkgbyBsZW50aSBhIGNvbnRhdHRvIHNlIG5lY2Vzc2FyaW8uPC9saT48L3VsPlwiLFxuICAgICAgICBcIlJpbm5vdm9cIjogXCI8cD5QZXIgaWwgcmlsYXNjaW8gZGVsIGNlcnRpZmljYXRvIG1lZGljbyB1dGlsZSBhbCByaW5ub3ZvIGRlbGxhIHBhdGVudGUgZGkgZ3VpZGEsIG9jY29ycmUgY2hlIGwnaW50ZXJlc3NhdG8gdmVuZ2EgYSB2aXNpdGEgbWVkaWNhIG11bml0byBkaTo8L3A+PHVsIGNsYXNzPSdteS02IGxpc3QtZGlzYyBsaXN0LWluc2lkZSc+PGxpPmRvY3VtZW50byBkJ2lkZW50aXRcdTAwRTAgaW4gY29yc28gZGkgdmFsaWRpdFx1MDBFMDs8L2xpPjxsaT51bmEgZm90by10ZXNzZXJhIHJlY2VudGU7PC9saT48bGk+b2NjaGlhbGkgbyBsZW50aSBhIGNvbnRhdHRvIHNlIG5lY2Vzc2FyaW8uPC9saT48L3VsPjxwPlBlciBsJ2VmZmV0dHVhemlvbmUgZGVsbGEgcHJhdGljYSwgbm9uIG5lY2Vzc2l0YSBwaVx1MDBGOSBjaGUgbCdpbnRlcmVzc2F0byBhY3F1aXN0aSBsYSBtYXJjYSBkYSBib2xsbyBkYSBcdTIwQUMgMTYsMDAsIGluIHF1YW50byBxdWVzdGEgXHUwMEU4IHN0YXRhIHNvc3RpdHVpdGEgZGFsbGEgbm9ybWF0aXZhIGNvbiB1biBib2xsZXR0aW5vIHBvc3RhbGUgZGkgcGFyaSBpbXBvcnRvLiBMbyBzdHVkaW8gbWVkaWNvIGhhIGdpXHUwMEUwIGEgZGlzcG9zaXppb25lIGkgYm9sbGV0dGluaSBwcmUtcGFnYXRpIGRpIFx1MjBBQyAxNiwwMCAoKyBcdTIwQUMgMSw4MCBkaSB0YXNzZSBwb3N0YWxpKSBlIFx1MjBBQyA5LDAwIFx1MjBBQyAoKyBcdTIwQUMgMSw4MCBkaSB0YXNzZSBwb3N0YWxpKS4gVHJhbWl0ZSBpbCBjb2xsZWdhbWVudG8gaW4gdGVtcG8gcmVhbGUgY29uIGlsIFBvcnRhbGUgZGVsbCdBdXRvbW9iaWxpc3RhLCBpbCBzYW5pdGFyaW8gcmlsYXNjZXJcdTAwRTAgYWxsJ2ludGVyZXNzYXRvIGxhIHJpY2V2dXRhIGRlbGwnYXZ2ZW51dG8gcmlubm92byBlLCBkb3BvIHBvY2hpIGdpb3JuaSwgbGEgcGF0ZW50ZSBkaSBndWlkYSBzYXJcdTAwRTAgcmVjYXBpdGF0YSBwZXIgcG9zdGEgYXNzaWN1cmF0YS48L3A+PHA+Q29uIGlsIHNvbG8gcGFnYW1lbnRvIGRlbCBjZXJ0aWZpY2F0byBtZWRpY28gKHNlbnphIHNwZXNlIGFnZ2l1bnRpdmUpIGxhIHByYXRpY2EgcGVyIGlsIHJpbm5vdm8gZGVsbGEgcGF0ZW50ZSBcdTAwRTggZGEgY29uc2lkZXJhcnNpIGNvbmNsdXNhLCBzZW56YSBjaGUgbCdpbnRlcmVzc2F0byBkZWJiYSByZWNhcnNpIHByZXNzbyBhZ2VuemllIGUvbyBhdXRvc2N1b2xlLjwvcD5cIixcbiAgICAgICAgXCJkdXBsaWNhdG9cIjpcIjxwPk5lbCBjYXNvIGNoZSBsJ2ludGVyZXNzYXRvIG5lY2Vzc2l0aSBkaSBlZmZldHR1YXJlIHVuIGR1cGxpY2F0byBkZWxsYSBwcm9wcmlhIHBhdGVudGUgZGkgZ3VpZGEgKG8gcGVyIHNtYXJyaW1lbnRvIG8gcGVyIGRldGVyaW9yYW1lbnRvKSBwb3RyXHUwMEUwIGVmZmV0dHVhcmUgcHJlc3NvIGlsIG5vc3RybyBzdHVkaW8gbGEgdmlzaXRhIHBlciBpbCByaWxhc2NpbyBkZWwgY2VydGlmaWNhdG8gbWVkaWNvIHV0aWxlIGFsbGEgcHJhdGljYS4gTCdpbnRlcmVzc2F0byBkb3ZyXHUwMEUwIHZlbmlyZSBtdW5pdG8gZGk6PC9wPjx1bCBjbGFzcz0nbXktNiBsaXN0LWRpc2MgbGlzdC1pbnNpZGUnPjxsaT5kb2N1bWVudG8gZCdpZGVudGl0XHUwMEUwIGluIGNvcnNvIGRpIHZhbGlkaXRcdTAwRTA7PC9saT48bGk+dW5hIG1hcmNhIGRhIGJvbGxvIGRpIFx1MjBBQyAxNi4wMDs8L2xpPjxsaT5uci4gMyBmb3RvLXRlc3NlcmUgcmVjZW50aTs8L2xpPjxsaT5vY2NoaWFsaSBvIGxlbnRpIGEgY29udGF0dG8gc2UgbmVjZXNzYXJpby48L2xpPjwvdWw+XCJcbiAgICAgIH0sXG4gICAgICBcIkFsdHJlIFBhdGVudGlcIjoge1xuICAgICAgICBcIkNvbnNlZ3VpbWVudG9cIjogXCI8cD5QZXIgaWwgY2VydGlmaWNhdG8gbWVkaWNvIGRpIGlkb25laXRcdTAwRTAgcHNpY29maXNpY2EgYWwgY29uc2VndWltZW50byBkZWxsYSBwYXRlbnRlIGRpIGd1aWRhIG9jY29ycmUgY2hlIGwnaW50ZXJlc3NhdG8gdmVuZ2EgYSB2aXNpdGEgbWVkaWNhIG11bml0byBkaTo8L3A+PHVsIGNsYXNzPSdteS02IGxpc3QtZGlzYyBsaXN0LWluc2lkZSc+PGxpPmRvY3VtZW50byBkJ2lkZW50aXRcdTAwRTAgaW4gY29yc28gZGkgdmFsaWRpdFx1MDBFMDs8L2xpPjxsaT5jZXJ0aWZpY2F0byBtZWRpY28gYW5hbW5lc3RpY28gcmlsYXNjaWF0byBkYWwgcHJvcHJpbyBtZWRpY28gZGkgZmFtaWdsaWE7PC9saT48bGk+bnIuIDMgZm90by10ZXNzZXJlIHJlY2VudGk7PC9saT48bGk+dW5hIG1hcmNhIGRhIGJvbGxvIGRpIFx1MjBBQyAxNiwwMDs8L2xpPjxsaT5vY2NoaWFsaSBvIGxlbnRpIGEgY29udGF0dG8gc2UgbmVjZXNzYXJpby48L2xpPjwvdWw+XCIsXG4gICAgICAgIFwiUmlubm92b1wiOiBcIjxwPlBlciBpbCByaWxhc2NpbyBkZWwgY2VydGlmaWNhdG8gbWVkaWNvIHV0aWxlIGFsIHJpbm5vdm8gZGVsbGEgcGF0ZW50ZSBkaSBndWlkYSwgb2Njb3JyZSBjaGUgbCdpbnRlcmVzc2F0byB2ZW5nYSBhIHZpc2l0YSBtZWRpY2EgbXVuaXRvIGRpOjwvcD48dWwgY2xhc3M9J215LTYgbGlzdC1kaXNjIGxpc3QtaW5zaWRlJz48bGk+ZG9jdW1lbnRvIGQnaWRlbnRpdFx1MDBFMCBpbiBjb3JzbyBkaSB2YWxpZGl0XHUwMEUwOzwvbGk+PGxpPnVuYSBmb3RvLXRlc3NlcmEgcmVjZW50ZTs8L2xpPjxsaT5vY2NoaWFsaSBvIGxlbnRpIGEgY29udGF0dG8gc2UgbmVjZXNzYXJpby48L2xpPjwvdWw+PHA+UGVyIGwnZWZmZXR0dWF6aW9uZSBkZWxsYSBwcmF0aWNhLCBub24gbmVjZXNzaXRhIHBpXHUwMEY5IGNoZSBsJ2ludGVyZXNzYXRvIGFjcXVpc3RpIGxhIG1hcmNhIGRhIGJvbGxvIGRhIFx1MjBBQyAxNiwwMCwgaW4gcXVhbnRvIHF1ZXN0YSBcdTAwRTggc3RhdGEgc29zdGl0dWl0YSBkYWxsYSBub3JtYXRpdmEgY29uIHVuIGJvbGxldHRpbm8gcG9zdGFsZSBkaSBwYXJpIGltcG9ydG8uIExvIHN0dWRpbyBtZWRpY28gaGEgZ2lcdTAwRTAgYSBkaXNwb3NpemlvbmUgaSBib2xsZXR0aW5pIHByZS1wYWdhdGkgZGkgXHUyMEFDIDE2LDAwICgrIFx1MjBBQyAxLDgwIGRpIHRhc3NlIHBvc3RhbGkpIGUgXHUyMEFDIDksMDAgXHUyMEFDICgrIFx1MjBBQyAxLDgwIGRpIHRhc3NlIHBvc3RhbGkpLjwvcD48cD5UcmFtaXRlIGlsIGNvbGxlZ2FtZW50byBpbiB0ZW1wbyByZWFsZSBjb24gaWwgUG9ydGFsZSBkZWxsJ0F1dG9tb2JpbGlzdGEsIGlsIHNhbml0YXJpbyByaWxhc2Nlclx1MDBFMCBzdWJpdG8gYWxsJ2ludGVyZXNzYXRvIGxhIHJpY2V2dXRhIGRlbGwnYXZ2ZW51dG8gcmlubm92byBlLCBkb3BvIHBvY2hpIGdpb3JuaSwgcmljZXZlclx1MDBFMCBpbCBkdXBsaWNhdG8gZGVsbGEgcGF0ZW50ZSBkaSBndWlkYSBwZXIgcG9zdGEgYXNzaWN1cmF0YS48L3A+XCIsXG4gICAgICAgIFwiZHVwbGljYXRvXCI6XCI8cD5OZWwgY2FzbyBjaGUgbCdpbnRlcmVzc2F0byBuZWNlc3NpdGkgZGkgZWZmZXR0dWFyZSB1biBkdXBsaWNhdG8gZGVsbGEgcHJvcHJpYSBwYXRlbnRlIGRpIGd1aWRhIChvIHBlciBzbWFycmltZW50byBvIHBlciBkZXRlcmlvcmFtZW50bykgcG90clx1MDBFMCBlZmZldHR1YXJlIHByZXNzbyBpbCBub3N0cm8gc3R1ZGlvIGxhIHZpc2l0YSBwZXIgaWwgcmlsYXNjaW8gZGVsIGNlcnRpZmljYXRvIG1lZGljbyB1dGlsZSBhbGxhIHByYXRpY2EuIEwnaW50ZXJlc3NhdG8gZG92clx1MDBFMCB2ZW5pcmUgbXVuaXRvIGRpOjwvcD48dWwgY2xhc3M9J215LTYgbGlzdC1kaXNjIGxpc3QtaW5zaWRlJz48bGk+ZG9jdW1lbnRvIGQnaWRlbnRpdFx1MDBFMCBpbiBjb3JzbyBkaSB2YWxpZGl0XHUwMEUwOzwvbGk+PGxpPnVuYSBtYXJjYSBkYSBib2xsbyBkaSBcdTIwQUMgMTYuMDA7PC9saT48bGk+bnIuIDMgZm90by10ZXNzZXJlIHJlY2VudGk7PC9saT48bGk+b2NjaGlhbGkgbyBsZW50aSBhIGNvbnRhdHRvIHNlIG5lY2Vzc2FyaW8uPC9saT48L3VsPlwiXG4gICAgICB9LFxuICAgICAgXCJDZXJ0aWZpY2F0byBTUE9SVFwiOiBcIkkgc2FuaXRhcmkgZGVsbG8gU3R1ZGlvIE1lZGljbyBJenpvLUFyZHVpbm8gc29ubyBhdXRvcml6emF0aSBhbGxlIHZpc2l0ZSBtZWRpY2hlIGUgYWwgcmlsYXNjaW8gZGVsIGNlcnRpZmljYXRvIG1lZGljbyBwZXIgbCdpZG9uZWl0XHUwMEUwIGFsbCdhdHRpdml0XHUwMEUwIHNwb3J0aXZhIG5vbiBhZ29uaXN0aWNhLlwiLFxuICAgICAgXCJDZXJ0aWZpY2F0byBBUk1JXCI6IFwiSSBzYW5pdGFyaSBkZWxsbyBTdHVkaW8gTWVkaWNvIEl6em8tQXJkdWlubyBzb25vIGF1dG9yaXp6YXRpIGFsIHJpbGFzY2lvL3Jpbm5vdm8gZGVsIFBvcnRvIGQnQXJtaSwgc2lhIHBlciB1c28gc3BvcnRpdm8gZSBjYWNjaWEgKGFydC4gMSkgY2hlIGRpZmVzYSBwZXJzb25hbGUgKGFydC4gMiksIGUgbGEgZGV0ZW56aW9uZS5cIixcbiAgICAgIFwiQ2VydGlmaWNhdG8gVk9MT1wiOiBcIjxwPkkgc2FuaXRhcmkgZGVsbG8gU3R1ZGlvIE1lZGljbyBJenpvLUFyZHVpbm8gc29ubyBhdXRvcml6emF0aSBhbGxlIHZpc2l0ZSBtZWRpY2hlIGZpbmFsaXp6YXRlIGFsIHJpbGFzY2lvIGRlaSBzZWd1ZW50aSBjZXJ0aWZpY2F0aTo8L3A+PHVsIGNsYXNzPSdteS02IGxpc3QtZGlzYyBsaXN0LWluc2lkZSc+PGxpPmNlcnRpZmljYXppb25pIEVOQUMgZGkgSUkgQ2xhc3NlIChwaWxvdGEgcHJpdmF0byBkaSBhZXJvbW9iaWxpIC0gUFBMKTs8L2xpPjxsaT5jZXJ0aWZpY2F6aW9uaSBwZXIgdm9sbyBkYSBkaXBvcnRvIHNwb3J0aXZvICh1bHRyYWxlZ2dlcmkpOzwvbGk+PGxpPmNlcnRpZmljYXppb25pIHBlciBwYXJhY2FkdXRpc21vIHNwb3J0aXZvOzwvbGk+PGxpPmNlcnRpZmljYXppb25pIHBlciBjYWJpbiBjcmV3IG8gYXNzaXN0ZW50ZSBkaSB2b2xvOzwvbGk+PGxpPmNlcnRpZmljYXppb25pIHBlciBwaWxvdGkgZGkgdmVsaXZvbGkgYSBwaWxvdGFnZ2lvIHJlbW90byAoRFJPTkkpLjwvbGk+PC91bD5cIixcbiAgICAgIFwiQUxUUk9cIjogXCI8cD5JIHNhbml0YXJpIGRlbGxvIFN0dWRpbyBNZWRpY28gSXp6by1BcmR1aW5vIHNvbm8gYXV0b3JpenphdGkgYWxsZSB2aXNpdGUgbWVkaWNoZSBlZCBhbCByaWxhc2NpbyBkZWkgc2VndWVudGkgY2VydGlmaWNhdGkgbWVkaWNpOjwvcD48dWwgY2xhc3M9J215LTYgbGlzdC1kaXNjIGxpc3QtaW5zaWRlJz48bGk+Y2VydGlmaWNhdG8gbWVkaWNvIGRpIGlkb25laXRcdTAwRTAgc3BlY2lmaWNhIChzYW5hIGUgcm9idXN0YSBjb3N0aXR1emlvbmUgZmlzaWNhKSBhIHVuYSBkZXRlcm1pbmF0YSBhdHRpdml0XHUwMEUwIGxhdm9yYXRpdmEsIGNoZSBkaSBzb2xpdG8gdmllbmUgcmljaGllc3RvIGFsbCdpbnRlcmVzc2F0byBkYWwgZGF0b3JlIGRpIGxhdm9ybyBhbGwnYXR0byBkaSBhc3N1bnppb25lIChQdWJibGljYSBBbW1pbmlzdHJhemlvbmUsIFNjdW9sYSwgQ2FtZXJhIENvbW1lcmNpbywgZWNjLik7PC9saT48bGk+Y2VydGlmaWNhdG8gbWVkaWNvIGF0dGVzdGFudGUgdW5vIHN0YXRvIGRpIGJ1b25hIHNhbHV0ZSAoc2FuYSBlIHJvYnVzdGEgY29zdGl0dXppb25lIGZpc2ljYSkgZSB1biBnaXVkaXppbyBzYW5pdGFyaW8gZmF2b3Jldm9sZSBhbCByaWxhc2NpbyBkaSBwcmVzdGl0aSBlcm9nYXRpIGFpIGRpcGVuZGVudGkgZGEgRW50aSBwdWJibGljaSAoSU5QREFQKSBvIHNvY2lldFx1MDBFMCBwcml2YXRlLjwvbGk+PC91bD5cIlxuICAgIH1cbiAgfSxcbiAgY3J1bWJzOiBbXCJDZXJ0aWZpY2F0aVwiXSxcbiAgZmlsdGVyZWREYjogbnVsbCxcbiAgY3VycmVudENhcmRJbmRleDogMCxcbiAgZ2V0IGN1cnJlbnREYigpIHtcbiAgICByZXR1cm4gdGhpcy5maWx0ZXJlZERiIHx8IHRoaXMuZGJbXCJDZXJ0aWZpY2F0aVwiXVxuICB9LFxuICBnZXQgY2FyZHMoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGlzLmN1cnJlbnREYiA9PT0gJ3N0cmluZydcbiAgICAgID8gdGhpcy5jdXJyZW50RGJcbiAgICAgIDogT2JqZWN0LmtleXModGhpcy5jdXJyZW50RGIpXG4gIH0sXG4gIHN0YXJ0OiB7XG4gICAgW1wiQGNsaWNrLnByZXZlbnRcIl0oKSB7XG4gICAgICB0aGlzLmZpbHRlcmVkRGIgPSBudWxsXG4gICAgICB0aGlzLmNydW1icyA9IFtcIkNlcnRpZmljYXRpXCJdXG4gICAgICB0aGlzLmN1cnJlbnRDYXJkSW5kZXggPSAwXG4gICAgfSxcbiAgfSxcbiAgc2VsZWN0Q2FyZChjYXJkKSB7XG4gICAgdGhpcy5jcnVtYnMucHVzaChjYXJkKVxuICAgIHRoaXMuZmlsdGVyZWREYiA9IHRoaXMuY3VycmVudERiW2NhcmRdXG4gICAgdGhpcy5jdXJyZW50Q2FyZEluZGV4ID0gMFxuICB9LFxuICBzZWxlY3RDcnVtYihjcnVtYikge1xuICAgIGlmICh0aGlzLmNydW1icy5maW5kSW5kZXgoZSA9PiBlID09IGNydW1iKSA9PSB0aGlzLmNydW1icy5sZW5ndGgtMSlcbiAgICAgIHJldHVyblxuICAgIGNvbnN0IHRydW5jYXRlZENydW1icyA9IHRoaXMuY3J1bWJzLnNsaWNlKDAsIHRoaXMuY3J1bWJzLmZpbmRJbmRleChlID0+IGUgPT0gY3J1bWIpKzEpO1xuICAgIHRoaXMuZmlsdGVyZWREYiA9IG51bGw7XG4gICAgdGhpcy5jcnVtYnMgPSB0cnVuY2F0ZWRDcnVtYnMuc2xpY2UoMCwgLTEpLmxlbmd0aCBcbiAgICAgID8gdHJ1bmNhdGVkQ3J1bWJzLnNsaWNlKDAsIC0xKSBcbiAgICAgIDogW1wiQ2VydGlmaWNhdGlcIl07XG4gICAgdGhpcy5jdXJyZW50Q2FyZEluZGV4ID0gMDtcbiAgICB0cnVuY2F0ZWRDcnVtYnMuc2xpY2UoMSkuZm9yRWFjaChjcnVtYiA9PiB0aGlzLnNlbGVjdENhcmQoY3J1bWIpKTtcbiAgfVxufSk7XG4iLCAiaW1wb3J0IEFscGluZSBmcm9tICdhbHBpbmVqcydcbmltcG9ydCBjYXJkcyBmcm9tICcuL2NhcmRzLmpzJ1xud2luZG93LkFscGluZSA9IEFscGluZVxuQWxwaW5lLmRhdGEoJ2NhcmRzJywgY2FyZHMpXG5BbHBpbmUuc3RhcnQoKSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxNQUFJLGVBQWU7QUFDbkIsTUFBSSxXQUFXO0FBQ2YsTUFBSSxRQUFRLENBQUM7QUFDYixNQUFJLG1CQUFtQjtBQUN2QixXQUFTLFVBQVUsVUFBVTtBQUMzQixhQUFTLFFBQVE7QUFBQSxFQUNuQjtBQUNBLFdBQVMsU0FBUyxLQUFLO0FBQ3JCLFFBQUksQ0FBQyxNQUFNLFNBQVMsR0FBRztBQUNyQixZQUFNLEtBQUssR0FBRztBQUNoQixlQUFXO0FBQUEsRUFDYjtBQUNBLFdBQVMsV0FBVyxLQUFLO0FBQ3ZCLFFBQUksUUFBUSxNQUFNLFFBQVEsR0FBRztBQUM3QixRQUFJLFVBQVUsTUFBTSxRQUFRO0FBQzFCLFlBQU0sT0FBTyxPQUFPLENBQUM7QUFBQSxFQUN6QjtBQUNBLFdBQVMsYUFBYTtBQUNwQixRQUFJLENBQUMsWUFBWSxDQUFDLGNBQWM7QUFDOUIscUJBQWU7QUFDZixxQkFBZSxTQUFTO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBQ0EsV0FBUyxZQUFZO0FBQ25CLG1CQUFlO0FBQ2YsZUFBVztBQUNYLGFBQVMsSUFBSSxHQUFHLElBQUksTUFBTSxRQUFRLEtBQUs7QUFDckMsWUFBTSxDQUFDLEVBQUU7QUFDVCx5QkFBbUI7QUFBQSxJQUNyQjtB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VUFDakIsV0FBVztBQUFBLFVBQ1gsYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBLGFBQWE7QUFBQSxVQUNYLGlCQUFpQjtBQUFBLFVBQ2pCLFdBQVc7QUFBQSxVQUNYLGFBQVk7QUFBQSxRQUNkO0FBQUEsUUFDQSxpQkFBaUI7QUFBQSxVQUNmLGlCQUFpQjtBQUFBLFVBQ2pCLFdBQVc7QUFBQSxVQUNYLGFBQVk7QUFBQSxRQUNkO0FBQUEsUUFDQSxxQkFBcUI7QUFBQSxRQUNyQixvQkFBb0I7QUFBQSxRQUNwQixvQkFBb0I7QUFBQSxRQUNwQixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVEsQ0FBQyxhQUFhO0FBQUEsSUFDdEIsWUFBWTtBQUFBLElBQ1osa0JBQWtCO0FBQUEsSUFDbEIsSUFBSSxZQUFZO0FBQ2QsYUFBTyxLQUFLLGNBQWMsS0FBSyxHQUFHLGFBQWE7QUFBQSxJQUNqRDtBQUFBLElBQ0EsSUFBSSxRQUFRO0FBQ1YsYUFBTyxPQUFPLEtBQUssY0FBYyxXQUM3QixLQUFLLFlBQ0wsT0FBTyxLQUFLLEtBQUssU0FBUztBQUFBLElBQ2hDO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxDQUFDLGdCQUFnQixJQUFJO0FBQ25CLGFBQUssYUFBYTtBQUNsQixhQUFLLFNBQVMsQ0FBQyxhQUFhO0FBQzVCLGFBQUssbUJBQW1CO0FBQUEsTUFDMUI7QUFBQSxJQUNGO0FBQUEsSUFDQSxXQUFXLE1BQU07QUFDZixXQUFLLE9BQU8sS0FBSyxJQUFJO0FBQ3JCLFdBQUssYUFBYSxLQUFLLFVBQVUsSUFBSTtBQUNyQyxXQUFLLG1CQUFtQjtBQUFBLElBQzFCO0FBQUEsSUFDQSxZQUFZLE9BQU87QUFDakIsVUFBSSxLQUFLLE9BQU8sVUFBVSxPQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssT0FBTyxTQUFPO0FBQy9EO0FBQ0YsWUFBTSxrQkFBa0IsS0FBSyxPQUFPLE1BQU0sR0FBRyxLQUFLLE9BQU8sVUFBVSxPQUFLLEtBQUssS0FBSyxJQUFFLENBQUM7QUFDckYsV0FBSyxhQUFhO0FBQ2xCLFdBQUssU0FBUyxnQkFBZ0IsTUFBTSxHQUFHLEVBQUUsRUFBRSxTQUN2QyxnQkFBZ0IsTUFBTSxHQUFHLEVBQUUsSUFDM0IsQ0FBQyxhQUFhO0FBQ2xCLFdBQUssbUJBQW1CO0FBQ3hCLHNCQUFnQixNQUFNLENBQUMsRUFBRSxRQUFRLENBQUFBLFdBQVMsS0FBSyxXQUFXQSxNQUFLLENBQUM7QUFBQSxJQUNsRTtBQUFBLEVBQ0Y7OztBQ3pFQSxTQUFPLFNBQVM7QUFDaEIsaUJBQU8sS0FBSyxTQUFTLGFBQUs7QUFDMUIsaUJBQU8sTUFBTTsiLAogICJuYW1lcyI6IFsiY3J1bWIiXQp9Cg==
