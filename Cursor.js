var React = require('react');
var PropTypes = React.PropTypes;
var emptyFunction = require('react/lib/emptyFunction');

var Cursor = React.createClass({

  displayName: 'RangeSliderCursor',

  propTypes: {
    axis: PropTypes.oneOf(['X', 'Y']),
    offset: PropTypes.number,
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func
  },

  getDefaultProps: function () {
    return {
      axis: 'X',
      offset: 0,
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

  render: function () {
    var props = this.props;
    props.style = this.getStyle();
    props.onMouseDown = this.props.onDragStart;
    props.onTouchStart = function (e) {
      e.preventDefault(); // prevent for scroll
      return this.props.onDragStart.apply(null, arguments);
    }.bind(this);
    props.onMouseUp = this.props.onDragEnd;
    props.onTouchEnd = this.props.onDragEnd;
    return (
      React.createElement('div', props, this.props.children)
    );
  }

});

module.exports = Cursor;
