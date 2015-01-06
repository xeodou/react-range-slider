// @credits: https://github.com/mzabriskie/react-draggable/blob/master/lib/draggable.js#L51-L120

var event = {};

// @credits: http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript/4819886#4819886
/* Conditional to fix node server side rendering of component */
event.isTouchDevice = function () {
  var isTouchDevice = false;
  // Check if is Browser
  if (typeof window !== 'undefined') {
    isTouchDevice = 'ontouchstart' in window // works on most browsers
      || 'onmsgesturechange' in window; // works on ie10 on ms surface
  }
  return isTouchDevice;
}

/**
 * simple abstraction for dragging events names
 * */
event.dragEventFor = (function () {
  var eventsFor = {
    touch: {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend'
    },
    mouse: {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup'
    }
  };
  return eventsFor[event.isTouchDevice() ? 'touch' : 'mouse'];
})()

event.addEvent = function (el, event, handler) {
  if (!el) {
    return;
  }
  if (el.attachEvent) {
    el.attachEvent('on' + event, handler);
  } else if (el.addEventListener) {
    el.addEventListener(event, handler, true);
  } else {
    el['on' + event] = handler;
  }
}

event.removeEvent = function (el, event, handler) {
  if (!el) {
    return;
  }
  if (el.detachEvent) {
    el.detachEvent('on' + event, handler);
  } else if (el.removeEventListener) {
    el.removeEventListener(event, handler, true);
  } else {
    el['on' + event] = null;
  }
}

module.exports = event;
