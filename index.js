/*
 * react-range-slider - index.js
 * Copyright(c) 2015 xeodou <xeodou@gmail.com>
 * MIT Licensed
 */

var React = require('react');
var PropTypes = React.PropTypes;
var assign = require('object-assign');
var event = require('./event');
var Cursor = React.createFactory(require('./Cursor'));

var noop = function () {}

/**
 * To prevent text selection while dragging.
 * @credits: http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
 */
function pauseEvent(e) {
  if (e.stopPropagation) e.stopPropagation();
  if (e.preventDefault) e.preventDefault();
  e.cancelBubble = true;
  e.returnValue = false;
  return false;
}

/**
 * Format [1, 2] or ['#FFF', '#FAD']
 * To [{value:1, color: null}] or [{value: '20%', color: '#FFF'}]
 */
function valueFormat(value, max, min) {
  value = typeof value === 'number' ? [value] : value;
  return value.map(function (v, i) {
    return typeof v === 'object' ? v : {
      value: typeof v === 'number' ? v : (parseInt((i + 1) * (max - min) / value.length, 10) + min),
      color: typeof v === 'string' ? v : ''
    };
  });
  // TO Do: Sort ?
  // .sort(function(a, b) {
  //   return parseInt(a.value) - parseInt(b.value);
  // })
}

/**
 * Find min and max in an object.
 * @credits: http://stackoverflow.com/questions/8864430/compare-javascript-array-of-objects-to-get-min-max
 */
function finder(cmp, arr, attr) {
  var val = arr[0] ? arr[0][attr] || 0 : 0;
  for (var i = 1; i < arr.length; i++) {
    val = cmp(val, arr[i][attr])
  }
  return val;
}

var RangeSlider = React.createClass({

  displayName: 'RangeSlider',

  propTypes: {
    /**
     * Min value for slider, default is 0.
     * Example:
     *
     * ```
     *  <RangeSlider min=0/>
     *
     * ```
     */
    min: PropTypes.number,
    /**
     * Max value for slider, default is 100.
     * Example:
     *
     * ```
     *  <RangeSlider max=999/>
     *
     * ```
     */
    max: PropTypes.number,
    /**
     * Define the value, can be string or array
     *
     * Example:
     *
     * ```
     *  <RangeSlider value=[10,20]/>
     *  or
     *  <RangeSlider value=[{value:10, color: '#FFF'}] />
     *  or
     *  <RangeSlider value=['#FFF', '#FFS'] />
     * ```
     */
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.number),
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(PropTypes.shape({
          value: PropTypes.number,
          color: PropTypes.string
        }))
      ])
    ]),
    /**
     * Orientation for slider, must be horizontal or vertical, default is horizontal.
     * Example:
     *
     * ```
     *  <RangeSlider orientation='vertical'/>
     *
     * ```
     */
    orientation: PropTypes.oneOf(['horizontal', 'vertical']),
    /**
     * Options is slider show the bars or not, default false.
     */
    withBars: PropTypes.bool,
    /**
     * Options is slider show the cursors or not, default false.
     * You can also set up a custom cursor and implement like
     * ./Cursor.js
     */
    cursor: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.element
    ]),
    /**
     * Options disable slider, default false.
     * If set diabled with true cursors in the slider will unable to drag.
     */
    disabled: PropTypes.bool,
    /**
     *
     * Range for slider, menas you can set header or tailer cursor or both, something like blow:
     *        -|-----------|-
     * Example:
     *
     * ```
     *  <RangeSlider range />
     *  or
     *  <RangeSlider range={[true, false]} />
     *  or
     *  <RangeSlider range={[10, 90]} />
     *
     * ```
     */
    range: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.arrayOf(PropTypes.bool),
      PropTypes.arrayOf(PropTypes.number)
    ]),
    /**
     * Disable slider header cursor.
     *
     * Example:
     * ```
     *  <RangeSlider range={[10]} disabledHeader/>
     * ```
     */
    disabledHeader: PropTypes.bool,
    /**
     * Disable slider tailer cursor.
     *
     * Example:
     * ```
     *  <RangeSlider range={[null, 90]} disabledTailer/>
     * ```
     */
    disabledTailer: PropTypes.bool,
    /**
     * Slider classname
     *
     * Example:
     * ```
     *  <RangeSlider className="custom-slider" />
     * ```
     */
    className: PropTypes.string,
    /**
     * Hook event for when mouse down for each cursor.
     *
     * Example:
     * ```
     *  <RangeSlider onMouseDown={somefunction} />
     * ```
     */
    onMouseDown: PropTypes.func,
    /**
     * Hook function before cursor dragging.
     */
    onBeforeChange: PropTypes.func,
    /**
     * Hook function when cursor dragging.
     */
    onChange: PropTypes.func,
    /**
     * Hook function after cursor dragging.
     */
    onAfterChange: PropTypes.func,
    /**
     * Click event for each bar.
     *
     * Example:
     * ```
     *   <RangeSlider onBarClick={somefunction(evt[, index, color])} />
     * ```
     * @param {Object} Event click event instance.
     * @param {Number} Index Index of the clicked bar.
     * @param {String} Color Clicked bar's background color.
     */
    onBarClick: PropTypes.func
  },

  getDefaultProps: function () {
    return {
      min: 0,
      max: 100,
      value: [],
      defaultValue: 0,
      orientation: 'horizontal',
      withBars: false,
      cursor: false,
      pearling: false,
      disabled: false,
      className: 'range-slider',
      onBeforeChange: noop,
      onChange: noop,
      onAfterChange: noop,
      onBarClick: noop,
      onMouseDown: noop
    };
  },

  // Mixin events
  mixins: [event],

  getInitialState: function () {
    return {
      index: -1, // TODO: find better solution
      clicked: -1,
      upperBound: 0,
      axis: this.isHorizontal() ? 'X' : 'Y',
      minProp: this.isHorizontal() ? 'left' : 'top',
      maxProp: this.isHorizontal() ? 'right' : 'bottom',
      value: []
    };
  },

  isHorizontal: function () {
    return this.props.orientation !== 'vertical';
  },

  componentWillMount: function () {
    this.componentWillReceiveProps(this.props)
    this.addEvent(window, 'resize', this.handleResize);
  },

  componentWillReceiveProps: function (nextProps) {
    var range = nextProps.range || this.props.range,
      range = (range ? (typeof range === 'boolean' ? [range, range] : range) : []),
      header = range[0],
      tailer = range[1],
      min = nextProps.min || this.props.min,
      max = nextProps.max || this.props.max,
      min = typeof header === 'number' ? Math.max(header, min) : min,
      max = typeof tailer === 'number' ? Math.min(Math.max(tailer, min), max) : max;
    this.setState({
      min: min,
      max: max,
      header: header,
      tailer: tailer,
      value: valueFormat(nextProps.value || this.props.value, max, min)
    }, function () {
      // Calculate the bound size again, if the bound size less than 0
      if (this.state.upperBound <= 0) {
        this.handleResize();
      }
    }.bind(this));
  },

  componentDidMount: function () {
    this.handleResize();
  },

  componentWillUnmount: function () {
    this.removeEvent(window, 'resize', this.handleResize);
  },

  getValue: function () {
    return this.state.value
  },

  handleResize: function () {
    var slider = this.refs.slider;
    var handle = this.refs.header ? this.refs.header : {};
    var rect = slider.getBoundingClientRect();

    var size = this.isHorizontal() ? 'clientWidth' : 'clientHeight';

    var sliderMax = rect[this.props.maxProp] - (handle[size] || 0);
    var sliderMin = rect[this.props.minProp];

    this.setState({
      upperBound: slider[size] - (handle[size] || 0)
    });
  },

  handleDragStart: function (i, e) {
    if (this.props.disabled) return;
    // Make it possible to attach event handlers on top of this one
    this.props.onMouseDown(e);
    e = this.isTouchDevice() ? e.changedTouches[e.changedTouches.length - 1] : e;
    var position = e['page' + this.state.axis];
    var value = this.state.min,
      l = this.state.value.length;
    if (l != 0 && 0 < i && i <= l) {
      value = this.state.value[i - 1].value;
    } else if (i === l + 1) {
      value = this.state.max;
    }
    this.setState({
      startValue: value,
      startPosition: position,
      index: i,
      clicked: -1
    });

    this.props.onBeforeChange(e, i - 1);

    // Add event handlers
    this.addEvent(window, this.dragEventFor['move'], this.handleDrag);
    this.addEvent(window, this.dragEventFor['end'], this.handleDragEnd);
    pauseEvent(e);
  },

  handleDrag: function (e) {
    if (this.props.disabled) return;

    e = this.isTouchDevice() ? e.changedTouches[e.changedTouches.length - 1] : e;
    var position = e['page' + this.state.axis],
      diffPosition = position - this.state.startPosition,
      diffValue = (diffPosition / this.state.upperBound) * (this.props.max - this.props.min),
      i = this.state.index,
      l = this.state.value.length;
    // Cursor position after moved
    var _v = this.state.startValue + diffValue;
    if (i === 0) {
      // Move header
      if (this.props.disabledHeader) return;
      var v = l > 0 ? finder(Math.min, this.state.value, 'value') : this.state.max;
      this.setState({
        min: parseInt(Math.max(_v <= v ? (_v < 0 ? 0 : _v) : v, this.props.min), 10)
      });
    } else if (0 < i < l) {
      // Move cursor
      // The cursor postion must smaller than the next cursor or this.state.max
      // bigger than the previous cursor or this.state.min
      var value = this.state.value;
      // var v = value[i - 1].value;
      var min = (value[i - 2] ? value[i - 2].value : this.state.min);
      var max = value[i] ? value[i].value : this.state.max;
      value[i - 1].value = parseInt(Math.max(Math.min(_v, max), min), 10);
      this.setState({
        value: value
      });
    } else if (i === l + 1) {
      // Move tailer
      if (this.props.disabledTailer) return;
      var v = l > 0 ? finder(Math.max, this.state.value, 'value') : this.state.min;
      this.setState({
        max: parseInt(Math.min(_v >= v ? _v : v, this.props.max))
      });
    }

    this.props.onChange(e, i - 1, this.state.value);
  },

  handleDragEnd: function (e) {
    this.setState({
      index: -1
    });

    this.props.onAfterChange(e, this.state.value);

    // Remove event handlers
    this.removeEvent(window, this.dragEventFor['move'], this.handleDrag);
    this.removeEvent(window, this.dragEventFor['end'], this.handleDragEnd);
    e.stopPropagation();
  },

  handleBarClick: function (i, e) {
    this.setState({
      clicked: i
    });
    this.props.onBarClick(e, i, this.state.value[i]);
  },

  renderCursors: function (offsets) {
    var cursors = [];
    var l = this.state.value.length;
    var opts = {
      axis: this.state.axis,
      size: l,
      onDragEnd: this.handleDragEnd
    };
    var className = this.props.className + '__cursor';
    if (this.props.cursor) {
      cursors = offsets.map(function (offset, i) {
        return Cursor(assign({}, opts, {
          offset: offset,
          position: i + 1,
          ref: 'cursor' + (i + 1),
          key: 'cursor' + (i + 1),
          className: className + ' ' + className + '_' + (i + 1),
          value: this.state.value[i] ? this.state.value[i].value : null,
          onDragStart: this.handleDragStart.bind(null, i + 1),
        }))
      }, this);
    }
    if (this.state.header) {
      cursors.splice(0, 0, Cursor(assign({}, opts, {
        offset: this.calcOffset(this.state.min),
        position: 0,
        ref: 'header',
        key: 'header',
        className: className + ' ' + className + '_header',
        value: this.state.min,
        onDragStart: this.handleDragStart.bind(null, 0)
      })));
    }
    if (this.state.tailer) {
      var l = cursors.length;
      cursors.push(Cursor(assign({}, opts, {
        offset: this.calcOffset(this.state.max),
        position: l,
        ref: 'tailer',
        key: 'tailer',
        className: className + ' ' + className + '_tailer',
        value: this.state.max,
        onDragStart: this.handleDragStart.bind(null, l + 1)
      })))
    }
    return cursors;
  },

  // calculates the offset of a handle in pixels based on its value.
  calcOffset: function (v) {
    if (typeof v === 'undefined') return;
    v = typeof v === 'number' ? v : v.value;
    var ratio = (v - this.props.min) / (this.props.max - this.props.min);
    return ratio * this.state.upperBound;
  },

  renderBar: function (from, to, i) {
    var style = {
      position: 'absolute',
      backgroundColor: this.state.value.length > 0 ? this.state.value[i].color : null
    };
    style[this.state.minProp] = from;
    style[this.state.maxProp] = this.state.upperBound - to;
    var className = this.props.className + '__bar';
    var modClassName = className + ' ' + className + '_';
    return React.createElement('div', {
      key: 'bar' + i,
      ref: 'bar' + i,
      className: modClassName + i + (this.state.clicked === i ? ' ' + className + '_active' : ''),
      style: style,
      onClick: this.handleBarClick.bind(this, i)
    });
  },

  renderBars: function (offsets) {
    var minOffset = this.calcOffset(this.state.min);
    var bars = offsets.map(function (offset, i) {
      return this.renderBar(offsets[i - 1] || minOffset, offset, i)
    }, this);
    if (bars.length === 0) {
      bars.push(this.renderBar(minOffset, this.calcOffset(this.state.max), 0));
    }
    return bars;
  },

  render: function () {
    var offsets = this.state.value.map(this.calcOffset, this);
    var bars = this.props.withBars ? this.renderBars(offsets) : null;
    var cursors = this.renderCursors(offsets);
    var className = this.props.className;

    return (
      React.createElement('div', {
          ref: 'slider',
          style: {
            position: 'relative'
          },
          className: className + ' ' + className + '_' + this.props.orientation
        },
        React.createElement('div', {
          className: className + '__bars'
        }, bars),
        cursors
      )
    );
  }
});

module.exports = RangeSlider;
