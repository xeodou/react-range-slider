// @credits: https://github.com/mzabriskie/react-draggable/blob/master/lib/draggable.js#L51-L120

var event = {};

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
