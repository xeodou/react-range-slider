var React = require('react');
var assign = require('object-assign');
var PropTypes = React.PropTypes;
var event = require('./event');

var noop = function () {}
var buildUnwrappingListener = function(listener) {
  return function(e) {
    var unwrappedEvent = e.changedTouches[e.changedTouches.length - 1];
    unwrappedEvent.stopPropagation = e.stopPropagation.bind(e);
    unwrappedEvent.preventDefault = e.preventDefault.bind(e);
    return listener(unwrappedEvent);
  };
}

var Cursor = React.createClass({

  displayName: 'RangeSliderCursor',

  propTypes: {
    axis: PropTypes.oneOf(['X', 'Y']),
    offset: PropTypes.number,
    onDragStart: PropTypes.func,
    onDrag: PropTypes.func,
    onDragEnd: PropTypes.func,
    value: PropTypes.number
  },

  getDefaultProps: function () {
    return {
      axis: 'X',
      offset: 0,
      size: 0,
      position: 0,
      onDragStart: noop,
      onDragEnd: noop
    };
  },

  // Mixin events
  mixins: [event],

  getStyle: function () {
    var transform = 'translate' + this.props.axis + '(' + this.props.offset + 'px)';
    return {
      WebkitTransform: transform,
      MozTransform: transform,
      msTransform: transform,
      OTransform: transform,
      transform: transform,
      position: 'absolute'
    }
  },

  getProps: function () {
    var props = assign({}, this.props);
    var i = this.props.position;
    var l = this.props.size;
    props.style = this.getStyle();

    var mousemoveListener, touchmoveListener, mouseupListener, touchendListener;
    props.onMouseDown = function () {
      this.addEvent(window, 'mousemove', mousemoveListener);
      this.addEvent(window, 'touchmove', touchmoveListener);
      this.addEvent(window, 'mouseup', mouseupListener);
      this.addEvent(window, 'touchend', touchendListener);

      return props.onDragStart.apply(null, arguments);
    }.bind(this);

    props.onTouchStart = function (e) {
      e.preventDefault(); // prevent for scroll
      return buildUnwrappingListener(props.onMouseDown)(e);
    }.bind(this);

    mousemoveListener = props.onDrag;
    touchmoveListener = buildUnwrappingListener(mousemoveListener);

    mouseupListener = function () {
      this.removeEvent(window, 'mousemove', mousemoveListener);
      this.removeEvent(window, 'touchmove', touchmoveListener);
      this.removeEvent(window, 'mouseup', mouseupListener);
      this.removeEvent(window, 'touchend', touchendListener);

      return props.onDragEnd.apply(null, arguments);
    }.bind(this);
    touchendListener = buildUnwrappingListener(mouseupListener);

    props.zIndex = (i === 0 || i === l + 1) ? 0 : i + 1;
    return props;
  },

  render: function () {
    return (
      React.createElement('div', this.getProps(),
        React.createElement('span', null,
          React.createElement('span', null,
            this.props.value)
        )
      )
    );
  }

});

module.exports = Cursor;
