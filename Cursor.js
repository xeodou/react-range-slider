var React = require('react');
var assign = require('object-assign');
var PropTypes = React.PropTypes;
var emptyFunction = require('fbjs/lib/emptyFunction');

var Cursor = React.createClass({

  displayName: 'RangeSliderCursor',

  propTypes: {
    axis: PropTypes.oneOf(['X', 'Y']),
    offset: PropTypes.number,
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func,
    value: PropTypes.number
  },

  getDefaultProps: function () {
    return {
      axis: 'X',
      offset: 0,
      size: 0,
      position: 0,
      onDragStart: emptyFunction,
      onDragEnd: emptyFunction
    };
  },

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
    props.onMouseDown = this.props.onDragStart;
    props.onTouchStart = function (e) {
      e.preventDefault(); // prevent for scroll
      return this.props.onDragStart.apply(null, arguments);
    }.bind(this);
    props.onMouseUp = this.props.onDragEnd;
    props.onTouchEnd = this.props.onDragEnd;
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
